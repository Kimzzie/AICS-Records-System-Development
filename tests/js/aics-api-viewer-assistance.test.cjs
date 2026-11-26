const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");

const bridgeSource = fs.readFileSync(
  path.resolve(__dirname, "../../public/aics-api.js"),
  "utf8"
);
const scriptSource = fs.readFileSync(
  path.resolve(__dirname, "../../public/script.js"),
  "utf8"
);
const htmlSource = fs.readFileSync(
  path.resolve(__dirname, "../../public/index.html"),
  "utf8"
);

function makeClassList(initial = []) {
  const values = new Set(initial);
  return {
    add(value) { values.add(value); },
    remove(value) { values.delete(value); },
    contains(value) { return values.has(value); },
    toggle(value, force) {
      const shouldAdd = force === undefined ? !values.has(value) : force;
      if (shouldAdd) values.add(value);
      else values.delete(value);
      return shouldAdd;
    },
  };
}

function makeElement() {
  return {
    value: "",
    textContent: "",
    className: "",
    disabled: false,
    children: [],
    classList: makeClassList(),
    appendChild(child) {
      this.children.push(child);
      this.textContent += child.textContent || "";
      return child;
    },
    append(...children) {
      children.forEach(child => this.appendChild(child));
    },
    replaceChildren(...children) {
      this.children = children;
      this.textContent = children.map(child => child.textContent || "").join("");
    },
    setAttribute() {},
    focus() {},
    reset() {},
    querySelector() { return null; },
  };
}

function makeHarness({
  role = "Viewer",
  storedToken = "",
  verificationStatus = 200,
  verificationBody = {
    data: {
      match_status: "no_match",
      records: [],
    },
  },
} = {}) {
  const calls = [];
  const session = new Map();
  const local = new Map();
  const elements = new Map();
  const loginButton = { disabled: false, textContent: "Log in" };

  const storageKeys = {
    CURRENT_USER: "aics_current_user",
    USERS: "aics_users_db",
    RECORDS: "aics_records_db",
    DRAFTS: "aics_drafts_db",
    AGENCIES: "aics_agencies_db",
    ASSISTANCE_TYPES: "aics_assistance_types_db",
    BARANGAYS: "aics_barangays_db",
    SIGNATORIES: "aics_signatories_db",
    RULES: "aics_rules_db",
    IS_ONLINE: "aics_is_online",
  };

  const operationalStorageKeys = [
    storageKeys.USERS,
    storageKeys.RECORDS,
    storageKeys.DRAFTS,
    storageKeys.AGENCIES,
    storageKeys.ASSISTANCE_TYPES,
    storageKeys.BARANGAYS,
    storageKeys.SIGNATORIES,
    storageKeys.RULES,
  ];
  operationalStorageKeys.forEach((key) => local.set(key, JSON.stringify(["stale-cache"])));
  if (storedToken) session.set("aics_api_token", storedToken);

  const user = {
    id: 7,
    name: "Synthetic Viewer",
    username: "synthetic.viewer",
    role,
    status: "Active",
    must_change_password: false,
  };

  const appState = {
    currentUser: null,
    users: [{ id: "stale-user" }],
    records: [{ id: "stale-record" }],
    drafts: [{ id: "stale-draft" }],
    agencies: [{ id: "stale-agency" }],
    barangays: ["Stale Barangay"],
    assistanceTypes: [{ id: "stale-assistance" }],
    signatories: [{ id: "stale-signatory" }],
    rules: { stale: true },
    isOnline: true,
  };

  function getElement(id) {
    if (!elements.has(id)) elements.set(id, makeElement());
    return elements.get(id);
  }

  getElement("loginUsername").value = "synthetic.viewer";
  getElement("loginPassword").value = "SyntheticPass123!";
  getElement("loginErrorAlert").querySelector = () => makeElement();
  getElement("userDropdown").classList.add("hidden");
  getElement("viewerAssistanceName").value = "Synthetic Person";
  getElement("viewerAssistanceBirthdate").value = "1990-01-15";
  getElement("viewerAssistanceResultArea");

  function response(status, body) {
    return {
      ok: status >= 200 && status < 300,
      status,
      async text() { return JSON.stringify(body); },
    };
  }

  const fetch = async (url, options = {}) => {
    calls.push({ url: String(url), options });
    if (String(url).endsWith("/auth/login")) {
      return response(200, {
        token: "synthetic-bearer-token",
        token_type: "Bearer",
        user,
      });
    }
    if (String(url).endsWith("/auth/me")) return response(200, { user });
    if (String(url).endsWith("/auth/logout")) return response(200, { message: "Logged out." });
    if (String(url).endsWith("/drafts")) return response(200, { data: [] });
    if (String(url).endsWith("/lookups")) {
      return response(200, {
        agencies: [],
        barangays: [],
        assistanceTypes: [],
        signatories: [],
        rules: {},
      });
    }
    if (String(url).includes("/transactions?")) return response(200, { data: [] });
    if (String(url).endsWith("/admin/users")) return response(200, []);
    if (String(url).endsWith("/viewer/assistance-verification")) {
      return response(verificationStatus, verificationBody);
    }
    return response(404, { message: "Unexpected test request: " + url });
  };

  const window = {
    addEventListener() {},
    executeHomeSearch() {},
    executeSaveRecord() {},
    saveRecordCorrection() {},
    scrollTo() {},
  };

  const document = {
    getElementById: getElement,
    createElement: makeElement,
    querySelector(selector) {
      return selector === "#loginForm button[type='submit']" ? loginButton : null;
    },
    querySelectorAll() { return []; },
    addEventListener() {},
  };

  const context = {
    window,
    document,
    appState,
    STORAGE_KEYS: storageKeys,
    sessionStorage: {
      getItem(key) { return session.has(key) ? session.get(key) : null; },
      setItem(key, value) { session.set(key, String(value)); },
      removeItem(key) { session.delete(key); },
    },
    localStorage: {
      getItem(key) { return local.has(key) ? local.get(key) : null; },
      setItem(key, value) { local.set(key, String(value)); },
      removeItem(key) { local.delete(key); },
    },
    fetch,
    clearLoginErrors() {},
    showAuthView() {},
    setAuthenticatedUser(nextUser) {
      appState.currentUser = nextUser;
      local.set(storageKeys.CURRENT_USER, JSON.stringify(nextUser));
    },
    saveStorage(key, value) { local.set(key, JSON.stringify(value)); },
    populateBarangayOptions() {},
    populateAgencyDropdowns() {},
    renderRecentTransactions() {},
    updateOnlineStatusUI() {},
    renderAdminUsers() {},
    alert() {},
    console,
  };

  vm.runInNewContext(bridgeSource, context, { filename: "public/aics-api.js" });

  return {
    window,
    elements,
    calls,
    session,
    local,
    appState,
    storageKeys,
    operationalStorageKeys,
    user,
  };
}

test("Viewer verification bridge sends POST JSON with bearer auth and no query-string identity", async () => {
  const harness = makeHarness({ storedToken: "synthetic-viewer-token" });

  await harness.window.verifyViewerAssistanceHistory("Synthetic Example", "1990-01-15");

  const call = harness.calls.find((item) => item.url.endsWith("/viewer/assistance-verification"));
  assert.ok(call);
  assert.equal(call.options.method, "POST");
  assert.equal(call.options.headers.Authorization, "Bearer synthetic-viewer-token");
  assert.equal(call.options.headers["Content-Type"], "application/json");
  assert.equal(call.url, "/api/v1/viewer/assistance-verification");
  assert.deepEqual(JSON.parse(call.options.body), {
    name: "Synthetic Example",
    birthdate: "1990-01-15",
  });
  assert.equal(call.url.includes("Synthetic Example"), false);
  assert.equal(call.url.includes("1990-01-15"), false);
});

test("fresh Viewer login skips operational endpoints and clears stale memory and storage", async () => {
  const harness = makeHarness();

  await harness.window.handleLogin({ preventDefault() {} });

  assert.equal(harness.appState.currentUser.role, "Viewer");
  assert.deepEqual(
    harness.calls.map((call) => call.url),
    ["/api/v1/auth/login"]
  );

  for (const key of [
    "users", "records", "drafts", "agencies", "barangays",
    "assistanceTypes", "signatories", "rules",
  ]) {
    if (key === "rules") {
      assert.equal(Object.keys(harness.appState[key]).length, 0);
    } else {
      assert.deepEqual(Array.from(harness.appState[key]), []);
    }
  }
  for (const key of harness.operationalStorageKeys) {
    assert.equal(harness.local.has(key), false, key + " cache should be removed");
  }
  assert.equal(harness.local.has(harness.storageKeys.CURRENT_USER), true);
  assert.equal(harness.session.get("aics_api_token"), "synthetic-bearer-token");
});

test("restored Viewer session skips operational endpoints and clears stale caches", async () => {
  const harness = makeHarness({ storedToken: "restored-viewer-token" });

  await harness.window.initAuth();

  assert.equal(harness.appState.currentUser.role, "Viewer");
  assert.deepEqual(
    harness.calls.map((call) => call.url),
    ["/api/v1/auth/me"]
  );
  assert.deepEqual(Array.from(harness.appState.records), []);
  assert.deepEqual(Array.from(harness.appState.drafts), []);
  assert.deepEqual(Array.from(harness.appState.users), []);
  for (const key of harness.operationalStorageKeys) {
    assert.equal(harness.local.has(key), false, key + " cache should be removed");
  }
});

test("Staff and Administrator retain operational loading while only Administrator loads users", async () => {
  const staff = makeHarness({ role: "Staff" });
  await staff.window.handleLogin({ preventDefault() {} });
  assert.ok(staff.calls.some((call) => call.url === "/api/v1/lookups"));
  assert.ok(staff.calls.some((call) => call.url.includes("/api/v1/transactions?")));
  assert.equal(staff.calls.some((call) => call.url.endsWith("/api/v1/admin/users")), false);

  const admin = makeHarness({ role: "Administrator" });
  await admin.window.handleLogin({ preventDefault() {} });
  assert.ok(admin.calls.some((call) => call.url === "/api/v1/lookups"));
  assert.ok(admin.calls.some((call) => call.url.includes("/api/v1/transactions?")));
  assert.ok(admin.calls.some((call) => call.url.endsWith("/api/v1/admin/users")));
});

test("503 verification failure is rendered as temporarily unavailable, not no-match", async () => {
  const harness = makeHarness({
    verificationStatus: 503,
    verificationBody: { message: "Assistance verification is temporarily unavailable." },
  });

  await harness.window.handleViewerAssistanceSubmit({ preventDefault() {} });

  const text = harness.elements.get("viewerAssistanceResultArea").textContent;
  assert.match(text, /temporarily unavailable/i);
  assert.doesNotMatch(text, /no matching|no record found/i);
});

test("result renderer displays only approved fields and ignores extra response properties", () => {
  const harness = makeHarness();
  harness.window.renderViewerAssistanceResult({
    data: {
      match_status: "confirmed_match",
      records: [{
        transaction_date: "2026-10-14",
        assistance_type: "Medical",
        gl_number: "SENSITIVE-GL",
        full_name: "Sensitive Name",
        amount: 999999,
        purpose: "Sensitive purpose",
        case_summary: "Sensitive summary",
      }],
      name: "Sensitive Top-Level Name",
    },
  });

  const text = harness.elements.get("viewerAssistanceResultArea").textContent
    + JSON.stringify(harness.elements.get("viewerAssistanceResultArea").children);
  assert.match(text, /2026-10-14/);
  assert.match(text, /Medical/);
  assert.doesNotMatch(text, /SENSITIVE-GL|Sensitive Name|999999|Sensitive purpose|Sensitive summary/i);
});

test("viewer verification inputs and results are cleared on logout and never persisted", async () => {
  const harness = makeHarness({ storedToken: "synthetic-viewer-token" });
  const resultArea = harness.elements.get("viewerAssistanceResultArea");
  resultArea.textContent = "Old private result";
  resultArea.classList.remove("hidden");

  await harness.window.handleLogout();

  assert.equal(harness.elements.get("viewerAssistanceName").value, "");
  assert.equal(harness.elements.get("viewerAssistanceBirthdate").value, "");
  assert.equal(resultArea.textContent, "");
  assert.equal(resultArea.classList.contains("hidden"), true);
  const stored = [...harness.local.values(), ...harness.session.values()].join(" ");
  assert.doesNotMatch(stored, /Synthetic Person|1990-01-15|Old private result/);
});

test("Viewer role is restricted to the Assistance Verification tab", () => {
  const permissionsStart = scriptSource.indexOf("const ROLE_PERMISSIONS =");
  const permissionsEnd = scriptSource.indexOf("\n};", permissionsStart) + 3;
  assert.ok(permissionsStart >= 0 && permissionsEnd > permissionsStart);
  const permissionsSource = scriptSource.slice(permissionsStart, permissionsEnd);
  const context = {};
  const permissions = vm.runInNewContext(permissionsSource + "\nROLE_PERMISSIONS", context);
  assert.deepEqual(Array.from(permissions.Viewer), ["assistance-verification"]);
  assert.match(scriptSource, /navAssistanceVerification/);
  assert.match(htmlSource, /id="tab-assistance-verification"/);
});
