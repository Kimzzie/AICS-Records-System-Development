const { spawnSync } = require("node:child_process");
const { test } = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");

test("the public AICS API bridge has valid JavaScript syntax", () => {
  const bridgePath = path.resolve(__dirname, "../../public/aics-api.js");
  const result = spawnSync(process.execPath, ["--check", bridgePath], {
    encoding: "utf8",
  });

  assert.equal(
    result.status,
    0,
    [result.stdout, result.stderr].filter(Boolean).join("\n") ||
      "Node failed to parse public/aics-api.js."
  );
});
