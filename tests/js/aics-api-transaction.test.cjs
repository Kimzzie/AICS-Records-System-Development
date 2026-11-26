const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");

const projectRoot = path.resolve(__dirname, "../..");
const bridgePath = path.join(projectRoot, "public/aics-api.js");
const bridgeSource = fs.readFileSync(bridgePath, "utf8").replace(
  "  window.executeSaveRecord = async function () {",
  "  window.__testTransactionPayload = transactionPayload;\n  window.executeSaveRecord = async function () {"
);

function makeInputRow(values) {
  const inputs = values.map((value) => ({ value: String(value ?? "") }));
  return { querySelectorAll(selector) { return selector === "input" ? inputs : []; } };
}

function makeHarness({ assistanceValue = "Medical", assistanceTypes = [{ id: 4, type: "Medical" }], beneficiaryBirthdate = "2016-08-14" } = {}) {
  const values = {
    cLastName: "Santos",
    cFirstName: "Maria",
    cMiddleName: "Lopez",
    cExt: "",
    bLastName: "Santos",
    bFirstName: "Juan",
    bMiddleName: "",
    bExt: "",
    formTxnDate: "2026-11-25",
    cStreet: "Purok 1",
    cBarangay: "North Poblacion",
    astProvided: "Medical assistance",
    astAmount: "1500",
    astAmountWords: "ONE THOUSAND FIVE HUNDRED PESOS ONLY",
    astFundSource: "MSWDO",
    astPurpose: "Medical expenses",
    astPartnerAgency: "",
    astContactPerson: "Social Worker",
    astContactNumber: "09171234567",
    astValidUntil: "",
    caseSummaryText: "Synthetic test record",
    cMobile: "09171234567",
    cBirthdate: "1985-05-12",
    cGender: "Female",
    cCivilStatus: "Married",
    cOccupation: "Vendor",
    cSalary: "8000",
    bStreet: "Purok 1",
    bBarangay: "North Poblacion",
    bBirthdate: beneficiaryBirthdate,
    bGender: "Male",
    bCivilStatus: "Single",
    bOccupation: "Student",
    bSalary: "0",
    bRelationship: "Son",
    otherCategoryInput: "Person with a chronic condition",
  };

  const checked = {
    "input[name='finAssistance']:checked": { value: assistanceValue },
    "input[name='clientType']:checked": { value: "Returning" },
    "input[name='sourceType']:checked": { value: "Walk-in" },
  };
  const selected = {
    "input[name='targetSector']:checked": [{ value: "FHONA" }],
    "input[name='subCategory']:checked": [
      { value: "Solo parents" },
      { value: "Others" },
    ],
  };

  const familyTableBody = {
    children: [
      makeInputRow(["Maria Lopez Santos", "Client", "41", "Married", "Vendor", "8,000.00"]),
      makeInputRow(["Juan Santos", "Son", "10", "Single", "Student", "0"]),
      makeInputRow(["", "", "", "", "", ""]),
    ],
  };

  const document = {
    getElementById(id) {
      if (id === "familyTableBody") return familyTableBody;
      return { value: Object.prototype.hasOwnProperty.call(values, id) ? values[id] : "" };
    },
    querySelector(selector) { return checked[selector] || null; },
    querySelectorAll(selector) { return selected[selector] || []; },
    addEventListener() {},
  };

  const window = { addEventListener() {} };
  const context = {
    window,
    document,
    appState: { assistanceTypes },
    sessionStorage: { getItem() { return null; }, setItem() {}, removeItem() {} },
    localStorage: { getItem() { return null; }, setItem() {}, removeItem() {} },
    STORAGE_KEYS: {},
    fetch: async () => { throw new Error("fetch should not be called by payload-only tests"); },
    saveStorage() {},
    populateBarangayOptions() {},
    populateAgencyDropdowns() {},
    renderRecentTransactions() {},
    renderAdminUsers() {},
    showAuthView() {},
    setAuthenticatedUser() {},
    clearLoginErrors() {},
    console,
  };

  vm.runInNewContext(bridgeSource, context, { filename: "public/aics-api.js" });
  return window.__testTransactionPayload();
}

test("transaction payload preserves selected subcategories and the custom Others text", () => {
  const payload = makeHarness();

  assert.equal(
    payload.sub_category,
    "Solo parents, Others: Person with a chronic condition"
  );
});

test("transaction payload preserves every non-empty family composition row", () => {
  const payload = makeHarness();

  assert.deepEqual(JSON.parse(JSON.stringify(payload.family_members)), [
    {
      full_name: "Maria Lopez Santos",
      relationship: "Client",
      age: 41,
      civil_status: "Married",
      occupation: "Vendor",
      monthly_salary: 8000,
    },
    {
      full_name: "Juan Santos",
      relationship: "Son",
      age: 10,
      civil_status: "Single",
      occupation: "Student",
      monthly_salary: 0,
    },
  ]);
});

test("each canonical seeded assistance type resolves to its lookup ID", () => {
  const categories = [
    ["Medical", 1],
    ["Burial", 2],
    ["Fire incident", 3],
    ["Transportation", 4],
    ["Food", 5],
    ["Cash", 6],
  ];

  for (const [name, id] of categories) {
    const payload = makeHarness({
      assistanceValue: name,
      assistanceTypes: categories.map(([type, lookupId]) => ({ type, id: lookupId })),
    });
    assert.equal(payload.assistance_type_id, id, name + " should resolve to its lookup ID.");
  }
});

test("the transaction form exposes exactly one choice for every canonical seeded assistance type", () => {
  const html = fs.readFileSync(path.join(projectRoot, "public/index.html"), "utf8");
  const inputs = [...html.matchAll(/<input\b[^>]*name="finAssistance"[^>]*>/g)].map((match) => match[0]);
  const actual = inputs.map((input) => {
    const type = input.match(/type="([^"]+)"/)?.[1];
    const value = input.match(/value="([^"]+)"/)?.[1];
    return { type, value };
  });
  const expected = ["Medical", "Burial", "Fire incident", "Transportation", "Food", "Cash"];

  assert.deepEqual(actual.map((item) => item.type), expected.map(() => "radio"));
  assert.deepEqual(actual.map((item) => item.value), expected);
});

test("a missing beneficiary birthdate is not silently replaced with the client's birthdate", () => {
  const payload = makeHarness({ beneficiaryBirthdate: "" });

  assert.equal(payload.beneficiary.birthdate, null);
  assert.equal(payload.client.birthdate, "1985-05-12");
});
