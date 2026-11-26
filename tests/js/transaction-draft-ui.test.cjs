const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");

const scriptSource = fs.readFileSync(
  path.resolve(__dirname, "../../public/script.js"),
  "utf8"
);

function makeField(value = "") {
  return {
    value,
    textContent: "",
    checked: false,
    classList: { add() {}, remove() {}, toggle() {} },
  };
}

function makeFamilyRow() {
  const inputs = Array.from({ length: 6 }, () => ({ value: "" }));
  return {
    inputs,
    querySelectorAll(selector) {
      return selector === "input" ? inputs : [];
    },
  };
}

function extractRestoreFunction() {
  const start = scriptSource.indexOf("window.restoreTransactionDraftForm = function");
  assert.notEqual(start, -1, "the production restore function must exist");
  const end = scriptSource.indexOf("\n};", start);
  assert.notEqual(end, -1, "the production restore function must be closed");
  return scriptSource.slice(start, end + 3);
}

test("resuming a saved draft restores fields, selected groups, family rows, and regenerates the preview GL number", () => {
  const fields = {
    cLastName: makeField(""),
    cFirstName: makeField(""),
    bLastName: makeField(""),
    bFirstName: makeField(""),
    caseSummaryText: makeField(""),
    beneficiarySameAsClientCheckbox: makeField(""),
    formGlNo: makeField("stale-number"),
    step1BeneficiaryInput: makeField(""),
  };
  fields.beneficiarySameAsClientCheckbox.type = "checkbox";

  const namedControls = [
    { name: "finAssistance", type: "radio", value: "Medical", checked: true },
    { name: "finAssistance", type: "radio", value: "Burial", checked: false },
    { name: "clientType", type: "radio", value: "New", checked: true },
    { name: "clientType", type: "radio", value: "Returning", checked: false },
    { name: "sourceType", type: "radio", value: "Walk-in", checked: true },
    { name: "sourceType", type: "radio", value: "Referral", checked: false },
    { name: "targetSector", type: "checkbox", value: "SC", checked: false },
    { name: "targetSector", type: "checkbox", value: "PWD", checked: false },
    { name: "subCategory", type: "checkbox", value: "Others", checked: false },
    { name: "psychoAssistance", type: "checkbox", value: "Referral", checked: false },
  ];
  const step2 = {
    classList: { add() {}, remove() {}, toggle() {} },
    querySelectorAll(selector) {
      return selector === "input[name]" ? namedControls : [];
    },
  };
  const familyBody = {
    children: [],
    replaceChildren() { this.children = []; },
  };
  const panels = {
    txnStep1: { classList: { add() {}, remove() {} } },
    txnStep2: step2,
    txnStep3: { classList: { add() {}, remove() {} } },
    txnStep4: { classList: { add() {}, remove() {} } },
    txnStatusBar: { classList: { add() {}, remove() {} } },
    draftSavedPill: { classList: { add() {}, remove() {} } },
    step1ClientDisplay: { textContent: "" },
    familyTableBody: familyBody,
  };
  const document = {
    getElementById(id) {
      return fields[id] || panels[id] || null;
    },
  };

  const appState = { currentDraftId: 9, currentTxnStep: 1 };
  let brandNewResetCount = 0;
  const context = {
    window: {},
    document,
    appState,
    startBrandNewTransaction() {
      brandNewResetCount += 1;
      appState.currentDraftId = null;
      appState.currentTxnStep = 1;
    },
    toggleBeneficiarySameAsClient() {},
    updateFamilyTableFromClient() {
      familyBody.children = [makeFamilyRow()];
    },
    addFamilyRow() {
      familyBody.children.push(makeFamilyRow());
    },
    generateNextGlNumber() { return "0008-2026"; },
    updateStepperUI(step) { appState.stepper = step; },
    calculateClientAge() {},
    calculateBeneficiaryAge() {},
    updateCaseSummaryCount() {},
    updateLivePreview() {},
    validateFormFieldsRemaining() {},
  };
  vm.runInNewContext(extractRestoreFunction(), context, { filename: "public/script.js#restoreTransactionDraftForm" });

  const formData = {
    schema_version: 1,
    transaction: {
      client: { full_name: "Maria Santos" },
      beneficiary: { full_name: "Juan Santos" },
      family_members: [
        { full_name: "Maria Santos", relationship: "Client", age: 42, civil_status: "Married", occupation: "Vendor", monthly_salary: 8000 },
        { full_name: "Juan Santos", relationship: "Son", age: 12, civil_status: "Single", occupation: "Student", monthly_salary: 0 },
      ],
    },
    fields: {
      cLastName: { value: "Santos" },
      cFirstName: { value: "Maria" },
      bLastName: { value: "Santos" },
      bFirstName: { value: "Juan" },
      caseSummaryText: { value: "Synthetic restored case summary" },
      beneficiarySameAsClientCheckbox: { checked: false, value: "on" },
    },
    groups: {
      finAssistance: "Burial",
      clientType: "Returning",
      sourceType: "Referral",
      targetSector: ["SC", "PWD"],
      subCategory: ["Others"],
      psychoAssistance: ["Referral"],
    },
    step1: {
      client_name: "Maria Santos",
      beneficiary_name: "Juan Santos",
      assistance_type: "Burial",
    },
  };

  context.window.restoreTransactionDraftForm(formData, 42);

  assert.equal(brandNewResetCount, 1);
  assert.equal(appState.currentDraftId, 42);
  assert.equal(appState.currentTxnStep, 2);
  assert.equal(appState.stepper, 2);
  assert.equal(fields.cLastName.value, "Santos");
  assert.equal(fields.cFirstName.value, "Maria");
  assert.equal(fields.bFirstName.value, "Juan");
  assert.equal(fields.caseSummaryText.value, "Synthetic restored case summary");
  assert.equal(fields.formGlNo.value, "0008-2026");
  assert.equal(namedControls.find(control => control.name === "finAssistance" && control.value === "Burial").checked, true);
  assert.deepEqual(
    namedControls.filter(control => control.name === "targetSector" && control.checked).map(control => control.value),
    ["SC", "PWD"]
  );
  assert.equal(familyBody.children.length, 2);
  assert.equal(familyBody.children[0].inputs[0].value, "Maria Santos");
  assert.equal(familyBody.children[1].inputs[0].value, "Juan Santos");
  assert.equal(panels.step1ClientDisplay.textContent, "Maria Santos");
  assert.equal(fields.step1BeneficiaryInput.value, "Juan Santos");
});


test("initial family composition row treats a client-supplied name as a value, not HTML", () => {
  const start = scriptSource.indexOf("function updateFamilyTableFromClient()");
  assert.notEqual(start, -1, "the production family-row helper must exist");
  const end = scriptSource.indexOf("function addFamilyRow()", start);
  assert.notEqual(end, -1, "the family-row helper boundary must exist");
  const helper = scriptSource.slice(start, end);

  const values = {
    cLastName: { value: 'Santos"><img src=x onerror=alert(1)>' },
    cFirstName: { value: "<script>alert('xss')</script>" },
    cMiddleName: { value: "" },
    cAge: { value: "38" },
    cCivilStatus: { value: "Married" },
    cOccupation: { value: "Vendor" },
    cSalary: { value: "5000" },
  };
  const makeNode = () => ({
    value: "",
    type: "",
    className: "",
    readOnly: false,
    textContent: "",
    children: [],
    appendChild(child) { this.children.push(child); },
    addEventListener() {},
    querySelectorAll() { return []; },
  });
  const body = {
    children: [],
    appendChild(child) { this.children.push(child); },
  };
  const document = {
    getElementById(id) {
      if (id === "familyTableBody") return body;
      return values[id];
    },
    createElement: makeNode,
  };
  const context = { document, updateLivePreview() {} };

  vm.runInNewContext(helper, context, { filename: "public/script.js#updateFamilyTableFromClient" });
  context.updateFamilyTableFromClient();

  const firstInput = body.children[0].children[0].children[0];
  const expectedValue = "<script>alert('xss')</script> Santos" + '"><img src=x onerror=alert(1)>';
  assert.equal(firstInput.value, expectedValue);
  assert.equal(body.children[0].innerHTML, undefined);
  assert.equal(body.children[0].children[0].children[0].value, firstInput.value);
});


test("failed draft deletion keeps the confirmation dialog open and shows recovery guidance", async () => {
  const start = scriptSource.indexOf("async function confirmDeleteDraft()");
  assert.notEqual(start, -1);
  const end = scriptSource.indexOf("\ndocument.addEventListener", start);
  assert.notEqual(end, -1);
  const functionSource = scriptSource.slice(start, end);

  const button = { disabled: false, textContent: "Delete draft" };
  const error = { textContent: "" };
  const cancelButton = { focused: false, focus() { this.focused = true; } };
  const dialog = { classList: { add() {}, remove() {}, contains() { return false; } } };
  const elements = {
    confirmDeleteDraftButton: button,
    deleteDraftError: error,
    cancelDeleteDraftButton: cancelButton,
    deleteDraftConfirmModal: dialog,
  };
  const context = {
    window: { deleteTransactionDraft: async () => { throw new Error("Synthetic API failure"); } },
    document: { getElementById(id) { return elements[id] || null; } },
    pendingDraftDeleteId: 12,
    cancelDeleteDraft() { throw new Error("The dialog must stay open after a failed delete."); },
    renderDraftsTable() {},
    setDraftStatus() {},
  };
  vm.runInNewContext(
    "let pendingDraftDeleteId = 12;\n" + functionSource,
    context,
    { filename: "public/script.js#confirmDeleteDraft" }
  );

  await context.confirmDeleteDraft();

  assert.equal(error.textContent, "The draft could not be deleted. Check your connection and try again.");
  assert.equal(button.disabled, false);
  assert.equal(button.textContent, "Delete draft");
  assert.equal(cancelButton.focused, true);
  assert.equal(dialog.classList.contains("hidden"), false);
});

test("draft overwrite and discard decisions use in-app dialogs instead of browser confirm", () => {
  const start = scriptSource.indexOf("// 11. DRAFTS & AUTO-SAVE");
  const end = scriptSource.indexOf("// 12. TAB 3", start);
  assert.notEqual(start, -1);
  assert.notEqual(end, -1);
  const draftUi = scriptSource.slice(start, end);
  assert.doesNotMatch(draftUi, /\bconfirm\s*\(/);
  assert.match(draftUi, /draftActionConfirmModal/);
});
