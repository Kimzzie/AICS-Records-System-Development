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
  return { value, textContent: "", children: [], replaceChildren(...children) { this.children = children; }, appendChild(child) { this.children.push(child); }, classList: { add() {}, remove() {}, toggle() {} } };
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
    otherCategoryInput: "", formGlNo: "",
  };
  const fields = Object.fromEntries(Object.entries(values).map(([key, value]) => [key, element(value)]));
  const familyTableBody = { children: [] };
  fields.familyTableBody = familyTableBody;
  const document = {
    getElementById(id) {
      if (!fields[id]) fields[id] = element("");
      return fields[id];
    },
    querySelector(selector) {
      if (selector === "input[name='finAssistance']:checked") return { value: "Medical" };
      if (selector === "input[name='clientType']:checked") return { value: "New" };
      if (selector === "input[name='sourceType']:checked") return { value: "Walk-in" };
      return null;
    },
    querySelectorAll(selector) {
      if (selector === "input[name='targetSector']:checked") return [{ value: "FHONA" }];
      if (selector === "input[name='subCategory']:checked") return [{ value: "Solo parents" }];
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
  const calls = [];
  const fetch = async (url, options = {}) => {
    calls.push({ url, method: options.method || "GET" });
    if (url.endsWith("/transactions") && options.method === "POST") {
      return response(201, { data: serverRecord, message: "Transaction saved." });
    }
    if (url.endsWith("/lookups")) {
      return response(200, { agencies: [], barangays: [], assistanceTypes: [{ id: 1, name: "Medical", requirements: [] }], signatories: [], rules: {} });
    }
    if (url.includes("/transactions?per_page=100")) {
      return response(200, { data: [serverRecord] });
    }
    throw new Error("Unexpected request " + url);
  };
  function response(status, body) {
    return { ok: status >= 200 && status < 300, status, async text() { return JSON.stringify(body); } };
  }

  const appState = { assistanceTypes: [{ id: 1, type: "Medical" }], records: [], agencies: [], barangays: [], signatories: [], rules: {} };
  const localPreviewRecord = { glNo: "0001-2026", fromLocalPreview: true };
  const window = {
    executeHomeSearch() {},
    executeSaveRecord() { appState.records.unshift(localPreviewRecord); },
    saveRecordCorrection() {},
    addEventListener() {},
  };
  const context = {
    window, document, appState, STORAGE_KEYS: {},
    sessionStorage: { getItem() { return "synthetic-token"; }, setItem() {}, removeItem() {} },
    localStorage: { getItem() { return null; }, setItem() {}, removeItem() {} },
    fetch, saveStorage() {}, populateBarangayOptions() {}, populateAgencyDropdowns() {},
    renderRecentTransactions() {}, renderAdminUsers() {}, showAuthView() {},
    setAuthenticatedUser() {}, clearLoginErrors() {}, formatDateDisplay(value) { return value; },
    console,
  };
  const injected = bridgeSource.replace(
    "  window.executeSaveRecord = async function () {",
    "  window.__testTransactionPayload = transactionPayload;\n  window.executeSaveRecord = async function () {"
  );
  vm.runInNewContext(injected, context, { filename: "public/aics-api.js" });
  return { window, appState, calls, fields, serverRecord, localPreviewRecord };
}

test("successful API save leaves one persisted record in the records list", async () => {
  const harness = makeHarness();

  await harness.window.executeSaveRecord();

  assert.equal(harness.calls.filter(call => call.url.endsWith("/transactions") && call.method === "POST").length, 1);
  assert.equal(harness.appState.records.length, 1, "local preview plus API response must not create a duplicate row");
  assert.equal(harness.appState.records[0].id, 11);
  assert.equal(harness.appState.records[0].glNo, "0001-2026");
  assert.deepEqual(
    JSON.parse(JSON.stringify(harness.appState.records[0].familyMembers)),
    [{ full_name: "Synthetic Family Member", relationship: "Child", age: 12 }]
  );
});
