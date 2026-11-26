const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");

const projectRoot = path.resolve(__dirname, "../..");
const scriptSource = fs.readFileSync(path.join(projectRoot, "public/script.js"), "utf8");
const htmlSource = fs.readFileSync(path.join(projectRoot, "public/index.html"), "utf8");
const cssSource = fs.readFileSync(path.join(projectRoot, "public/style.css"), "utf8");

function extractTopLevelFunction(source, name) {
  const marker = new RegExp(`^function ${name}\\s*\\([^)]*\\)\\s*\\{`, "m");
  const match = marker.exec(source);
  assert.ok(match, `production function ${name} must exist`);
  const start = match.index;
  const nextFunction = source.indexOf("\nfunction ", match.index + match[0].length);
  const nextComment = source.indexOf("\n// ===", match.index + match[0].length);
  const candidates = [nextFunction, nextComment].filter(index => index >= 0);
  const end = candidates.length ? Math.min(...candidates) : source.length;
  const candidate = source.slice(start, end);
  const close = candidate.lastIndexOf("\n}");
  assert.notEqual(close, -1, `production function ${name} must have a top-level closing brace`);
  return candidate.slice(0, close + 2);
}

function makeClassList(initial = []) {
  const values = new Set(initial);
  return {
    add(name) { values.add(name); },
    remove(name) { values.delete(name); },
    toggle(name, force) {
      const shouldAdd = force === undefined ? !values.has(name) : Boolean(force);
      if (shouldAdd) values.add(name);
      else values.delete(name);
      return shouldAdd;
    },
    contains(name) { return values.has(name); },
  };
}

function createWorkspaceHarness({ width = 1440, tops = {}, reducedMotion = false } = {}) {
  const attributes = { "aria-controls": "documentPreviewPanel" };
  const workspace = { classList: makeClassList(["transaction-workspace"]) };
  const toggle = {
    textContent: "",
    attributes,
    setAttribute(name, value) { attributes[name] = String(value); },
    getAttribute(name) { return attributes[name] ?? null; },
  };
  const preview = { id: "documentPreviewPanel" };
  const sections = Object.fromEntries(
    ["sec1", "sec2", "sec3", "sec4", "sec5", "sec6", "sec7", "sec8"].map(id => [
      id,
      {
        id,
        getBoundingClientRect() {
          const top = tops[id] ?? 1000;
          return { top, bottom: top + 420 };
        },
        scrollIntoView(options) { this.lastScrollOptions = options; },
      },
    ])
  );
  const trackerButtons = Object.fromEntries(
    Object.keys(sections).map(id => [
      id,
      {
        attributes: {},
        setAttribute(name, value) { this.attributes[name] = String(value); },
        removeAttribute(name) { delete this.attributes[name]; },
        getAttribute(name) { return this.attributes[name] ?? null; },
      },
    ])
  );
  const trackerItems = Object.keys(sections).map(id => ({
    dataset: { sec: id },
    classList: makeClassList(),
    querySelector(selector) {
      return selector === "button" ? trackerButtons[id] : null;
    },
  }));
  const listeners = [];
  const document = {
    documentElement: { scrollHeight: 2600 },
    getElementById(id) {
      if (id === "transactionWorkspace") return workspace;
      if (id === "transactionPreviewToggle") return toggle;
      if (id === "documentPreviewPanel") return preview;
      return sections[id] || null;
    },
    querySelectorAll(selector) {
      return selector === ".section-tracker-item" ? trackerItems : [];
    },
  };
  const window = {
    innerWidth: width,
    innerHeight: 900,
    scrollY: 0,
    matchMedia() { return { matches: reducedMotion }; },
    addEventListener(type, callback, options) {
      listeners.push({ type, callback, options });
    },
  };
  const appState = { activePreviewDoc: "coe" };
  const functionNames = [
    "setTransactionPreviewVisible",
    "toggleTransactionPreview",
    "handleTransactionWorkspaceResize",
    "updateActiveFormSection",
    "setActiveFormSection",
    "initTransactionWorkspace",
    "scrollToSection",
  ];
  const source = functionNames.map(name => extractTopLevelFunction(scriptSource, name)).join("\n");
  const context = { window, document, appState };
  vm.runInNewContext(source, context, { filename: "public/script.js#transaction-workspace" });

  return { context, window, document, appState, workspace, toggle, preview, sections, trackerItems, trackerButtons, listeners };
}

test("desktop workspace starts with the preview visible and tracks document scrolling", () => {
  const harness = createWorkspaceHarness({ width: 1440 });

  harness.context.initTransactionWorkspace();

  assert.equal(harness.workspace.classList.contains("preview-collapsed"), false);
  assert.equal(harness.toggle.textContent, "Hide preview");
  assert.equal(harness.toggle.getAttribute("aria-expanded"), "true");
  assert.deepEqual(
    harness.listeners.map(listener => [listener.type, listener.options?.passive]),
    [["resize", true], ["scroll", true]]
  );
  const resizeListener = harness.listeners.find(listener => listener.type === "resize");
  harness.window.innerWidth = 1024;
  resizeListener.callback();
  assert.equal(harness.workspace.classList.contains("preview-collapsed"), true);
  harness.window.innerWidth = 1366;
  resizeListener.callback();
  assert.equal(harness.workspace.classList.contains("preview-collapsed"), false);
  assert.equal(harness.appState.activePreviewDoc, "coe");
});

test("narrow workspace starts collapsed and reopening preserves the selected document tab", () => {
  const harness = createWorkspaceHarness({ width: 768 });

  harness.context.initTransactionWorkspace();

  assert.equal(harness.workspace.classList.contains("preview-collapsed"), true);
  assert.equal(harness.toggle.textContent, "Show preview");
  assert.equal(harness.toggle.getAttribute("aria-expanded"), "false");

  harness.context.toggleTransactionPreview();

  assert.equal(harness.workspace.classList.contains("preview-collapsed"), false);
  assert.equal(harness.toggle.textContent, "Hide preview");
  assert.equal(harness.toggle.getAttribute("aria-expanded"), "true");
  assert.equal(harness.appState.activePreviewDoc, "coe");
});

test("1024px workspace starts with the preview collapsed to protect form width", () => {
  const harness = createWorkspaceHarness({ width: 1024 });

  harness.context.initTransactionWorkspace();

  assert.equal(harness.workspace.classList.contains("preview-collapsed"), true);
  assert.equal(harness.toggle.textContent, "Show preview");
  assert.equal(harness.toggle.getAttribute("aria-expanded"), "false");

  harness.context.toggleTransactionPreview();
  assert.equal(harness.workspace.classList.contains("preview-collapsed"), false);
  assert.equal(harness.appState.activePreviewDoc, "coe");
});

test("manual preview choice is preserved when the viewport crosses the default breakpoint", () => {
  const harness = createWorkspaceHarness({ width: 1440 });

  harness.context.initTransactionWorkspace();
  harness.context.toggleTransactionPreview();
  const resizeListener = harness.listeners.find(listener => listener.type === "resize");

  harness.window.innerWidth = 390;
  resizeListener.callback();
  assert.equal(harness.workspace.classList.contains("preview-collapsed"), true);

  harness.context.toggleTransactionPreview();
  harness.window.innerWidth = 1366;
  resizeListener.callback();
  assert.equal(harness.workspace.classList.contains("preview-collapsed"), false);
  harness.window.innerWidth = 1024;
  resizeListener.callback();
  assert.equal(harness.workspace.classList.contains("preview-collapsed"), false);
  assert.equal(harness.appState.activePreviewDoc, "coe");
});

test("preview can be hidden and reopened without changing transaction form state", () => {
  const harness = createWorkspaceHarness({ width: 1366 });

  harness.context.initTransactionWorkspace();
  harness.context.toggleTransactionPreview();

  assert.equal(harness.workspace.classList.contains("preview-collapsed"), true);
  assert.equal(harness.toggle.textContent, "Show preview");
  assert.equal(harness.toggle.getAttribute("aria-controls"), "documentPreviewPanel");

  harness.context.toggleTransactionPreview();

  assert.equal(harness.workspace.classList.contains("preview-collapsed"), false);
  assert.equal(harness.toggle.getAttribute("aria-expanded"), "true");
  assert.equal(harness.appState.activePreviewDoc, "coe");
});

test("page scrolling activates the section nearest the workspace reading line", () => {
  const harness = createWorkspaceHarness({
    width: 1440,
    tops: {
      sec1: -720, sec2: -180, sec3: 72, sec4: 520,
      sec5: 980, sec6: 1400, sec7: 1840, sec8: 2280,
    },
  });

  harness.context.updateActiveFormSection();

  const active = harness.trackerItems.filter(item => item.classList.contains("active"));
  assert.equal(active.length, 1);
  assert.equal(active[0].dataset.sec, "sec3");
  assert.equal(harness.trackerButtons.sec3.getAttribute("aria-current"), "step");
  assert.equal(harness.trackerButtons.sec2.getAttribute("aria-current"), null);
});

test("section jump scrolls the selected section into view and marks it active", () => {
  const harness = createWorkspaceHarness({ width: 1440, reducedMotion: true });

  harness.context.scrollToSection("sec4");

  assert.equal(harness.sections.sec4.lastScrollOptions.behavior, "auto");
  assert.equal(harness.sections.sec4.lastScrollOptions.block, "start");
  assert.equal(harness.trackerButtons.sec4.getAttribute("aria-current"), "step");
  assert.equal(harness.trackerItems.find(item => item.dataset.sec === "sec4").classList.contains("active"), true);
});

test("the final section becomes active when the user reaches the end of the form", () => {
  const harness = createWorkspaceHarness({ width: 1440 });
  harness.window.scrollY = 1700;

  harness.context.updateActiveFormSection();

  assert.equal(harness.trackerButtons.sec8.getAttribute("aria-current"), "step");
});

test("section navigation uses a real button for every section", () => {
  const sectionEntries = htmlSource.match(/<li class="section-tracker-item[^"]*" data-sec="sec[1-8]">[\s\S]*?<button[\s\S]*?<\/button>[\s\S]*?<\/li>/g) || [];
  assert.equal(sectionEntries.length, 8);
  assert.doesNotMatch(
    htmlSource.match(/<ul class="sections-list" id="sectionsTrackerList">[\s\S]*?<\/ul>/)?.[0] || "",
    /<li[^>]*onclick=/
  );
});

test("workspace markup exposes a persistent preview toggle connected to the preview panel", () => {
  const step2 = htmlSource.match(/<div id="txnStep2"[\s\S]*?<!-- STEP 3:/)?.[0] || "";
  assert.match(step2, /id="transactionPreviewToggle"[^>]*aria-controls="documentPreviewPanel"/);
  assert.match(step2, /id="documentPreviewPanel"/);
  assert.match(step2, /aria-expanded=/);
});

test("form inputs use natural page flow while preview paper keeps its own document viewport", () => {
  const formRule = cssSource.match(/\.form-inputs-col\s*\{([^}]*)\}/)?.[1] || "";
  const previewRule = cssSource.match(/\.preview-sheet-frame\s*\{([^}]*)\}/)?.[1] || "";
  assert.doesNotMatch(formRule, /max-height|overflow-y\s*:\s*(?:auto|scroll)/);
  assert.match(previewRule, /overflow-y\s*:\s*auto/);
  assert.match(cssSource, /\.form-sections-nav\s*\{[^}]*position\s*:\s*sticky/s);
  assert.match(cssSource, /\.document-preview-col\s*\{[^}]*position\s*:\s*sticky/s);
});

test("desktop form actions remain in normal document flow and do not cover fields", () => {
  const marker = ".form-bottom-bar {";
  const ruleStart = cssSource.indexOf(marker);
  const ruleEnd = cssSource.indexOf("}", ruleStart);
  const actionBar = ruleStart >= 0 ? cssSource.slice(ruleStart, ruleEnd) : "";
  assert.ok(actionBar.includes("position: static"));
  assert.equal(actionBar.includes("position: fixed"), false);
});
test("narrow layout removes sticky side panels and returns the action bar to normal flow", () => {
  const narrowRules = cssSource.slice(cssSource.lastIndexOf("@media (max-width: 820px)"));
  assert.match(narrowRules, /\.form-sections-nav\s*\{[^}]*position\s*:\s*static/s);
  assert.match(narrowRules, /\.document-preview-col\s*\{[^}]*position\s*:\s*static/s);
  assert.match(narrowRules, /\.form-bottom-bar\s*\{[^}]*position\s*:\s*static/s);
});
