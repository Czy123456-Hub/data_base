from __future__ import annotations

import json
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
IMPORT_DIR = ROOT / "cloudbase" / "import"
CREATED_AT = "2026-07-08T00:00:00+08:00"


def parse_sql_values(block: str) -> list[list[Any]]:
    rows: list[list[Any]] = []
    index = 0

    while index < len(block):
      # Skip separators before each tuple.
        while index < len(block) and block[index] in " \t\r\n,":
            index += 1
        if index >= len(block):
            break
        if block[index] != "(":
            raise ValueError(f"Expected '(' at offset {index}: {block[index:index + 40]!r}")
        index += 1
        row: list[Any] = []

        while index < len(block):
            while index < len(block) and block[index] in " \t\r\n":
                index += 1

            if block[index] == "'":
                value, index = parse_sql_string(block, index)
            else:
                start = index
                while index < len(block) and block[index] not in ",)":
                    index += 1
                token = block[start:index].strip()
                value = parse_sql_token(token)
            row.append(value)

            while index < len(block) and block[index] in " \t\r\n":
                index += 1
            if block[index] == ",":
                index += 1
                continue
            if block[index] == ")":
                index += 1
                rows.append(row)
                break

    return rows


def parse_sql_string(text: str, index: int) -> tuple[str, int]:
    assert text[index] == "'"
    index += 1
    chars: list[str] = []
    while index < len(text):
        char = text[index]
        if char == "'":
            if index + 1 < len(text) and text[index + 1] == "'":
                chars.append("'")
                index += 2
                continue
            return "".join(chars), index + 1
        chars.append(char)
        index += 1
    raise ValueError("Unterminated SQL string")


def parse_sql_token(token: str) -> Any:
    if token.lower() == "null":
        return None
    try:
        if "." in token:
            return float(token)
        return int(token)
    except ValueError:
        return token


def extract_values(sql: str, marker: str) -> list[list[Any]]:
    start = sql.index(marker)
    values_start = sql.index("values", start) + len("values")
    end = sql.index(")\ninsert into", values_start)
    return parse_sql_values(sql[values_start:end])


def write_collection(name: str, docs: list[dict[str, Any]]) -> None:
    IMPORT_DIR.mkdir(parents=True, exist_ok=True)
    json_path = IMPORT_DIR / f"{name}.json"
    jsonl_path = IMPORT_DIR / f"{name}.jsonl"
    json_path.write_text(json.dumps(docs, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    jsonl_path.write_text(
        "".join(json.dumps(doc, ensure_ascii=False) + "\n" for doc in docs),
        encoding="utf-8",
    )
    print(f"{name}: {len(docs)} docs")


def build_database_modules() -> list[dict[str, Any]]:
    return [
        {
            "_id": "capacity_license_ratio",
            "slug": "capacity_license_ratio",
            "name": "备案产能和自动进口证发放比例",
            "description": "维护备案企业产能、2025/2026 自动进口许可证额度和发放比例。",
            "is_editable": True,
            "created_at": CREATED_AT,
            "updated_at": CREATED_AT,
        },
        {
            "_id": "port_agency_info",
            "slug": "port_agency_info",
            "name": "港口与船代信息",
            "description": "维护港口吃水、码头泊位、最大载重吨、特殊要求和船代通讯录。",
            "is_editable": True,
            "created_at": CREATED_AT,
            "updated_at": CREATED_AT,
        },
    ]


def build_enterprises() -> list[dict[str, Any]]:
    sql = (ROOT / "supabase" / "migrations" / "20260706001000_seed_license_allocations.sql").read_text(encoding="utf-8")
    rows = extract_values(sql, "rows(code, enterprise_name, province, city, region_label, capacity_10k_tons, license_2025_tons, license_2026_tons, group_name)")
    docs = []
    for row in rows:
        code, enterprise_name, province, city, region_label, capacity, license_2025, license_2026, group_name = row
        docs.append(
            {
                "_id": code,
                "id": code,
                "module_id": "capacity_license_ratio",
                "module_slug": "capacity_license_ratio",
                "code": code,
                "enterprise_name": enterprise_name,
                "province": province,
                "city": city,
                "region_label": region_label,
                "group_name": group_name,
                "capacity_10k_tons": capacity,
                "license_2025_tons": license_2025,
                "license_2026_tons": license_2026,
                "status": "已备案",
                "source_document": "2026年自动进口许可证发放情况0519.xlsx",
                "notes": None,
                "created_at": CREATED_AT,
                "updated_at": CREATED_AT,
            }
        )
    return docs


def build_port_data() -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    sql = (ROOT / "supabase" / "migrations" / "20260706003000_seed_port_logistics.sql").read_text(encoding="utf-8")
    berth_rows = extract_values(sql, "rows (code, location, port_name, terminal_name, berth, draft_m, max_dwt_tons, summer_density, special_requirements)")
    agent_rows = extract_values(sql, "rows (code, port_name, agency_name, address, tel, fax, email, contact_persons, raw_text)")

    berths = []
    for row in berth_rows:
        code, location, port_name, terminal_name, berth, draft_m, max_dwt_tons, summer_density, special_requirements = row
        berths.append(
            {
                "_id": code,
                "id": code,
                "module_id": "port_agency_info",
                "module_slug": "port_agency_info",
                "code": code,
                "location": location,
                "port_name": port_name,
                "terminal_name": terminal_name,
                "berth": berth,
                "draft_m": draft_m,
                "max_dwt_tons": max_dwt_tons,
                "summer_density": summer_density,
                "special_requirements": special_requirements,
                "source_document": "中国港口信息.xlsx",
                "notes": None,
                "created_at": CREATED_AT,
                "updated_at": CREATED_AT,
            }
        )

    agents = []
    for row in agent_rows:
        code, port_name, agency_name, address, tel, fax, email, contact_persons, raw_text = row
        agents.append(
            {
                "_id": code,
                "id": code,
                "module_id": "port_agency_info",
                "module_slug": "port_agency_info",
                "code": code,
                "port_name": port_name,
                "agency_name": agency_name,
                "address": address,
                "tel": tel,
                "fax": fax,
                "email": email,
                "contact_persons": contact_persons,
                "raw_text": raw_text,
                "source_document": "中国港口信息.xlsx",
                "notes": None,
                "created_at": CREATED_AT,
                "updated_at": CREATED_AT,
            }
        )

    return berths, agents


def main() -> None:
    port_berths, shipping_agents = build_port_data()
    collections = {
        "database_modules": build_database_modules(),
        "enterprises": build_enterprises(),
        "port_berths": port_berths,
        "shipping_agents": shipping_agents,
        "profiles": [],
        "record_audit_logs": [],
    }
    for name, docs in collections.items():
        write_collection(name, docs)


if __name__ == "__main__":
    main()
