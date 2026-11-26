const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const path = require("node:path");
const { test } = require("node:test");

const source = fs.readFileSync(path.resolve(__dirname, "../../public/script.js"), "utf8");
const match = source.match(/function isFormFieldRequired\([\s\S]*?\n\}/);
if (!match) throw new Error("isFormFieldRequired helper is missing from public/script.js");

const context = {};
vm.runInNewContext(match[0] + "\nthis.isFormFieldRequired = isFormFieldRequired;", context);
const isRequired = context.isFormFieldRequired;

test("HTML required attribute marks a field as required", () => {
  assert.equal(isRequired({ id: "cLastName", required: true }, "Last name"), true);
});

test("asterisk in an associated label marks a field as required", () => {
  assert.equal(isRequired({ id: "bRelationship", required: false }, "Relationship of client to beneficiary *"), true);
});

test("optional mobile, salary, occupation, and contact fields remain optional", () => {
  for (const field of [
    { id: "cMobile", required: false },
    { id: "cSalary", required: false },
    { id: "bOccupation", required: false },
    { id: "astContactNumber", required: false }
  ]) {
    assert.equal(isRequired(field, "Optional field"), false, field.id);
  }
});

test("middle name and extension remain optional even if metadata is accidentally marked required", () => {
  const optionalIds = new Set(["cMiddleName", "cExt", "bMiddleName", "bExt"]);
  for (const id of optionalIds) {
    assert.equal(isRequired({ id, required: true }, "Name *", optionalIds), false, id);
  }
});

test("family composition inputs without required metadata are not implicitly mandatory", () => {
  const familyCell = { id: "", required: false };
  assert.equal(isRequired(familyCell, "Complete name"), false);
});
