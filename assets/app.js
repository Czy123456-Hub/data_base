const MODULE_SLUG = "capacity_license_ratio";

const MODULES = {
  capacity: {
    title: "备案产能和自动进口证发放比例",
  },
  contracts: {
    title: "进口合同与报告台账",
    columns: ["合同编号", "企业名称", "品种", "合同数量", "报告状态", "报告日期"],
    fields: ["合同编号", "企业名称", "品种", "合同数量", "报告状态", "附件"],
  },
  licenseBalance: {
    title: "自动证扣减与余量",
    columns: ["许可证号", "企业名称", "核发额度", "已扣减", "剩余额度", "状态"],
    fields: ["许可证号", "企业名称", "核发额度", "已扣减", "剩余额度", "扣减日期"],
  },
  vessels: {
    title: "船期到港与执行进度",
    columns: ["船名", "企业名称", "装港", "目的港", "预计到港", "执行状态"],
    fields: ["船名", "企业名称", "装港", "目的港", "预计到港", "执行状态"],
  },
  documents: {
    title: "附件资料库",
    columns: ["文件名称", "所属模块", "文件类型", "上传人", "上传日期", "状态"],
    fields: ["文件名称", "所属模块", "文件类型", "上传人", "上传日期", "备注"],
  },
};

const state = {
  supabase: null,
  session: null,
  profile: null,
  module: null,
  records: [],
  history: [],
  selectedId: null,
  activeModule: "capacity",
};

const refs = {
  setupPanel: document.querySelector("#setupPanel"),
  authPanel: document.querySelector("#authPanel"),
  appShell: document.querySelector("#appShell"),
  authForm: document.querySelector("#authForm"),
  authMessage: document.querySelector("#authMessage"),
  roleBadge: document.querySelector("#roleBadge"),
  userEmail: document.querySelector("#userEmail"),
  signOutBtn: document.querySelector("#signOutBtn"),
  moduleTitle: document.querySelector("#moduleTitle"),
  moduleName: document.querySelector("#moduleName"),
  moduleCards: document.querySelectorAll(".module-card"),
  capacityModule: document.querySelector("#capacityModule"),
  reservedModule: document.querySelector("#reservedModule"),
  reservedModuleName: document.querySelector("#reservedModuleName"),
  reservedTableHead: document.querySelector("#reservedTableHead"),
  reservedTableBody: document.querySelector("#reservedTableBody"),
  reservedFieldList: document.querySelector("#reservedFieldList"),
  moduleRecordCount: document.querySelector("#moduleRecordCount"),
  searchInput: document.querySelector("#searchInput"),
  regionFilter: document.querySelector("#regionFilter"),
  groupFilter: document.querySelector("#groupFilter"),
  capacityFilter: document.querySelector("#capacityFilter"),
  exportBtn: document.querySelector("#exportBtn"),
  recordsBody: document.querySelector("#recordsBody"),
  emptyDetail: document.querySelector("#emptyDetail"),
  recordDetail: document.querySelector("#recordDetail"),
  enterpriseForm: document.querySelector("#enterpriseForm"),
  saveRecordBtn: document.querySelector("#saveRecordBtn"),
  resetFormBtn: document.querySelector("#resetFormBtn"),
  deleteRecordBtn: document.querySelector("#deleteRecordBtn"),
  recordMessage: document.querySelector("#recordMessage"),
  historyBody: document.querySelector("#historyBody"),
  refreshHistoryBtn: document.querySelector("#refreshHistoryBtn"),
  historyMessage: document.querySelector("#historyMessage"),
  metricCount: document.querySelector("#metricCount"),
  metricCapacity: document.querySelector("#metricCapacity"),
  metricLicense2025: document.querySelector("#metricLicense2025"),
  metricRatio2025: document.querySelector("#metricRatio2025"),
  metricLicense2026: document.querySelector("#metricLicense2026"),
  metricRatio2026: document.querySelector("#metricRatio2026"),
  profileEmail: document.querySelector("#profileEmail"),
  profileRole: document.querySelector("#profileRole"),
};

init();

async function init() {
  wireUi();
  const config = window.SUPABASE_CONFIG || {};
  if (!isConfigured(config)) {
    refs.setupPanel.classList.remove("hidden");
    refs.authPanel.classList.add("hidden");
    refs.appShell.classList.add("hidden");
    return;
  }

  const { createClient } = await import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm");
  state.supabase = createClient(config.url, config.anonKey);

  const { data } = await state.supabase.auth.getSession();
  await applySession(data.session);
  state.supabase.auth.onAuthStateChange((_event, session) => {
    applySession(session);
  });
}

function isConfigured(config) {
  return Boolean(
    config.url
      && config.anonKey
      && !config.url.includes("YOUR-PROJECT-REF")
      && !config.anonKey.includes("YOUR_PUBLIC"),
  );
}

function wireUi() {
  document.querySelectorAll(".tab[data-view]").forEach((tab) => {
    tab.addEventListener("click", () => activateView(tab.dataset.view));
  });

  refs.moduleCards.forEach((card) => {
    card.addEventListener("click", () => selectModule(card.dataset.module));
  });
  refs.authForm.addEventListener("submit", (event) => handleAuth(event, "signin"));
  refs.authForm.querySelector("[data-auth-mode='signup']").addEventListener("click", (event) => handleAuth(event, "signup"));
  refs.signOutBtn.addEventListener("click", signOut);

  [refs.searchInput, refs.regionFilter, refs.groupFilter, refs.capacityFilter].forEach((input) => {
    input.addEventListener("input", renderRecords);
  });

  ["capacity_10k_tons", "license_2025_tons", "license_2026_tons"].forEach((name) => {
    refs.enterpriseForm.elements[name].addEventListener("input", renderFormRatios);
  });

  refs.exportBtn.addEventListener("click", () => exportCsv(getFilteredRecords()));
  refs.enterpriseForm.addEventListener("submit", saveRecord);
  refs.resetFormBtn.addEventListener("click", () => setFormRecord(null));
  refs.deleteRecordBtn.addEventListener("click", deleteRecord);
  refs.refreshHistoryBtn.addEventListener("click", loadHistory);
}

function selectModule(moduleKey) {
  const key = MODULES[moduleKey] ? moduleKey : "capacity";
  state.activeModule = key;

  refs.moduleCards.forEach((card) => {
    const active = card.dataset.module === key;
    card.classList.toggle("active", active);
    card.setAttribute("aria-current", active ? "true" : "false");
  });

  if (key === "capacity") {
    refs.capacityModule.classList.add("active");
    refs.capacityModule.classList.remove("hidden");
    refs.reservedModule.classList.remove("active");
    refs.reservedModule.classList.add("hidden");
    refs.moduleTitle.textContent = state.module?.name || MODULES.capacity.title;
    return;
  }

  refs.capacityModule.classList.remove("active");
  refs.capacityModule.classList.add("hidden");
  refs.reservedModule.classList.add("active");
  refs.reservedModule.classList.remove("hidden");
  renderReservedModule(key);
}

async function activateView(viewId) {
  document.querySelectorAll(".tab[data-view]").forEach((item) => {
    item.classList.toggle("active", item.dataset.view === viewId);
  });
  document.querySelectorAll(".view").forEach((view) => {
    view.classList.toggle("active", view.id === viewId);
  });
  if (viewId === "historyView") {
    await loadHistory();
  }
}

function renderReservedModule(moduleKey) {
  const moduleConfig = MODULES[moduleKey];
  refs.moduleTitle.textContent = moduleConfig.title;
  refs.reservedModuleName.textContent = moduleConfig.title;
  refs.reservedTableHead.innerHTML = moduleConfig.columns
    .map((column) => `<th>${escapeHtml(column)}</th>`)
    .join("");
  refs.reservedTableBody.innerHTML = `<tr><td colspan="${moduleConfig.columns.length}">暂无记录</td></tr>`;
  refs.reservedFieldList.innerHTML = moduleConfig.fields
    .map((field) => `<div><dt>${escapeHtml(field)}</dt><dd>预留</dd></div>`)
    .join("");
}

async function applySession(session) {
  state.session = session;
  state.profile = null;
  state.records = [];
  state.history = [];
  state.selectedId = null;

  if (!session) {
    refs.authPanel.classList.remove("hidden");
    refs.appShell.classList.add("hidden");
    refs.signOutBtn.classList.add("hidden");
    refs.userEmail.textContent = "";
    refs.roleBadge.textContent = "未登录";
    refs.roleBadge.classList.add("muted");
    return;
  }

  refs.authPanel.classList.add("hidden");
  refs.appShell.classList.remove("hidden");
  refs.signOutBtn.classList.remove("hidden");
  refs.userEmail.textContent = session.user.email || "";
  await ensureProfile();
  await loadModule();
  await loadRecords();
  renderProfile();
  renderRecords();
}

async function handleAuth(event, mode) {
  event.preventDefault();
  refs.authMessage.textContent = "";
  refs.authMessage.classList.remove("error");

  const formData = new FormData(refs.authForm);
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const action = mode === "signup"
    ? state.supabase.auth.signUp({ email, password })
    : state.supabase.auth.signInWithPassword({ email, password });
  const { error } = await action;

  if (error) {
    showMessage(refs.authMessage, error.message, true);
    return;
  }

  showMessage(refs.authMessage, mode === "signup" ? "注册已提交，请按 Supabase 邮件设置完成确认。" : "已登录。");
}

async function signOut() {
  await state.supabase.auth.signOut();
}

async function ensureProfile() {
  const user = state.session.user;
  let { data, error } = await state.supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    showMessage(refs.recordMessage, error.message, true);
  }

  if (!data) {
    const insert = await state.supabase
      .from("profiles")
      .insert({ id: user.id, email: user.email, role: "editor" })
      .select("*")
      .single();
    data = insert.data;
    error = insert.error;
  }

  if (error) {
    showMessage(refs.recordMessage, error.message, true);
  }

  state.profile = data || { email: user.email, role: "editor" };
}

async function loadModule() {
  const { data, error } = await state.supabase
    .from("database_modules")
    .select("*")
    .eq("slug", MODULE_SLUG)
    .maybeSingle();

  if (error) {
    showMessage(refs.recordMessage, error.message, true);
    return;
  }

  state.module = data;
  const name = data?.name || "备案产能和自动进口证发放比例";
  if (state.activeModule === "capacity") {
    refs.moduleTitle.textContent = name;
  }
  refs.moduleName.textContent = name;
}

async function loadRecords() {
  refs.recordsBody.innerHTML = `<tr><td colspan="9">载入中...</td></tr>`;

  let query = state.supabase
    .from("enterprises")
    .select("*")
    .order("code", { ascending: true });

  if (state.module?.id) {
    query = query.eq("module_id", state.module.id);
  }

  const { data, error } = await query;
  if (error) {
    refs.recordsBody.innerHTML = `<tr><td colspan="9">${escapeHtml(error.message)}</td></tr>`;
    return;
  }

  state.records = data || [];
  renderModuleStatus();
  populateRegionFilter();
}

async function loadHistory() {
  refs.historyBody.innerHTML = `<tr><td colspan="6">载入中...</td></tr>`;
  refs.historyMessage.textContent = "";
  refs.historyMessage.classList.remove("error");

  const { data, error } = await state.supabase
    .from("record_audit_logs")
    .select("*")
    .eq("table_name", "enterprises")
    .order("created_at", { ascending: false })
    .limit(40);

  if (error) {
    refs.historyBody.innerHTML = `<tr><td colspan="6">${escapeHtml(error.message)}</td></tr>`;
    return;
  }

  state.history = data || [];
  renderHistory();
}

function renderProfile() {
  refs.roleBadge.textContent = "可编辑";
  refs.roleBadge.classList.remove("muted");
  refs.profileEmail.textContent = state.profile?.email || state.session?.user?.email || "-";
  refs.profileRole.textContent = "可查阅、编辑、删除、撤回";
  renderModuleStatus();

  refs.enterpriseForm.querySelectorAll("input, select, textarea, button").forEach((element) => {
    element.disabled = false;
  });
  refs.enterpriseForm.elements.license_2025_ratio.disabled = true;
  refs.enterpriseForm.elements.license_2026_ratio.disabled = true;
}

function renderModuleStatus() {
  const count = state.records.length;
  refs.moduleRecordCount.textContent = count ? `${count} 家企业` : "暂无记录";
}

function populateRegionFilter() {
  const selected = refs.regionFilter.value;
  const regions = [...new Set(state.records.map((record) => record.region_label || record.province).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, "zh-CN"));
  refs.regionFilter.innerHTML = `<option value="">全部</option>${regions.map((region) => `<option value="${escapeHtml(region)}">${escapeHtml(region)}</option>`).join("")}`;
  refs.regionFilter.value = selected;
}

function getFilteredRecords() {
  const keyword = refs.searchInput.value.trim().toLowerCase();
  const region = refs.regionFilter.value;
  const groupName = refs.groupFilter.value;
  const minCapacity = Number(refs.capacityFilter.value || 0);

  return state.records.filter((record) => {
    const recordRegion = record.region_label || record.province || "";
    const text = [
      record.code,
      record.enterprise_name,
      record.region_label,
      record.province,
      record.city,
      record.group_name,
      record.status,
      record.source_document,
      record.notes,
    ].join(" ").toLowerCase();

    return (!keyword || text.includes(keyword))
      && (!region || recordRegion === region)
      && (!groupName || record.group_name === groupName)
      && Number(record.capacity_10k_tons || 0) >= minCapacity;
  });
}

function renderRecords() {
  const records = getFilteredRecords();
  renderMetrics(records);
  renderTable(records);
  renderDetail();
}

function renderMetrics(records) {
  const capacity = sum(records, "capacity_10k_tons");
  const license2025 = sum(records, "license_2025_tons");
  const license2026 = sum(records, "license_2026_tons");

  refs.metricCount.textContent = records.length;
  refs.metricCapacity.textContent = formatNumber(capacity);
  refs.metricLicense2025.textContent = formatNumber(license2025);
  refs.metricLicense2026.textContent = formatNumber(license2026);
  refs.metricRatio2025.textContent = formatPercentValue(ratioFromTons(license2025, capacity));
  refs.metricRatio2026.textContent = formatPercentValue(ratioFromTons(license2026, capacity));
}

function renderTable(records) {
  if (!records.length) {
    refs.recordsBody.innerHTML = `<tr><td colspan="9">没有匹配记录</td></tr>`;
    return;
  }

  refs.recordsBody.innerHTML = records.map((record) => `
    <tr data-id="${record.id}" class="${record.id === state.selectedId ? "selected" : ""}">
      <td>${escapeHtml(record.code || "")}</td>
      <td class="company-name">${escapeHtml(record.enterprise_name)}</td>
      <td>${escapeHtml(record.region_label || record.province || "")}</td>
      <td class="num">${formatNumber(record.capacity_10k_tons)} 万吨</td>
      <td class="num">${formatNumber(record.license_2025_tons)} 吨</td>
      <td class="num">${formatPercent(record.license_2025_tons, record.capacity_10k_tons)}</td>
      <td class="num">${formatNumber(record.license_2026_tons)} 吨</td>
      <td class="num">${formatPercent(record.license_2026_tons, record.capacity_10k_tons)}</td>
      <td>${escapeHtml(record.status || "")}</td>
    </tr>
  `).join("");

  refs.recordsBody.querySelectorAll("tr[data-id]").forEach((row) => {
    row.addEventListener("click", () => {
      state.selectedId = row.dataset.id;
      renderRecords();
    });
  });
}

function renderDetail() {
  const record = state.records.find((item) => item.id === state.selectedId);
  if (!record) {
    refs.emptyDetail.classList.remove("hidden");
    refs.recordDetail.classList.add("hidden");
    refs.recordDetail.innerHTML = "";
    return;
  }

  refs.emptyDetail.classList.add("hidden");
  refs.recordDetail.classList.remove("hidden");
  refs.recordDetail.innerHTML = `
    <header>
      <h2>${escapeHtml(record.enterprise_name)}</h2>
      <span class="badge">${escapeHtml(record.group_name || "未分类")}</span>
    </header>
    <div class="detail-list">
      ${detailRow("编号", record.code || "-")}
      ${detailRow("统计地区", record.region_label || "-")}
      ${detailRow("备案产能", `${formatNumber(record.capacity_10k_tons)} 万吨`)}
      ${detailRow("2025 自动证", `${formatNumber(record.license_2025_tons)} 吨`)}
      ${detailRow("2025 发放比例", formatPercent(record.license_2025_tons, record.capacity_10k_tons))}
      ${detailRow("2026 自动证", `${formatNumber(record.license_2026_tons)} 吨`)}
      ${detailRow("2026 发放比例", formatPercent(record.license_2026_tons, record.capacity_10k_tons))}
      ${detailRow("状态", record.status || "-")}
      ${detailRow("来源", record.source_document || "-")}
      ${detailRow("更新时间", formatDate(record.updated_at))}
    </div>
  `;
  setFormRecord(record);
}

function renderHistory() {
  if (!state.history.length) {
    refs.historyBody.innerHTML = `<tr><td colspan="6">暂无操作历史</td></tr>`;
    return;
  }

  refs.historyBody.innerHTML = state.history.map((item) => {
    const before = item.old_data || {};
    const after = item.new_data || {};
    const name = after.enterprise_name || before.enterprise_name || "-";
    const summary = summarizeChange(item);
    const reverted = Boolean(item.reverted_at);
    return `
      <tr>
        <td>${escapeHtml(formatDate(item.created_at))}</td>
        <td>${escapeHtml(actionLabel(item.action))}</td>
        <td>${escapeHtml(name)}</td>
        <td>${escapeHtml(summary)}</td>
        <td>${reverted ? "已撤回" : "可撤回"}</td>
        <td>
          <button class="secondary-button compact-button" type="button" data-undo-id="${item.id}" ${reverted ? "disabled" : ""}>撤回</button>
        </td>
      </tr>
    `;
  }).join("");

  refs.historyBody.querySelectorAll("[data-undo-id]").forEach((button) => {
    button.addEventListener("click", () => undoChange(button.dataset.undoId));
  });
}

function setFormRecord(record) {
  refs.enterpriseForm.reset();
  refs.recordMessage.textContent = "";
  refs.recordMessage.classList.remove("error");
  refs.deleteRecordBtn.classList.add("hidden");

  if (!record) {
    refs.enterpriseForm.elements.id.value = "";
    refs.enterpriseForm.elements.status.value = "已备案";
    refs.enterpriseForm.elements.group_name.value = "其他";
    refs.enterpriseForm.elements.source_document.value = "手工录入";
    state.selectedId = null;
    renderFormRatios();
    renderTable(getFilteredRecords());
    return;
  }

  refs.enterpriseForm.elements.id.value = record.id;
  refs.enterpriseForm.elements.code.value = record.code || "";
  refs.enterpriseForm.elements.enterprise_name.value = record.enterprise_name || "";
  refs.enterpriseForm.elements.capacity_10k_tons.value = record.capacity_10k_tons || "";
  refs.enterpriseForm.elements.region_label.value = record.region_label || "";
  refs.enterpriseForm.elements.province.value = record.province || "";
  refs.enterpriseForm.elements.city.value = record.city || "";
  refs.enterpriseForm.elements.group_name.value = record.group_name || "其他";
  refs.enterpriseForm.elements.license_2025_tons.value = record.license_2025_tons || "";
  refs.enterpriseForm.elements.license_2026_tons.value = record.license_2026_tons || "";
  refs.enterpriseForm.elements.status.value = record.status || "已备案";
  refs.enterpriseForm.elements.source_document.value = record.source_document || "";
  refs.enterpriseForm.elements.notes.value = record.notes || "";
  refs.deleteRecordBtn.classList.remove("hidden");
  renderFormRatios();
}

function renderFormRatios() {
  const form = refs.enterpriseForm.elements;
  const capacity = Number(form.capacity_10k_tons.value || 0);
  const license2025 = Number(form.license_2025_tons.value || 0);
  const license2026 = Number(form.license_2026_tons.value || 0);
  form.license_2025_ratio.value = formatPercent(license2025, capacity);
  form.license_2026_ratio.value = formatPercent(license2026, capacity);
}

async function saveRecord(event) {
  event.preventDefault();
  const form = refs.enterpriseForm.elements;
  const id = form.id.value;
  const payload = {
    module_id: state.module?.id || null,
    code: form.code.value.trim() || null,
    enterprise_name: form.enterprise_name.value.trim(),
    capacity_10k_tons: Number(form.capacity_10k_tons.value || 0),
    region_label: form.region_label.value.trim() || null,
    province: form.province.value.trim() || null,
    city: form.city.value.trim() || null,
    group_name: form.group_name.value || "其他",
    license_2025_tons: nullableNumber(form.license_2025_tons.value),
    license_2026_tons: nullableNumber(form.license_2026_tons.value),
    status: form.status.value || "已备案",
    source_document: form.source_document.value.trim() || null,
    notes: form.notes.value.trim() || null,
    updated_by: state.session.user.id,
  };

  const query = id
    ? state.supabase.from("enterprises").update(payload).eq("id", id).select("*").single()
    : state.supabase.from("enterprises").insert({ ...payload, created_by: state.session.user.id }).select("*").single();
  const { data, error } = await query;

  if (error) {
    showMessage(refs.recordMessage, error.message, true);
    return;
  }

  showMessage(refs.recordMessage, "已保存，历史记录已自动生成。");
  state.selectedId = data.id;
  await loadRecords();
  renderRecords();
}

async function deleteRecord() {
  const id = refs.enterpriseForm.elements.id.value;
  if (!id) return;
  const confirmed = window.confirm("确认删除当前记录？可以在操作历史中撤回。");
  if (!confirmed) return;

  const { error } = await state.supabase.from("enterprises").delete().eq("id", id);
  if (error) {
    showMessage(refs.recordMessage, error.message, true);
    return;
  }

  showMessage(refs.recordMessage, "已删除，可在操作历史中撤回。");
  state.selectedId = null;
  setFormRecord(null);
  await loadRecords();
  renderRecords();
}

async function undoChange(changeId) {
  const confirmed = window.confirm("确认撤回这次操作？");
  if (!confirmed) return;

  const { error } = await state.supabase.rpc("restore_enterprise_change", { change_id: changeId });
  if (error) {
    showMessage(refs.historyMessage, error.message, true);
    return;
  }

  showMessage(refs.historyMessage, "已撤回。");
  await loadRecords();
  await loadHistory();
  renderRecords();
}

function exportCsv(records) {
  const headers = ["编号", "企业名称", "统计地区", "省份", "城市", "体系", "备案产能(万吨)", "2025自动证(吨)", "2025比例", "2026自动证(吨)", "2026比例", "状态", "来源", "备注"];
  const rows = records.map((record) => [
    record.code,
    record.enterprise_name,
    record.region_label,
    record.province,
    record.city,
    record.group_name,
    record.capacity_10k_tons,
    record.license_2025_tons,
    formatPercent(record.license_2025_tons, record.capacity_10k_tons),
    record.license_2026_tons,
    formatPercent(record.license_2026_tons, record.capacity_10k_tons),
    record.status,
    record.source_document,
    record.notes,
  ]);
  const csv = [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");
  downloadBlob(`\ufeff${csv}`, "text/csv;charset=utf-8", "capacity-license-ratio.csv");
}

function summarizeChange(item) {
  if (item.action === "INSERT") return "新增记录";
  if (item.action === "DELETE") return "删除记录";
  const before = item.old_data || {};
  const after = item.new_data || {};
  const labels = [
    ["备案产能", "capacity_10k_tons"],
    ["2025自动证", "license_2025_tons"],
    ["2026自动证", "license_2026_tons"],
    ["地区", "region_label"],
    ["状态", "status"],
  ];
  const changes = labels
    .filter(([, key]) => String(before[key] ?? "") !== String(after[key] ?? ""))
    .map(([label]) => label);
  return changes.length ? changes.join("、") : "字段更新";
}

function actionLabel(action) {
  return { INSERT: "新增", UPDATE: "修改", DELETE: "删除" }[action] || action;
}

function downloadBlob(content, type, filename) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function detailRow(label, value) {
  return `<div class="detail-row"><span>${escapeHtml(label)}</span><span>${escapeHtml(value)}</span></div>`;
}

function sum(records, key) {
  return records.reduce((total, record) => total + Number(record[key] || 0), 0);
}

function nullableNumber(value) {
  if (value === null || value === undefined || String(value).trim() === "") return null;
  return Number(value);
}

function ratioFromTons(licenseTons, capacity10kTons) {
  const denominator = Number(capacity10kTons || 0) * 10000;
  if (!denominator) return null;
  return Number(licenseTons || 0) / denominator;
}

function formatPercent(licenseTons, capacity10kTons) {
  const value = formatPercentValue(ratioFromTons(licenseTons, capacity10kTons));
  return value === "-" ? value : `${value}%`;
}

function formatPercentValue(value) {
  if (value === null || Number.isNaN(value)) return "-";
  return `${(Number(value) * 100).toFixed(2)}`;
}

function showMessage(element, message, isError = false) {
  element.textContent = message;
  element.classList.toggle("error", isError);
}

function formatNumber(value) {
  return new Intl.NumberFormat("zh-CN", { maximumFractionDigits: 2 }).format(Number(value || 0));
}

function formatDate(value) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("zh-CN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function csvCell(value) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
