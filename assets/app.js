const state = {
  supabase: null,
  session: null,
  profile: null,
  records: [],
  selectedId: null,
  loading: false,
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
  searchInput: document.querySelector("#searchInput"),
  provinceFilter: document.querySelector("#provinceFilter"),
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
  metricCount: document.querySelector("#metricCount"),
  metricCapacity: document.querySelector("#metricCapacity"),
  metricOfco: document.querySelector("#metricOfco"),
  metricShare: document.querySelector("#metricShare"),
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
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".tab").forEach((item) => item.classList.remove("active"));
      document.querySelectorAll(".view").forEach((view) => view.classList.remove("active"));
      tab.classList.add("active");
      document.querySelector(`#${tab.dataset.view}`).classList.add("active");
    });
  });

  refs.authForm.addEventListener("submit", (event) => handleAuth(event, "signin"));
  refs.authForm.querySelector("[data-auth-mode='signup']").addEventListener("click", (event) => handleAuth(event, "signup"));
  refs.signOutBtn.addEventListener("click", signOut);

  [refs.searchInput, refs.provinceFilter, refs.groupFilter, refs.capacityFilter].forEach((input) => {
    input.addEventListener("input", renderRecords);
  });

  refs.exportBtn.addEventListener("click", () => exportCsv(getFilteredRecords()));
  refs.enterpriseForm.addEventListener("submit", saveRecord);
  refs.resetFormBtn.addEventListener("click", () => setFormRecord(null));
  refs.deleteRecordBtn.addEventListener("click", deleteRecord);
}

async function applySession(session) {
  state.session = session;
  state.profile = null;
  state.records = [];
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
      .insert({ id: user.id, email: user.email, role: "viewer" })
      .select("*")
      .single();
    data = insert.data;
    error = insert.error;
  }

  if (error) {
    showMessage(refs.recordMessage, error.message, true);
  }

  state.profile = data || { email: user.email, role: "viewer" };
}

async function loadRecords() {
  state.loading = true;
  refs.recordsBody.innerHTML = `<tr><td colspan="6">载入中...</td></tr>`;
  const { data, error } = await state.supabase
    .from("enterprises")
    .select("*")
    .order("capacity_10k_tons", { ascending: false })
    .order("enterprise_name", { ascending: true });

  state.loading = false;
  if (error) {
    refs.recordsBody.innerHTML = `<tr><td colspan="6">${escapeHtml(error.message)}</td></tr>`;
    return;
  }

  state.records = data || [];
  populateProvinceFilter();
}

function renderProfile() {
  const role = state.profile?.role || "viewer";
  refs.roleBadge.textContent = role;
  refs.roleBadge.classList.toggle("muted", role === "viewer");
  refs.profileEmail.textContent = state.profile?.email || state.session?.user?.email || "-";
  refs.profileRole.textContent = role;

  const writable = canWrite();
  refs.enterpriseForm.querySelectorAll("input, select, textarea, button").forEach((element) => {
    element.disabled = !writable && element.id !== "resetFormBtn";
  });
  refs.saveRecordBtn.textContent = writable ? "保存记录" : "无维护权限";
}

function populateProvinceFilter() {
  const selected = refs.provinceFilter.value;
  const provinces = [...new Set(state.records.map((record) => record.province).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, "zh-CN"));
  refs.provinceFilter.innerHTML = `<option value="">全部</option>${provinces.map((province) => `<option value="${escapeHtml(province)}">${escapeHtml(province)}</option>`).join("")}`;
  refs.provinceFilter.value = selected;
}

function getFilteredRecords() {
  const keyword = refs.searchInput.value.trim().toLowerCase();
  const province = refs.provinceFilter.value;
  const groupName = refs.groupFilter.value;
  const minCapacity = Number(refs.capacityFilter.value || 0);

  return state.records.filter((record) => {
    const text = [
      record.code,
      record.enterprise_name,
      record.province,
      record.city,
      record.group_name,
      record.status,
      record.source_document,
      record.notes,
    ].join(" ").toLowerCase();

    return (!keyword || text.includes(keyword))
      && (!province || record.province === province)
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
  const visibleCapacity = sumCapacity(records);
  const totalCapacity = sumCapacity(state.records);
  const ofcoCapacity = sumCapacity(records.filter((record) => record.group_name === "中粮"));

  refs.metricCount.textContent = records.length;
  refs.metricCapacity.textContent = formatNumber(visibleCapacity);
  refs.metricOfco.textContent = formatNumber(ofcoCapacity);
  refs.metricShare.textContent = totalCapacity ? ((visibleCapacity / totalCapacity) * 100).toFixed(1) : "0";
}

function renderTable(records) {
  if (!records.length) {
    refs.recordsBody.innerHTML = `<tr><td colspan="6">没有匹配记录</td></tr>`;
    return;
  }

  refs.recordsBody.innerHTML = records.map((record) => `
    <tr data-id="${record.id}" class="${record.id === state.selectedId ? "selected" : ""}">
      <td>${escapeHtml(record.code || "")}</td>
      <td class="company-name">${escapeHtml(record.enterprise_name)}</td>
      <td>${escapeHtml([record.province, record.city].filter(Boolean).join(" / "))}</td>
      <td>${escapeHtml(record.group_name || "")}</td>
      <td class="num">${formatNumber(record.capacity_10k_tons)} 万吨</td>
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
      ${detailRow("地区", [record.province, record.city].filter(Boolean).join(" / ") || "-")}
      ${detailRow("备案产能", `${formatNumber(record.capacity_10k_tons)} 万吨`)}
      ${detailRow("状态", record.status || "-")}
      ${detailRow("来源", record.source_document || "-")}
      ${detailRow("更新时间", formatDate(record.updated_at))}
    </div>
  `;
  setFormRecord(record);
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
    state.selectedId = null;
    renderTable(getFilteredRecords());
    return;
  }

  refs.enterpriseForm.elements.id.value = record.id;
  refs.enterpriseForm.elements.code.value = record.code || "";
  refs.enterpriseForm.elements.enterprise_name.value = record.enterprise_name || "";
  refs.enterpriseForm.elements.capacity_10k_tons.value = record.capacity_10k_tons || "";
  refs.enterpriseForm.elements.province.value = record.province || "";
  refs.enterpriseForm.elements.city.value = record.city || "";
  refs.enterpriseForm.elements.group_name.value = record.group_name || "其他";
  refs.enterpriseForm.elements.status.value = record.status || "已备案";
  refs.enterpriseForm.elements.source_document.value = record.source_document || "";
  refs.enterpriseForm.elements.notes.value = record.notes || "";

  if (canDelete()) refs.deleteRecordBtn.classList.remove("hidden");
}

async function saveRecord(event) {
  event.preventDefault();
  if (!canWrite()) {
    showMessage(refs.recordMessage, "当前账号没有新增或修改权限。", true);
    return;
  }

  const form = refs.enterpriseForm.elements;
  const id = form.id.value;
  const payload = {
    code: form.code.value.trim() || null,
    enterprise_name: form.enterprise_name.value.trim(),
    capacity_10k_tons: Number(form.capacity_10k_tons.value || 0),
    province: form.province.value.trim() || null,
    city: form.city.value.trim() || null,
    group_name: form.group_name.value || "其他",
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

  showMessage(refs.recordMessage, "已保存。");
  state.selectedId = data.id;
  await loadRecords();
  renderRecords();
}

async function deleteRecord() {
  if (!canDelete()) {
    showMessage(refs.recordMessage, "只有 admin 可以删除记录。", true);
    return;
  }

  const id = refs.enterpriseForm.elements.id.value;
  if (!id) return;
  const confirmed = window.confirm("确认删除当前记录？");
  if (!confirmed) return;

  const { error } = await state.supabase.from("enterprises").delete().eq("id", id);
  if (error) {
    showMessage(refs.recordMessage, error.message, true);
    return;
  }

  showMessage(refs.recordMessage, "已删除。");
  state.selectedId = null;
  setFormRecord(null);
  await loadRecords();
  renderRecords();
}

function exportCsv(records) {
  const headers = ["编号", "企业名称", "省份", "城市", "体系", "备案产能(万吨)", "状态", "来源", "备注"];
  const rows = records.map((record) => [
    record.code,
    record.enterprise_name,
    record.province,
    record.city,
    record.group_name,
    record.capacity_10k_tons,
    record.status,
    record.source_document,
    record.notes,
  ]);
  const csv = [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");
  downloadBlob(`\ufeff${csv}`, "text/csv;charset=utf-8", "sugar-import-enterprises.csv");
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

function canWrite() {
  return ["admin", "editor"].includes(state.profile?.role);
}

function canDelete() {
  return state.profile?.role === "admin";
}

function detailRow(label, value) {
  return `<div class="detail-row"><span>${escapeHtml(label)}</span><span>${escapeHtml(value)}</span></div>`;
}

function sumCapacity(records) {
  return records.reduce((sum, record) => sum + Number(record.capacity_10k_tons || 0), 0);
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
