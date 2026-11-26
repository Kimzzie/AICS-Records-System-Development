const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");

const bridgeSource = fs.readFileSync(
  path.resolve(__dirname, "../../public/aics-api.js"),
  "utf8"
);

function element(value = "") {
  return {
    value,
    textContent: "",
    children: [],
    checked: false,
    type: "text",
    classList: { add() {}, remove() {}, toggle() {} },
    replaceChildren(...children) { this.children = children; },
    appendChild(child) { this.children.push(child); },
  };
}

function makeHarness() {
  const values = {
    cLastName: "Synthetic", cFirstName: "Requester", cMiddleName: "", cExt: "",
    bLastName: "Synthetic", bFirstName: "Beneficiary", bMiddleName: "", bExt: "",
    formTxnDate: "2026-11-25", cStreet: "Test Street", cBarangay: "Synthetic Barangay",
    cMobile: "09999990001", cBirthdate: "1988-07-14", cGender: "Female",
    cCivilStatus: "Married", cOccupation: "Synthetic QA", cSalary: "5000",
    bStreet: "Test Street", bBarangay: "Synthetic Barangay", bMobile: "09999990002",
    bBirthdate: "1980-02-10", bGender: "Male", bCivilStatus: "Single",
    bOccupation: "Synthetic QA", bSalary: "0", bRelationship: "Mother",
    astProvided: "Synthetic medical assistance", astAmount: "1500",
    astAmountWords: "ONE THOUSAND FIVE HUNDRED PESOS ONLY", astFundSource: "MSWDO",
    astPurpose: "Synthetic QA test", astPartnerAgency: "Synthetic Agency",
    astContactPerson: "Synthetic Contact", astContactNumber: "09999990003",
    astValidUntil: "", caseSummaryText: "Synthetic browser save regression",
    otherCategoryInput: "", formGlNo: "0007-2026",
  };
  const fields = Object.fromEntries(Object.entries(values).map(([key, value]) => [key, element(value)]));
  const familyTableBody = { children: [] };
  fields.familyTableBody = familyTableBody;

  const namedControls = [
    { name: "finAssistance", type: "radio", value: "Medical", checked: true },
    { name: "finAssistance", type: "radio", value: "Burial", checked: false },
    { name: "clientType", type: "radio", value: "New", checked: true },
    { name: "sourceType", type: "radio", value: "Walk-in", checked: true },
    { name: "targetSector", type: "checkbox", value: "FHONA", checked: true },
    { name: "targetSector", type: "checkbox", value: "PWD", checked: false },
    { name: "subCategory", type: "checkbox", value: "Solo parents", checked: true },
    { name: "subCategory", type: "checkbox", value: "Others", checked: false },
    { name: "psychoAssistance", type: "checkbox", value: "Referral", checked: true },
  ];
  const fieldControls = Object.entries(values)
    .filter(([id]) => id !== "formGlNo")
    .map(([id, value]) => ({ id, type: id === "beneficiarySameAsClientCheckbox" ? "checkbox" : "text", value, checked: false }));
  const step2 = {
    querySelectorAll(selector) {
      if (selector === "input[id], select[id], textarea[id]") return fieldControls;
      if (selector === "input[name]") return namedControls;
      return [];
    },
    classList: { add() {}, remove() {}, toggle() {} },
  };
  const document = {
    getElementById(id) {
      if (id === "txnStep2") return step2;
      if (!fields[id]) fields[id] = element("");
      return fields[id];
    },
    querySelector(selector) {
      if (selector === "input[name='finAssistance']:checked") return namedControls.find(item => item.name === "finAssistance" && item.checked);
      if (selector === "input[name='clientType']:checked") return namedControls.find(item => item.name === "clientType" && item.checked);
      if (selector === "input[name='sourceType']:checked") return namedControls.find(item => item.name === "sourceType" && item.checked);
      return null;
    },
    querySelectorAll(selector) {
      if (selector === "input[name='targetSector']:checked") return namedControls.filter(item => item.name === "targetSector" && item.checked);
      if (selector === "input[name='subCategory']:checked") return namedControls.filter(item => item.name === "subCategory" && item.checked);
      return [];
    },
    addEventListener() {},
  };

  const serverRecord = {
    id: 11,
    gl_number: "0001-2026",
    transaction_date: "2026-11-25",
    client: { full_name: "Requester Synthetic", birthdate: "1988-07-14" },
    beneficiary: { full_name: "Beneficiary Synthetic", birthdate: "1980-02-10" },
    target_sector: "FHONA",
    sub_category: "Solo parents",
    assistance_type_id: 1,
    assistance_type: { name: "Medical" },
    assistance_provided: "Synthetic medical assistance",
    amount: "1500.00",
    amount_words: "ONE THOUSAND FIVE HUNDRED PESOS ONLY",
    family_members: [{ full_name: "Synthetic Family Member", relationship: "Child", age: 12 }],
  };
  const storedDraft = {
    id: 21,
    client_name: "Requester Synthetic",
    beneficiary_name: "Beneficiary Synthetic",
    assistance: "Medical",
    last_saved_at: "2026-11-25T09:00:00.000000Z",
    updated_at: "2026-11-25T09:00:00.000000Z",
    form_data: {
      schema_version: 1,
      transaction: { client: { full_name: "Requester Synthetic" } },
      fields: { cBarangay: { value: "Synthetic Barangay" } },
      groups: { finAssistance: "Medical" },
      step1: { client_name: "Requester Synthetic" },
    },
  };
  const calls = [];
  let failDraftSave = false;

  const fetch = async (url, options = {}) => {
    const method = options.method || "GET";
    const body = options.body ? JSON.parse(options.body) : null;
    calls.push({ url, method, body });

    if (url.endsWith("/drafts") && method === "GET") {
      return response(200, { data: [storedDraft] });
    }
    if (url.endsWith("/drafts") && method === "POST") {
      if (failDraftSave) return response(422, { message: "Draft validation failed." });
      return response(201, { data: { ...storedDraft, ...body, form_data: body.form_data, id: 21 } });
    }
    if (url.endsWith("/drafts/21") && method === "GET") {
      return response(200, { data: storedDraft });
    }
    if (url.endsWith("/drafts/21") && method === "PUT") {
      return response(200, { data: { ...storedDraft, ...body, form_data: body.form_data } });
    }
    if (url.endsWith("/drafts/21") && method === "DELETE") {
      return response(200, { message: "Draft deleted." });
    }
    if (url.endsWith("/transactions") && method === "POST") {
      return response(201, { data: serverRecord, message: "Transaction saved." });
    }
    if (url.endsWith("/admin/settings") && method === "PUT") {
      return response(200, { data: body, message: "Settings saved." });
    }
    if (url.endsWith("/lookups")) {
      return response(200, { agencies: [], barangays: [], assistanceTypes: [{ id: 1, name: "Medical", requirements: [] }], signatories: [], rules: {} });
    }
    if (url.includes("/transactions?per_page=100")) {
      return response(200, { data: [serverRecord] });
    }
    throw new Error("Unexpected request " + method + " " + url);
  };

  function response(status, body) {
    return {
      ok: status >= 200 && status < 300,
      status,
      async text() { return JSON.stringify(body); },
    };
  }

  const appState = {
    assistanceTypes: [{ id: 1, type: "Medical" }],
    records: [],
    agencies: [],
    barangays: [],
    signatories: [],
    rules: {},
    drafts: [],
    currentDraftId: null,
    step1ClientName: "Requester Synthetic",
    step1BeneficiaryName: "Beneficiary Synthetic",
    step1AssistanceType: "Medical",
  };
  const localPreviewRecord = { glNo: "0001-2026", fromLocalPreview: true };
  const window = {
    executeHomeSearch() {},
    executeSaveRecord() { appState.records.unshift(localPreviewRecord); },
    saveRecordCorrection() {},
    updateDraftsCountBadge() {},
    addEventListener() {},
  };
  const context = {
    window, document, appState, STORAGE_KEYS: { DRAFTS: "aics_drafts_db", CURRENT_USER: "aics_current_user" },
    sessionStorage: { getItem() { return "synthetic-token"; }, setItem() {}, removeItem() {} },
    localStorage: { getItem() { return null; }, setItem() {}, removeItem() {} },
    fetch, saveStorage() {}, populateBarangayOptions() {}, populateAgencyDropdowns() {},
    renderRecentTransactions() {}, renderAdminUsers() {}, showAuthView() {},
    setAuthenticatedUser() {}, clearLoginErrors() {}, formatDateDisplay(value) { return value; },
    console,
  };
  vm.runInNewContext(bridgeSource, context, { filename: "public/aics-api.js" });
  return { window, appState, calls, fields, namedControls, serverRecord, storedDraft, localPreviewRecord, setFailDraftSave(value) { failDraftSave = value; } };
}

test("draft collection loads creator summaries from the API without form data", async () => {
  const harness = makeHarness();

  const drafts = await harness.window.loadTransactionDrafts();

  assert.equal(harness.calls[0].url, "/api/v1/drafts");
  assert.equal(drafts.length, 1);
  assert.equal(drafts[0].id, 21);
  assert.equal(drafts[0].clientName, "Requester Synthetic");
  assert.equal(drafts[0].lastSavedAt, harness.storedDraft.last_saved_at);
  assert.equal(Object.hasOwn(drafts[0], "form_data"), false);
});

test("form capture produces a versioned snapshot with all named groups and omits generated GL number", () => {
  const harness = makeHarness();

  const snapshot = harness.window.captureTransactionDraftForm();

  assert.equal(snapshot.schema_version, 1);
  assert.equal(snapshot.transaction.client.full_name, "Requester Synthetic");
  assert.equal(snapshot.fields.cBarangay.value, "Synthetic Barangay");
  assert.equal(Object.hasOwn(snapshot.fields, "formGlNo"), false);
  assert.equal(snapshot.groups.finAssistance, "Medical");
  assert.deepEqual(Array.from(snapshot.groups.targetSector), ["FHONA"]);
  assert.deepEqual(Array.from(snapshot.groups.subCategory), ["Solo parents"]);
  assert.deepEqual(Array.from(snapshot.groups.psychoAssistance), ["Referral"]);
  assert.equal(snapshot.step1.client_name, "Requester Synthetic");
});

test("saving a new draft posts the full versioned form and records the server ID", async () => {
  const harness = makeHarness();

  const saved = await harness.window.saveTransactionDraft();

  const request = harness.calls.find(call => call.url === "/api/v1/drafts" && call.method === "POST");
  assert.ok(request);
  assert.equal(request.body.client_name, "Requester Synthetic");
  assert.equal(request.body.beneficiary_name, "Beneficiary Synthetic");
  assert.equal(request.body.assistance, "Medical");
  assert.equal(request.body.form_data.schema_version, 1);
  assert.equal(request.body.form_data.fields.cBarangay.value, "Synthetic Barangay");
  assert.equal(saved.id, 21);
  assert.equal(harness.appState.currentDraftId, 21);
  assert.equal(harness.appState.drafts[0].id, 21);
});

test("saving an existing draft uses PUT and does not send a client-controlled ID", async () => {
  const harness = makeHarness();
  harness.appState.currentDraftId = 21;

  await harness.window.saveTransactionDraft();

  const request = harness.calls.find(call => call.url === "/api/v1/drafts/21" && call.method === "PUT");
  assert.ok(request);
  assert.equal(Object.hasOwn(request.body, "id"), false);
});

test("Administrator retention settings persist to the Laravel settings endpoint", async () => {
  const harness = makeHarness();
  harness.appState.currentUser = { id: 1, role: "Administrator" };
  const payload = { keepDraftsDays: 45 };

  const result = await harness.window.adminUpdateSettings(payload);

  const request = harness.calls.find(call => call.url === "/api/v1/admin/settings" && call.method === "PUT");
  assert.ok(request);
  assert.deepEqual(request.body, payload);
  assert.equal(result.data.keepDraftsDays, 45);
  assert.equal(harness.appState.rules.keepDraftsDays, 45);
});

test("draft detail and deletion use the persisted API resource", async () => {
  const harness = makeHarness();

  const detail = await harness.window.getTransactionDraft(21);
  assert.equal(harness.calls.at(-1).url, "/api/v1/drafts/21");
  assert.equal(detail.data.form_data.schema_version, 1);

  harness.appState.currentDraftId = 21;
  await harness.window.deleteTransactionDraft(21);
  assert.equal(harness.calls.at(-1).method, "DELETE");
  assert.equal(harness.appState.drafts.length, 0);
  assert.equal(harness.appState.currentDraftId, null);
});

test("failed draft saves do not create a local draft or claim a server ID", async () => {
  const harness = makeHarness();
  harness.setFailDraftSave(true);

  await assert.rejects(() => harness.window.saveTransactionDraft(), /Draft validation failed/);

  assert.equal(harness.appState.currentDraftId, null);
  assert.equal(harness.appState.drafts.length, 0);
});

test("official transaction submission includes the exact draft ID for atomic consumption", async () => {
  const harness = makeHarness();
  harness.appState.currentDraftId = 21;

  await harness.window.executeSaveRecord();

  const request = harness.calls.find(call => call.url === "/api/v1/transactions" && call.method === "POST");
  assert.ok(request);
  assert.equal(request.body.draft_id, 21);
  assert.equal(harness.appState.records.length, 1);
  assert.equal(harness.appState.records[0].id, 11);
});
