const MODULE_SLUG = "capacity_license_ratio";

const MODULES = {
  capacity: {
    title: "备案产能和自动进口证发放比例",
  },
  ports: {
    title: "港口与船代信息",
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
  backend: null,
  provider: "",
  supabase: null,
  session: null,
  profile: null,
  module: null,
  records: [],
  history: [],
  selectedId: null,
  activeModule: "capacity",
  activePortView: "berths",
  portBerths: [],
  shippingAgents: [],
  portsLoaded: false,
  portLoadError: "",
  selectedPortId: null,
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
  portsModule: document.querySelector("#portsModule"),
  reservedModule: document.querySelector("#reservedModule"),
  reservedModuleName: document.querySelector("#reservedModuleName"),
  reservedTableHead: document.querySelector("#reservedTableHead"),
  reservedTableBody: document.querySelector("#reservedTableBody"),
  reservedFieldList: document.querySelector("#reservedFieldList"),
  moduleRecordCount: document.querySelector("#moduleRecordCount"),
  portModuleCount: document.querySelector("#portModuleCount"),
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
  portSearchInput: document.querySelector("#portSearchInput"),
  portNameFilter: document.querySelector("#portNameFilter"),
  portDraftFilter: document.querySelector("#portDraftFilter"),
  portDwtFilter: document.querySelector("#portDwtFilter"),
  portExportBtn: document.querySelector("#portExportBtn"),
  portMetricPorts: document.querySelector("#portMetricPorts"),
  portMetricRows: document.querySelector("#portMetricRows"),
  portMetricDraft: document.querySelector("#portMetricDraft"),
  portMetricDwt: document.querySelector("#portMetricDwt"),
  portsTableHead: document.querySelector("#portsTableHead"),
  portsTableBody: document.querySelector("#portsTableBody"),
  emptyPortDetail: document.querySelector("#emptyPortDetail"),
  portRecordDetail: document.querySelector("#portRecordDetail"),
  profileEmail: document.querySelector("#profileEmail"),
  profileRole: document.querySelector("#profileRole"),
};

init();

async function init() {
  wireUi();
  const config = getRuntimeConfig();
  if (!isConfigured(config)) {
    refs.setupPanel.classList.remove("hidden");
    refs.authPanel.classList.add("hidden");
    refs.appShell.classList.add("hidden");
    return;
  }

  try {
    state.provider = config.provider;
    state.backend = await createBackend(config);
    state.supabase = state.backend.supabase || null;

    const session = await state.backend.getSession();
    await applySession(session);
    state.backend.onAuthStateChange((nextSession) => {
      applySession(nextSession);
    });
  } catch (error) {
    refs.setupPanel.classList.remove("hidden");
    refs.setupPanel.querySelector("h2").textContent = "后端初始化失败";
    refs.setupPanel.querySelector("p").textContent = formatError(error);
  }
}

function isConfigured(config) {
  if (config.provider === "cloudbase") {
    const envId = config.cloudbase?.envId || config.cloudbase?.env;
    return Boolean(envId && !envId.includes("YOUR_CLOUDBASE_ENV_ID"));
  }

  if (config.provider === "supabase") {
    const supabase = config.supabase || {};
    return Boolean(
      supabase.url
        && supabase.anonKey
        && !supabase.url.includes("YOUR-PROJECT-REF")
        && !supabase.anonKey.includes("YOUR_PUBLIC"),
    );
  }

  return false;
}

function getRuntimeConfig() {
  if (window.APP_CONFIG?.provider) return window.APP_CONFIG;

  if (window.CLOUDBASE_CONFIG?.envId || window.CLOUDBASE_CONFIG?.env) {
    return {
      provider: "cloudbase",
      cloudbase: window.CLOUDBASE_CONFIG,
    };
  }

  if (window.SUPABASE_CONFIG?.url) {
    return {
      provider: "supabase",
      supabase: window.SUPABASE_CONFIG,
    };
  }

  return {};
}

async function createBackend(config) {
  if (config.provider === "cloudbase") {
    const cloudbaseModule = await import("https://cdn.jsdelivr.net/npm/@cloudbase/js-sdk@3/+esm");
    const cloudbase = cloudbaseModule.default || cloudbaseModule;
    const cloudConfig = config.cloudbase || {};
    const app = cloudbase.init({
      env: cloudConfig.envId || cloudConfig.env,
      region: cloudConfig.region || "ap-shanghai",
    });
    const auth = app.auth({ persistence: "local" });
    const db = app.database();
    return createCloudBaseBackend({ auth, db });
  }

  const { createClient } = await import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm");
  const supabase = createClient(config.supabase.url, config.supabase.anonKey);
  return createSupabaseBackend(supabase);
}

function createSupabaseBackend(supabase) {
  return {
    provider: "supabase",
    supabase,
    async getSession() {
      const { data } = await supabase.auth.getSession();
      return data.session;
    },
    onAuthStateChange(callback) {
      supabase.auth.onAuthStateChange((_event, session) => callback(session));
    },
    async signIn(email, password) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    },
    async signUp(email, password) {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
    },
    async signOut() {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    },
    async ensureProfile(user) {
      let { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (!data && !error) {
        const insert = await supabase
          .from("profiles")
          .insert({ id: user.id, email: user.email, role: "editor" })
          .select("*")
          .single();
        data = insert.data;
        error = insert.error;
      }

      if (error) throw error;
      return data || { email: user.email, role: "editor" };
    },
    async loadModule(slug) {
      const { data, error } = await supabase
        .from("database_modules")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    async listEnterprises(moduleId) {
      let query = supabase
        .from("enterprises")
        .select("*")
        .order("code", { ascending: true });
      if (moduleId) query = query.eq("module_id", moduleId);
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    async listPortBerths() {
      const { data, error } = await supabase.from("port_berths").select("*").order("code", { ascending: true });
      if (error) throw error;
      return data || [];
    },
    async listShippingAgents() {
      const { data, error } = await supabase.from("shipping_agents").select("*").order("code", { ascending: true });
      if (error) throw error;
      return data || [];
    },
    async listHistory() {
      const { data, error } = await supabase
        .from("record_audit_logs")
        .select("*")
        .eq("table_name", "enterprises")
        .order("created_at", { ascending: false })
        .limit(40);
      if (error) throw error;
      return data || [];
    },
    async saveEnterprise(payload, id, user) {
      const query = id
        ? supabase.from("enterprises").update(payload).eq("id", id).select("*").single()
        : supabase.from("enterprises").insert({ ...payload, created_by: user.id }).select("*").single();
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    async deleteEnterprise(id) {
      const { error } = await supabase.from("enterprises").delete().eq("id", id);
      if (error) throw error;
    },
    async undoEnterpriseChange(changeId) {
      const { error } = await supabase.rpc("restore_enterprise_change", { change_id: changeId });
      if (error) throw error;
    },
  };
}

function createCloudBaseBackend({ auth, db }) {
  return {
    provider: "cloudbase",
    async getSession() {
      const loginState = await getCloudBaseLoginState(auth);
      return normalizeCloudBaseSession(loginState);
    },
    onAuthStateChange(callback) {
      if (typeof auth.onLoginStateChanged === "function") {
        auth.onLoginStateChanged((loginState) => callback(normalizeCloudBaseSession(loginState)));
      }
    },
    async signIn(email, password) {
      await callCredentialAuthMethod(auth, ["signInWithEmailAndPassword", "signInWithPassword"], email, password);
    },
    async signUp(email, password) {
      await callCredentialAuthMethod(auth, ["signUpWithEmailAndPassword", "signUpWithPassword"], email, password);
    },
    async signOut() {
      await callFirstAuthMethod(auth, ["signOut", "logout"]);
    },
    async ensureProfile(user) {
      const existing = await firstCloudBaseRecord(db, "profiles", { user_id: user.id });
      if (existing) return existing;
      return addCloudBaseRecord(db, "profiles", {
        user_id: user.id,
        email: user.email,
        role: "editor",
        created_at: nowIso(),
        updated_at: nowIso(),
      });
    },
    async loadModule(slug) {
      let module = await firstCloudBaseRecord(db, "database_modules", { slug });
      if (module) return module;
      module = await addCloudBaseRecord(db, "database_modules", {
        slug,
        name: MODULES.capacity.title,
        description: "备案产能、自动进口许可证额度和发放比例。",
        is_editable: true,
        created_at: nowIso(),
        updated_at: nowIso(),
      });
      return module;
    },
    async listEnterprises(moduleId) {
      return listCloudBaseRecords(db, "enterprises", {
        where: { module_slug: MODULE_SLUG },
        orderBy: ["code", "asc"],
      });
    },
    async listPortBerths() {
      return listCloudBaseRecords(db, "port_berths", { orderBy: ["code", "asc"] });
    },
    async listShippingAgents() {
      return listCloudBaseRecords(db, "shipping_agents", { orderBy: ["code", "asc"] });
    },
    async listHistory() {
      return listCloudBaseRecords(db, "record_audit_logs", {
        where: { table_name: "enterprises" },
        orderBy: ["created_at", "desc"],
        limit: 40,
      });
    },
    async saveEnterprise(payload, id, user) {
      const timestamp = nowIso();
      if (id) {
        const before = await getCloudBaseRecord(db, "enterprises", id);
        const next = {
          ...payload,
          module_slug: MODULE_SLUG,
          updated_by: user.id,
          updated_at: timestamp,
        };
        await updateCloudBaseRecord(db, "enterprises", id, next);
        const after = { ...before, ...next, id };
        await writeCloudBaseAudit(db, "UPDATE", before, after, user);
        return after;
      }

      const created = await addCloudBaseRecord(db, "enterprises", {
        ...payload,
        module_slug: MODULE_SLUG,
        created_by: user.id,
        updated_by: user.id,
        created_at: timestamp,
        updated_at: timestamp,
      });
      await writeCloudBaseAudit(db, "INSERT", null, created, user);
      return created;
    },
    async deleteEnterprise(id, user) {
      const before = await getCloudBaseRecord(db, "enterprises", id);
      await removeCloudBaseRecord(db, "enterprises", id);
      await writeCloudBaseAudit(db, "DELETE", before, null, user);
    },
    async undoEnterpriseChange(changeId, user) {
      const change = await getCloudBaseRecord(db, "record_audit_logs", changeId);
      if (!change || change.reverted_at) return;
      if (change.action === "INSERT" && change.new_data?.id) {
        await removeCloudBaseRecord(db, "enterprises", change.new_data.id);
      } else if (change.action === "UPDATE" && change.old_data?.id) {
        const restored = { ...change.old_data, updated_by: user.id, updated_at: nowIso() };
        await updateCloudBaseRecord(db, "enterprises", change.old_data.id, toCloudBaseData(restored));
      } else if (change.action === "DELETE" && change.old_data) {
        await addCloudBaseRecord(db, "enterprises", toCloudBaseData(change.old_data));
      }
      await updateCloudBaseRecord(db, "record_audit_logs", changeId, {
        reverted_at: nowIso(),
        reverted_by: user.id,
      });
    },
  };
}

async function getCloudBaseLoginState(auth) {
  if (typeof auth.hasLoginState === "function") return auth.hasLoginState();
  if (typeof auth.getCurrentUser === "function") return auth.getCurrentUser();
  if (typeof auth.currentUser === "function") return auth.currentUser();
  return null;
}

function normalizeCloudBaseSession(loginState) {
  const user = loginState?.user || loginState?.userinfo || loginState;
  if (!user) return null;
  const id = user.uid || user.userId || user.openId || user.email || user.username || "cloudbase-user";
  const email = user.email || user.loginName || user.username || "";
  return {
    user: {
      id,
      email,
    },
    raw: loginState,
  };
}

async function callFirstAuthMethod(target, methodNames, ...args) {
  const methodName = methodNames.find((name) => typeof target[name] === "function");
  if (!methodName) {
    throw new Error(`CloudBase 当前 SDK 不支持 ${methodNames.join(" / ")}，请检查身份认证方式是否开启。`);
  }
  return target[methodName](...args);
}

async function callCredentialAuthMethod(target, methodNames, email, password) {
  const methodName = methodNames.find((name) => typeof target[name] === "function");
  if (!methodName) {
    throw new Error(`CloudBase 当前 SDK 不支持 ${methodNames.join(" / ")}，请检查邮箱/密码登录是否开启。`);
  }
  try {
    return await target[methodName](email, password);
  } catch (error) {
    if (!/param|argument|参数|invalid/i.test(formatError(error))) throw error;
    return target[methodName]({ email, password });
  }
}

async function firstCloudBaseRecord(db, collectionName, where) {
  const rows = await listCloudBaseRecords(db, collectionName, { where, limit: 1 });
  return rows[0] || null;
}

async function listCloudBaseRecords(db, collectionName, options = {}) {
  const pageSize = Math.min(options.limit || 100, 100);
  const maxCount = options.limit || 1000;
  let query = db.collection(collectionName);
  if (options.where) query = query.where(options.where);
  if (options.orderBy) query = query.orderBy(options.orderBy[0], options.orderBy[1]);

  const rows = [];
  for (let offset = 0; offset < maxCount; offset += pageSize) {
    let pageQuery = query.limit(pageSize);
    if (typeof pageQuery.skip === "function") {
      pageQuery = pageQuery.skip(offset);
    }
    const result = await pageQuery.get();
    const data = normalizeCloudBaseData(result);
    rows.push(...data.map(normalizeCloudBaseRecord));
    if (data.length < pageSize || rows.length >= maxCount) break;
  }
  return rows.slice(0, maxCount);
}

async function getCloudBaseRecord(db, collectionName, id) {
  const result = await db.collection(collectionName).doc(id).get();
  const rows = normalizeCloudBaseData(result).map(normalizeCloudBaseRecord);
  return rows[0] || normalizeCloudBaseRecord(result.data || {});
}

async function addCloudBaseRecord(db, collectionName, payload) {
  const data = toCloudBaseData(payload);
  const collection = db.collection(collectionName);
  let result;
  try {
    result = await collection.add({ data });
  } catch (error) {
    result = await collection.add(data);
  }
  const id = result?.id || result?._id || data._id;
  return normalizeCloudBaseRecord({ ...data, _id: id });
}

async function updateCloudBaseRecord(db, collectionName, id, payload) {
  const { _id, ...data } = toCloudBaseData(payload);
  const doc = db.collection(collectionName).doc(id);
  try {
    await doc.update({ data });
  } catch (error) {
    await doc.update(data);
  }
}

async function removeCloudBaseRecord(db, collectionName, id) {
  try {
    await db.collection(collectionName).doc(id).remove();
  } catch (error) {
    if (!/not exist|不存在|not found/i.test(formatError(error))) throw error;
  }
}

async function writeCloudBaseAudit(db, action, oldData, newData, user) {
  await addCloudBaseRecord(db, "record_audit_logs", {
    table_name: "enterprises",
    record_id: newData?.id || oldData?.id || null,
    action,
    old_data: oldData ? toAuditData(oldData) : null,
    new_data: newData ? toAuditData(newData) : null,
    changed_by: user.id,
    created_at: nowIso(),
    reverted_at: null,
  });
}

function normalizeCloudBaseData(result) {
  if (Array.isArray(result?.data)) return result.data;
  if (result?.data && typeof result.data === "object") return [result.data];
  return [];
}

function normalizeCloudBaseRecord(record) {
  const id = record.id || record._id;
  return {
    ...record,
    id,
  };
}

function toCloudBaseData(record) {
  const { id, ...data } = record || {};
  if (id && !data._id) data._id = id;
  return data;
}

function toAuditData(record) {
  const data = { ...record };
  if (!data.id && data._id) data.id = data._id;
  return data;
}

function nowIso() {
  return new Date().toISOString();
}

function wireUi() {
  document.querySelectorAll(".tab[data-view]").forEach((tab) => {
    tab.addEventListener("click", () => activateView(tab.dataset.view));
  });

  refs.moduleCards.forEach((card) => {
    card.addEventListener("click", () => selectModule(card.dataset.module));
  });
  document.querySelectorAll("[data-port-view]").forEach((tab) => {
    tab.addEventListener("click", () => {
      state.activePortView = tab.dataset.portView;
      state.selectedPortId = null;
      document.querySelectorAll("[data-port-view]").forEach((item) => {
        item.classList.toggle("active", item.dataset.portView === state.activePortView);
      });
      renderPortsModule();
    });
  });
  refs.authForm.addEventListener("submit", (event) => handleAuth(event, "signin"));
  refs.authForm.querySelector("[data-auth-mode='signup']").addEventListener("click", (event) => handleAuth(event, "signup"));
  refs.signOutBtn.addEventListener("click", signOut);

  [refs.searchInput, refs.regionFilter, refs.groupFilter, refs.capacityFilter].forEach((input) => {
    input.addEventListener("input", renderRecords);
  });
  [refs.portSearchInput, refs.portNameFilter, refs.portDraftFilter, refs.portDwtFilter].forEach((input) => {
    input.addEventListener("input", renderPortsModule);
  });

  ["capacity_10k_tons", "license_2025_tons", "license_2026_tons"].forEach((name) => {
    refs.enterpriseForm.elements[name].addEventListener("input", renderFormRatios);
  });

  refs.exportBtn.addEventListener("click", () => exportCsv(getFilteredRecords()));
  refs.portExportBtn.addEventListener("click", () => exportPortCsv(getFilteredPortRows()));
  refs.enterpriseForm.addEventListener("submit", saveRecord);
  refs.resetFormBtn.addEventListener("click", () => setFormRecord(null));
  refs.deleteRecordBtn.addEventListener("click", deleteRecord);
  refs.refreshHistoryBtn.addEventListener("click", loadHistory);
}

async function selectModule(moduleKey) {
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
    refs.portsModule.classList.remove("active");
    refs.portsModule.classList.add("hidden");
    refs.reservedModule.classList.remove("active");
    refs.reservedModule.classList.add("hidden");
    refs.moduleTitle.textContent = state.module?.name || MODULES.capacity.title;
    return;
  }

  if (key === "ports") {
    refs.capacityModule.classList.remove("active");
    refs.capacityModule.classList.add("hidden");
    refs.reservedModule.classList.remove("active");
    refs.reservedModule.classList.add("hidden");
    refs.portsModule.classList.add("active");
    refs.portsModule.classList.remove("hidden");
    refs.moduleTitle.textContent = MODULES.ports.title;
    if (!state.portsLoaded && state.session) {
      await loadPortData();
    }
    renderPortsModule();
    return;
  }

  refs.capacityModule.classList.remove("active");
  refs.capacityModule.classList.add("hidden");
  refs.portsModule.classList.remove("active");
  refs.portsModule.classList.add("hidden");
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
  state.portBerths = [];
  state.shippingAgents = [];
  state.portsLoaded = false;
  state.portLoadError = "";
  state.selectedPortId = null;

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
  refs.userEmail.textContent = session.user.email || session.user.id || "";
  await ensureProfile();
  await loadModule();
  await loadRecords();
  await loadPortData();
  renderProfile();
  renderRecords();
  renderPortsModuleStatus();
}

async function handleAuth(event, mode) {
  event.preventDefault();
  refs.authMessage.textContent = "";
  refs.authMessage.classList.remove("error");

  const formData = new FormData(refs.authForm);
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  try {
    if (mode === "signup") {
      await state.backend.signUp(email, password);
    } else {
      await state.backend.signIn(email, password);
    }
    const session = await state.backend.getSession();
    await applySession(session);
  } catch (error) {
    showMessage(refs.authMessage, formatError(error), true);
    return;
  }

  showMessage(refs.authMessage, mode === "signup" ? "注册已提交，如开启邮箱验证请按邮件确认。" : "已登录。");
}

async function signOut() {
  await state.backend.signOut();
  await applySession(null);
}

async function ensureProfile() {
  const user = state.session.user;
  state.profile = await state.backend.ensureProfile(user);
}

async function loadModule() {
  try {
    state.module = await state.backend.loadModule(MODULE_SLUG);
  } catch (error) {
    showMessage(refs.recordMessage, formatError(error), true);
    state.module = null;
  }

  const name = state.module?.name || "备案产能和自动进口证发放比例";
  if (state.activeModule === "capacity") {
    refs.moduleTitle.textContent = name;
  }
  refs.moduleName.textContent = name;
}

async function loadRecords() {
  refs.recordsBody.innerHTML = `<tr><td colspan="9">载入中...</td></tr>`;

  try {
    state.records = await state.backend.listEnterprises(state.module?.id);
  } catch (error) {
    refs.recordsBody.innerHTML = `<tr><td colspan="9">${escapeHtml(formatError(error))}</td></tr>`;
    state.records = [];
    return;
  }

  renderModuleStatus();
  populateRegionFilter();
}

async function loadPortData() {
  if (!state.backend) return;

  state.portLoadError = "";
  refs.portsTableBody.innerHTML = `<tr><td colspan="${portTableColumnCount()}">载入中...</td></tr>`;

  let berthsResult;
  let agentsResult;
  try {
    [berthsResult, agentsResult] = await Promise.all([
      state.backend.listPortBerths(),
      state.backend.listShippingAgents(),
    ]);
  } catch (error) {
    berthsResult = { error };
    agentsResult = { error: null };
  }

  if (berthsResult.error || agentsResult.error) {
    const message = berthsResult.error?.message || agentsResult.error?.message || "港口模块载入失败";
    state.portBerths = [];
    state.shippingAgents = [];
    state.portsLoaded = false;
    state.portLoadError = message;
    populatePortFilter();
    renderPortsModuleStatus();
    renderPortsModule();
    return;
  }

  state.portBerths = berthsResult || [];
  state.shippingAgents = (agentsResult || []).map(normalizeShippingAgent);
  state.portsLoaded = true;
  state.portLoadError = "";
  populatePortFilter();
  renderPortsModuleStatus();
  renderPortsModule();
}

async function loadHistory() {
  refs.historyBody.innerHTML = `<tr><td colspan="6">载入中...</td></tr>`;
  refs.historyMessage.textContent = "";
  refs.historyMessage.classList.remove("error");

  try {
    state.history = await state.backend.listHistory();
  } catch (error) {
    refs.historyBody.innerHTML = `<tr><td colspan="6">${escapeHtml(formatError(error))}</td></tr>`;
    state.history = [];
    return;
  }

  renderHistory();
}

function renderProfile() {
  refs.roleBadge.textContent = "可编辑";
  refs.roleBadge.classList.remove("muted");
  refs.profileEmail.textContent = state.profile?.email || state.session?.user?.email || state.session?.user?.id || "-";
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

function renderPortsModuleStatus() {
  if (state.portLoadError) {
    refs.portModuleCount.textContent = "需运行 SQL";
    return;
  }

  const count = state.portBerths.length + state.shippingAgents.length;
  refs.portModuleCount.textContent = count ? `${count} 条记录` : "需运行 SQL";
}

function populatePortFilter() {
  const selected = refs.portNameFilter.value;
  const ports = [...new Set([
    ...state.portBerths.map((record) => record.port_name),
    ...state.shippingAgents.map((record) => record.port_name),
  ].filter(Boolean))].sort((a, b) => a.localeCompare(b, "zh-CN"));
  refs.portNameFilter.innerHTML = `<option value="">全部</option>${ports.map((port) => `<option value="${escapeHtml(port)}">${escapeHtml(port)}</option>`).join("")}`;
  refs.portNameFilter.value = selected;
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

function getFilteredPortRows() {
  const keyword = refs.portSearchInput.value.trim().toLowerCase();
  const portName = refs.portNameFilter.value;
  const minDraft = Number(refs.portDraftFilter.value || 0);
  const minDwt = Number(refs.portDwtFilter.value || 0);
  const rows = state.activePortView === "agents" ? state.shippingAgents : state.portBerths;

  return rows.filter((row) => {
    const text = Object.values(row).join(" ").toLowerCase();
    const matchesCommon = (!keyword || text.includes(keyword))
      && (!portName || row.port_name === portName);

    if (state.activePortView === "agents") return matchesCommon;

    return matchesCommon
      && Number(row.draft_m || 0) >= minDraft
      && Number(row.max_dwt_tons || 0) >= minDwt;
  });
}

function renderPortsModule() {
  refs.portDraftFilter.disabled = state.activePortView === "agents";
  refs.portDwtFilter.disabled = state.activePortView === "agents";

  const rows = getFilteredPortRows();
  renderPortMetrics(rows);
  renderPortTable(rows);
  renderPortDetail();
}

function renderPortMetrics(rows) {
  const ports = new Set(rows.map((row) => row.port_name).filter(Boolean));
  refs.portMetricPorts.textContent = ports.size;
  refs.portMetricRows.textContent = rows.length;

  if (state.activePortView === "agents") {
    refs.portMetricDraft.textContent = "-";
    refs.portMetricDwt.textContent = "-";
    return;
  }

  refs.portMetricDraft.textContent = formatNumber(Math.max(0, ...rows.map((row) => Number(row.draft_m || 0))));
  refs.portMetricDwt.textContent = formatNumber(Math.max(0, ...rows.map((row) => Number(row.max_dwt_tons || 0))));
}

function portLoadMessage() {
  if (!state.portLoadError) return "";
  if (/does not exist|schema cache|relation/i.test(state.portLoadError)) {
    return "港口模块数据表还没建好，请先运行港口模块 SQL";
  }
  return state.portLoadError;
}

function portTableColumnCount() {
  return state.activePortView === "agents" ? 5 : 8;
}

function renderPortTable(rows) {
  if (state.activePortView === "agents") {
    refs.portsTableHead.innerHTML = `
      <th class="port-code-col">编号</th>
      <th class="port-name-col">港口</th>
      <th class="agent-name-col">船代公司</th>
      <th class="agent-tel-col">电话</th>
      <th class="agent-email-col">邮箱</th>
    `;

    if (state.portLoadError) {
      refs.portsTableBody.innerHTML = `<tr><td colspan="5">${escapeHtml(portLoadMessage())}</td></tr>`;
      return;
    }

    refs.portsTableBody.innerHTML = rows.length ? rows.map((record) => `
      <tr data-port-id="${record.id}" class="${record.id === state.selectedPortId ? "selected" : ""}">
        <td class="port-code-col">${escapeHtml(record.code || "")}</td>
        <td class="port-name-col">${escapeHtml(record.port_name || "")}</td>
        <td class="company-name agent-name-col">${escapeHtml(record.agency_name || "")}</td>
        <td class="agent-tel-col">${escapeHtml(record.tel || "")}</td>
        <td class="agent-email-col">${escapeHtml(record.email || "")}</td>
      </tr>
    `).join("") : `<tr><td colspan="5">没有匹配记录</td></tr>`;
  } else {
    refs.portsTableHead.innerHTML = `
      <th>编号</th>
      <th>所在地</th>
      <th>港口</th>
      <th>码头</th>
      <th>泊位</th>
      <th class="num">吃水</th>
      <th class="num">最大载重吨</th>
      <th>特殊要求</th>
    `;

    if (state.portLoadError) {
      refs.portsTableBody.innerHTML = `<tr><td colspan="8">${escapeHtml(portLoadMessage())}</td></tr>`;
      return;
    }

    refs.portsTableBody.innerHTML = rows.length ? rows.map((record) => `
      <tr data-port-id="${record.id}" class="${record.id === state.selectedPortId ? "selected" : ""}">
        <td>${escapeHtml(record.code || "")}</td>
        <td>${escapeHtml(record.location || "")}</td>
        <td class="company-name">${escapeHtml(record.port_name || "")}</td>
        <td>${escapeHtml(record.terminal_name || "")}</td>
        <td>${escapeHtml(record.berth || "")}</td>
        <td class="num">${formatNumber(record.draft_m)} 米</td>
        <td class="num">${formatNumber(record.max_dwt_tons)} 吨</td>
        <td>${escapeHtml(record.special_requirements || "")}</td>
      </tr>
    `).join("") : `<tr><td colspan="8">没有匹配记录</td></tr>`;
  }

  refs.portsTableBody.querySelectorAll("tr[data-port-id]").forEach((row) => {
    row.addEventListener("click", () => {
      state.selectedPortId = row.dataset.portId;
      renderPortsModule();
    });
  });
}

function renderPortDetail() {
  const rows = state.activePortView === "agents" ? state.shippingAgents : state.portBerths;
  const record = rows.find((item) => item.id === state.selectedPortId);
  if (!record) {
    refs.emptyPortDetail.classList.remove("hidden");
    refs.portRecordDetail.classList.add("hidden");
    refs.portRecordDetail.innerHTML = "";
    return;
  }

  refs.emptyPortDetail.classList.add("hidden");
  refs.portRecordDetail.classList.remove("hidden");

  if (state.activePortView === "agents") {
    const agent = normalizeShippingAgent(record);
    refs.portRecordDetail.innerHTML = `
      <header>
        <h2>${escapeHtml(agent.agency_name || agent.port_name)}</h2>
        <span class="badge">${escapeHtml(agent.port_name || "")}</span>
      </header>
      <div class="detail-list">
        ${detailRowCompact("编号", agent.code || "-")}
        ${detailRowCompact("港口", agent.port_name || "-")}
        ${detailRowCompact("船代公司", agent.agency_name || "-")}
        ${detailRowCompact("地址", agent.address || "-")}
        ${detailRowCompact("电话", agent.tel || "-")}
        ${detailRowCompact("传真", agent.fax || "-")}
        ${detailRowCompact("邮箱", agent.email || "-")}
        ${detailRowCompact("联系人", agent.contact_persons || "-")}
        ${detailRowCompact("来源", agent.source_document || "-")}
      </div>
    `;
    return;
  }

  refs.portRecordDetail.innerHTML = `
    <header>
      <h2>${escapeHtml(record.port_name)}</h2>
      <span class="badge">${escapeHtml(record.location || "港口")}</span>
    </header>
    <div class="detail-list">
      ${detailRow("编号", record.code || "-")}
      ${detailRow("所在地", record.location || "-")}
      ${detailRow("码头", record.terminal_name || "-")}
      ${detailRow("泊位", record.berth || "-")}
      ${detailRow("吃水", `${formatNumber(record.draft_m)} 米`)}
      ${detailRow("最大载重吨", `${formatNumber(record.max_dwt_tons)} 吨`)}
      ${detailRow("夏天海水密度", record.summer_density || "-")}
      ${detailRow("特殊要求", record.special_requirements || "-")}
      ${detailRow("来源", record.source_document || "-")}
    </div>
  `;
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

  let data;
  try {
    data = await state.backend.saveEnterprise(payload, id, state.session.user);
  } catch (error) {
    showMessage(refs.recordMessage, formatError(error), true);
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

  try {
    await state.backend.deleteEnterprise(id, state.session.user);
  } catch (error) {
    showMessage(refs.recordMessage, formatError(error), true);
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

  try {
    await state.backend.undoEnterpriseChange(changeId, state.session.user);
  } catch (error) {
    showMessage(refs.historyMessage, formatError(error), true);
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

function exportPortCsv(records) {
  const headers = state.activePortView === "agents"
    ? ["编号", "港口", "船代公司", "地址", "电话", "传真", "邮箱", "联系人", "原始文本", "来源"]
    : ["编号", "所在地", "港口", "码头", "泊位", "吃水(米)", "最大载重吨", "夏天海水密度", "特殊要求", "来源"];
  const rows = state.activePortView === "agents"
    ? records.map((record) => {
      const agent = normalizeShippingAgent(record);
      return [
        agent.code,
        agent.port_name,
        agent.agency_name,
        agent.address,
        agent.tel,
        agent.fax,
        agent.email,
        agent.contact_persons,
        agent.raw_text,
        agent.source_document,
      ];
    })
    : records.map((record) => [
      record.code,
      record.location,
      record.port_name,
      record.terminal_name,
      record.berth,
      record.draft_m,
      record.max_dwt_tons,
      record.summer_density,
      record.special_requirements,
      record.source_document,
    ]);
  const csv = [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");
  const filename = state.activePortView === "agents" ? "shipping-agents.csv" : "port-berths.csv";
  downloadBlob(`\ufeff${csv}`, "text/csv;charset=utf-8", filename);
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

function detailRowCompact(label, value) {
  const text = singleLine(value) || "-";
  return `<div class="detail-row detail-row-compact"><span>${escapeHtml(label)}</span><span title="${escapeHtml(text)}">${escapeHtml(text)}</span></div>`;
}

function normalizeShippingAgent(record) {
  const parsed = parseShippingAgentText(record.raw_text);
  return {
    ...record,
    address: singleLine(parsed.address || record.address),
    tel: singleLine(parsed.tel || cleanupAgentTel(record.tel)),
    fax: singleLine(parsed.fax || cleanupAgentFax(record.fax)),
    email: singleLine(parsed.email || cleanupAgentEmail(record.email)),
    contact_persons: singleLine(parsed.contact_persons || cleanupAgentContacts(record.contact_persons)),
  };
}

function parseShippingAgentText(rawText) {
  const lines = contentLines(rawText);
  const emailMatches = lines
    .flatMap((line) => line.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) || []);

  return {
    address: uniqueLines(lines.filter(isAddressLine).map(cleanLabel)).join(" / "),
    tel: uniqueLines(lines.filter(isTelephoneLine).map(cleanLabel)).join(" / "),
    fax: uniqueLines(lines.filter(isFaxLine).map(cleanLabel)).join(" / "),
    email: uniqueLines(emailMatches).join(" / "),
    contact_persons: uniqueLines(lines.filter(isContactLine).map(cleanLabel)).join(" / "),
  };
}

function cleanupAgentTel(value) {
  const lines = contentLines(value);
  const cleaned = uniqueLines(lines.filter(isTelephoneLine).map(cleanLabel)).join(" / ");
  return cleaned || singleLine(value);
}

function cleanupAgentFax(value) {
  const lines = contentLines(value);
  const cleaned = uniqueLines(lines.filter(isFaxLine).map(cleanLabel)).join(" / ");
  return cleaned || singleLine(value);
}

function cleanupAgentEmail(value) {
  const emails = contentLines(value)
    .flatMap((line) => line.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) || []);
  return uniqueLines(emails).join(" / ") || singleLine(value);
}

function cleanupAgentContacts(value) {
  const lines = contentLines(value);
  const cleaned = uniqueLines(lines.filter(isContactLine).map(cleanLabel)).join(" / ");
  return cleaned || singleLine(value);
}

function contentLines(value) {
  return String(value || "")
    .split(/\r?\n/)
    .map((line) => singleLine(line))
    .filter(Boolean);
}

function uniqueLines(lines) {
  return [...new Set(lines.map((line) => singleLine(line)).filter(Boolean))];
}

function isAddressLine(line) {
  return /^(add|address)\b\s*[:：]?/i.test(line);
}

function isTelephoneLine(line) {
  if (isContactLine(line) || isFaxLine(line)) return false;
  return /^(tel|telephone|tele\s*no|office\s*tel|office\s*phone|phone|mobile|mob|cell\s*phone|direct\s*line|mb)\b\s*[:：]?/i.test(line);
}

function isFaxLine(line) {
  return /^(fax|facsimile|tel\s*\/\s*fax|tel\s*&\s*fax)\b\s*[:：]?/i.test(line);
}

function isContactLine(line) {
  return /\b(pic|attn|contact|operator|manager|mr\.?|ms\.?|mrs\.?|wechat|we\s*chat|op)\b/i.test(line);
}

function cleanLabel(line) {
  return singleLine(line)
    .replace(/^(add|address)\b\s*[:：]?/i, "")
    .replace(/^(fax|facsimile|tel\s*\/\s*fax|tel\s*&\s*fax)\b\s*[:：]?/i, "")
    .replace(/^(tel|telephone|tele\s*no|office\s*tel|office\s*phone|phone|mobile|mob|cell\s*phone|direct\s*line|mb)\b\s*[:：]?/i, "")
    .replace(/^(e-?mail|email)\b\s*[:：]?/i, "")
    .trim();
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

function formatError(error) {
  const message = error?.message || error?.msg || error?.errMsg || String(error || "未知错误");
  if (/collection|not exist|不存在|not found/i.test(message)) {
    return `${message}。请确认 CloudBase 数据库集合已创建：database_modules、profiles、enterprises、port_berths、shipping_agents、record_audit_logs。`;
  }
  if (/auth|login|permission|unauthorized|forbidden|权限/i.test(message)) {
    return `${message}。请确认 CloudBase 身份认证和数据库安全规则已开启。`;
  }
  return message;
}

function formatNumber(value) {
  return new Intl.NumberFormat("zh-CN", { maximumFractionDigits: 2 }).format(Number(value || 0));
}

function formatDate(value) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("zh-CN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function singleLine(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function shortText(value, limit) {
  const text = singleLine(value);
  if (text.length <= limit) return text;
  return `${text.slice(0, limit)}...`;
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
