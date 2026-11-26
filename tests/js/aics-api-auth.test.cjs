const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");

const bridgeSource = fs.readFileSync(
  path.resolve(__dirname, "../../public/aics-api.js"),
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

function makeHarness({ storedToken = "" } = {}) {
  const calls = [];
  const session = new Map();
  const local = new Map([["currentUser", "stale-user"]]);
  if (storedToken) session.set("aics_api_token", storedToken);

  const elements = {
    loginUsername: { value: "temporary.staff", classList: makeClassList(), focus() {} },
    loginPassword: { value: "TemporaryPass123!", classList: makeClassList() },
    loginErrorAlert: {
      classList: makeClassList(["hidden"]),
      querySelector() { return { textContent: "" }; },
    },
    loginCard: { classList: makeClassList() },
    firstLoginCard: { classList: makeClassList(["hidden"]) },
    newPasswordInput: { value: "MyNewPassword456!", focus() {} },
    confirmNewPasswordInput: { value: "MyNewPassword456!" },
    userDropdown: { classList: makeClassList(["hidden"]) },
    loginForm: { reset() {} },
  };
  const loginButton = { disabled: false, textContent: "Log in" };
  const document = {
    getElementById(id) {
      if (!elements[id]) {
        elements[id] = { value: "", textContent: "", classList: makeClassList(), focus() {}, querySelector() { return { classList: makeClassList() }; }, setAttribute() {} };
      }
      return elements[id];
    },
    querySelector(selector) {
      return selector === "#loginForm button[type='submit']" ? loginButton : null;
    },
    querySelectorAll() { return []; },
    addEventListener() {},
  };

  const appState = {
    currentUser: null,
    agencies: [],
    barangays: [],
    assistanceTypes: [],
    signatories: [],
    rules: {},
    records: [],
    users: [],
  };
  const storageKeys = {
    AGENCIES: "agencies",
    BARANGAYS: "barangays",
    ASSISTANCE_TYPES: "assistanceTypes",
    SIGNATORIES: "signatories",
    RULES: "rules",
    RECORDS: "records",
    CURRENT_USER: "currentUser",
    IS_ONLINE: "isOnline",
  };
  const user = {
    id: 7,
    name: "Synthetic Staff",
    username: "temporary.staff",
    role: "Staff",
    status: "Active",
    must_change_password: true,
  };

  function response(status, body) {
    return {
      ok: status >= 200 && status < 300,
      status,
      async text() { return JSON.stringify(body); },
    };
  }

  const fetch = async (url, options = {}) => {
    calls.push({ url, options });
    if (url.endsWith("/auth/login")) {
      return response(200, { token: "synthetic-bearer-token", token_type: "Bearer", user });
    }
    if (url.endsWith("/auth/me")) return response(200, { user });
    if (url.endsWith("/auth/logout")) return response(200, { message: "Logged out." });
    if (url.endsWith("/auth/password")) {
      const payload = JSON.parse(options.body || "{}");
      if (payload.current_password !== "TemporaryPass123!") {
        return response(422, { message: "The current password is incorrect.", errors: { current_password: ["The current password is incorrect."] } });
      }
      return response(200, { message: "Password changed. Please log in again." });
    }
    if (url.match(/\/admin\/users\/\d+$/) && options.method === "PATCH") {
      return response(200, { data: { id: 7, name: "Synthetic Administrator", username: "synthetic.admin" } });
    }
    if (url.endsWith("/lookups")) {
      return response(200, { agencies: [], barangays: [], assistanceTypes: [], signatories: [], rules: {} });
    }
    if (url.includes("/transactions?")) return response(200, { data: [] });
    return response(404, { message: "Unexpected test request: " + url });
  };

  const window = {
    addEventListener() {},
    executeHomeSearch() {},
    executeSaveRecord() {},
    saveRecordCorrection() {},
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
    showAuthView() {
      elements.loginCard.classList.remove("hidden");
      elements.firstLoginCard.classList.add("hidden");
    },
    setAuthenticatedUser() {},
    saveStorage() {},
    populateBarangayOptions() {},
    populateAgencyDropdowns() {},
    renderRecentTransactions() {},
    updateOnlineStatusUI() {},
    alert() {},
    console,
  };

  vm.runInNewContext(bridgeSource, context, { filename: "public/aics-api.js" });
  return { window, elements, calls, session, local, appState };
}

test("must-change login shows the forced password screen before loading the workspace", async () => {
  const harness = makeHarness();

  await harness.window.handleLogin({ preventDefault() {} });

  assert.equal(harness.elements.firstLoginCard.classList.contains("hidden"), false);
  assert.equal(harness.elements.loginCard.classList.contains("hidden"), true);
  assert.deepEqual(harness.calls.map((call) => call.url), ["/api/v1/auth/login"]);
  assert.equal(harness.session.get("aics_api_token"), "synthetic-bearer-token");
  assert.equal(harness.elements.loginPassword.value, "");
});

test("first-login form sends the temporary password and revokes the session after success", async () => {
  const harness = makeHarness();

  await harness.window.handleLogin({ preventDefault() {} });
  await harness.window.handleFirstLoginSubmit({ preventDefault() {} });

  const passwordCall = harness.calls.find((call) => call.url.endsWith("/auth/password"));
  assert.ok(passwordCall, "password-change endpoint should be called");
  assert.equal(passwordCall.options.method, "PUT");
  assert.equal(passwordCall.options.headers.Authorization, "Bearer synthetic-bearer-token");
  assert.deepEqual(JSON.parse(passwordCall.options.body), {
    current_password: "TemporaryPass123!",
    password: "MyNewPassword456!",
    password_confirmation: "MyNewPassword456!",
  });
  assert.equal(harness.session.has("aics_api_token"), false);
  assert.equal(harness.local.has("currentUser"), false);
  assert.equal(harness.elements.firstLoginCard.classList.contains("hidden"), true);
  assert.equal(harness.elements.loginCard.classList.contains("hidden"), false);
});

test("canceling first-login revokes the temporary token and clears the password form", async () => {
  const harness = makeHarness();

  await harness.window.handleLogin({ preventDefault() {} });
  await harness.window.cancelFirstLogin();

  assert.equal(harness.session.has("aics_api_token"), false);
  assert.equal(harness.appState.currentUser, null);
  assert.equal(harness.elements.firstLoginCard.classList.contains("hidden"), true);
  assert.equal(harness.elements.loginCard.classList.contains("hidden"), false);
  assert.deepEqual(harness.calls.map((call) => call.url), [
    "/api/v1/auth/login",
    "/api/v1/auth/logout",
  ]);
  assert.equal(harness.elements.newPasswordInput.value, "");
  assert.equal(harness.elements.confirmNewPasswordInput.value, "");
});

test("restoring a session that still requires password change returns the user to login", async () => {
  const harness = makeHarness({ storedToken: "stale-first-login-token" });

  await harness.window.initAuth();

  assert.equal(harness.session.has("aics_api_token"), false);
  assert.equal(harness.local.has("currentUser"), false);
  assert.deepEqual(harness.calls.map((call) => call.url), [
    "/api/v1/auth/me",
    "/api/v1/auth/logout",
  ]);
  assert.equal(harness.appState.currentUser, null);
});

test("resetting the signed-in administrator's password logs out instead of refreshing with a revoked token", async () => {
  const harness = makeHarness({ storedToken: "administrator-session-token" });
  harness.appState.currentUser = {
    id: 7,
    name: "Synthetic Administrator",
    username: "synthetic.admin",
    role: "Administrator",
    status: "Active",
    mustChangePass: false,
  };

  await harness.window.adminUpdateUser(7, { password: "TemporaryReset456!" });

  assert.deepEqual(harness.calls.map((call) => call.url), [
    "/api/v1/admin/users/7",
    "/api/v1/auth/logout",
  ]);
  assert.equal(harness.calls[0].options.method, "PATCH");
  assert.equal(harness.session.has("aics_api_token"), false);
  assert.equal(harness.local.has("currentUser"), false);
  assert.equal(harness.appState.currentUser, null);
});
