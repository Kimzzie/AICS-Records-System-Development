const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");

const bridgeSource = fs.readFileSync(
  path.resolve(__dirname, "../../public/aics-api.js"),
  "utf8"
);

function makeHarness() {
  const requests = [];
  const values = {
    editClientLast: "Santos",
    editClientFirst: "Ana",
    editBarangay: "North Poblacion",
    editAmount: "1200",
    editAmountWords: "ONE THOUSAND TWO HUNDRED PESOS ONLY",
    editPartnerAgency: "",
  };
  const client = {
    id: 11,
    lastName: "Santos",
    firstName: "Ana",
    middleName: "M.",
    ext: "Jr.",
    fullName: "Ana M. Santos Jr.",
    barangay: "North Poblacion",
  };
  const record = {
    id: 9,
    glNo: "GL-2026-0009",
    client,
    beneficiary: { id: 12, lastName: "Santos", firstName: "Ana", fullName: "Ana Santos" },
    amount: 1200,
  };
  const appState = {
    currentEditingRecordGl: record.glNo,
    records: [record],
    assistanceTypes: [],
  };
  const window = { saveRecordCorrection() {}, addEventListener() {} };
  const document = {
    getElementById(id) {
      return { value: values[id] ?? "" };
    },
    addEventListener() {},
    querySelectorAll() { return []; },
  };
  const fetch = async (url, options) => {
    requests.push({ url, options });
    const body = {
      data: {
        id: 9,
        gl_number: "GL-2026-0009",
        transaction_date: "2026-11-25",
        client: {
          id: 11,
          last_name: "Santos",
          first_name: "Ana",
          middle_name: "M.",
          extension: "Jr.",
          full_name: "Ana M. Santos Jr.",
          barangay: "North Poblacion",
        },
        beneficiary: {
          id: 12,
          last_name: "Santos",
          first_name: "Ana",
          full_name: "Ana Santos",
        },
        amount: 1200,
        family_members: [],
      },
    };
    return {
      ok: true,
      status: 200,
      async text() { return JSON.stringify(body); },
    };
  };
  const context = {
    window,
    document,
    appState,
    fetch,
    sessionStorage: {
      getItem() { return "synthetic-bearer-token"; },
      setItem() {},
      removeItem() {},
    },
    localStorage: {
      getItem() { return null; },
      setItem() {},
      removeItem() {},
    },
    STORAGE_KEYS: {},
    formatDateDisplay(value) { return value; },
    filterRecordsList() {},
    saveStorage() {},
    alert() {},
    console,
  };

  vm.runInNewContext(bridgeSource, context, { filename: "public/aics-api.js" });
  return { window, requests };
}

test("record correction keeps the unchanged extension in the rebuilt client full name", async () => {
  const harness = makeHarness();

  await harness.window.saveRecordCorrection();

  assert.equal(harness.requests.length, 1);
  assert.equal(harness.requests[0].options.method, "PUT");
  const payload = JSON.parse(harness.requests[0].options.body);

  assert.equal(payload.client.extension, "Jr.");
  assert.equal(payload.client.full_name, "Ana M. Santos Jr.");
});
