/**
 * AICS Laravel API bridge. Existing UI/document previews are retained.
 */
(() => {
  "use strict";
  const API_BASE = "/api/v1";
  const TOKEN_KEY = "aics_api_token";
  let pendingTemporaryPassword = "";
  let savingTransaction = false;
  const originalExecuteHomeSearch = window.executeHomeSearch;
  const originalExecuteSaveRecord = window.executeSaveRecord;
  const originalSaveRecordCorrection = window.saveRecordCorrection;

  function token() { return localStorage.getItem(TOKEN_KEY) || ""; }
  async function api(path, options) {
    options = options || {};
    const headers = Object.assign({ Accept: "application/json" }, options.headers || {});
    if (options.body) headers["Content-Type"] = "application/json";
    if (token()) headers.Authorization = "Bearer " + token();
    const response = await fetch(API_BASE + path, Object.assign({}, options, { headers }));
    const raw = await response.text();
    let body = {};
    try { body = raw ? JSON.parse(raw) : {}; } catch (_) { body = { message: raw }; }
    if (!response.ok) {
      const validation = body.errors ? Object.values(body.errors).flat().join(" ") : "";
      throw new Error(validation || body.message || ("Request failed (" + response.status + ")"));
    }
    return body;
  }
  function showLoginError(message) {
    const box = document.getElementById("loginErrorAlert");
    if (!box) { alert(message); return; }

    const usernameInput = document.getElementById("loginUsername");
    const passwordInput = document.getElementById("loginPassword");
    const title = box.querySelector(".auth-error-title");
    const desc = box.querySelector(".auth-error-desc");
    const invalidCredentials = /invalid credentials|disabled account|username|password/i.test(String(message));

    box.classList.remove("hidden");
    if (invalidCredentials) {
      if (title) title.textContent = "Wrong username or password";
      if (desc) desc.textContent = "The username or password you entered is incorrect. Please check your details and try again.";
      if (usernameInput) usernameInput.classList.add("input-error");
      if (passwordInput) passwordInput.classList.add("input-error");
    } else {
      if (title) title.textContent = "Unable to log in";
      if (desc) desc.textContent = message || "Please try again.";
    }
  }
  function mapUser(user) {
    return { id: user.id, name: user.name, username: user.username, role: user.role,
      status: user.status, mustChangePass: !!user.must_change_password };
  }
  function mapPerson(person) {
    person = person || {};
    return {
      id: person.id, lastName: person.last_name || "", firstName: person.first_name || "",
      middleName: person.middle_name || "", ext: person.extension || "",
      fullName: person.full_name || "", street: person.street || "", barangay: person.barangay || "",
      city: person.city || "Maramag", province: person.province || "Bukidnon", region: person.region || "10",
      mobile: person.mobile || "", birthdate: person.birthdate || "", age: person.age || "",
      gender: person.gender || "", civilStatus: person.civil_status || "",
      occupation: person.occupation || "", salary: Number(person.monthly_salary || 0),
      relationship: person.relationship_to_client || ""
    };
  }
  function mapRecord(row) {
    const dateIso = row.transaction_date || "";
    return {
      id: row.id, glNo: row.gl_number, dateIso: dateIso,
      date: dateIso ? formatDateDisplay(dateIso) : "",
      year: dateIso ? String(dateIso).slice(0, 4) : "",
      client: mapPerson(row.client), beneficiary: mapPerson(row.beneficiary),
      targetSector: row.target_sector || "",
      service: row.assistance_type ? row.assistance_type.name : (row.assistance_provided || "Assistance"),
      assistanceTypeId: row.assistance_type_id, assistanceProvided: row.assistance_provided || "",
      amount: Number(row.amount || 0), amountWords: row.amount_words || "",
      guaranteeLetterIssuedAt: row.guarantee_letter_issued_at || null, guaranteedAmount: Number(row.guaranteed_amount || 0),
      fundSource: row.fund_source || "", purpose: row.purpose || "",
      partnerAgency: row.partner_agency ? row.partner_agency.name : "",
      partnerAgencyId: row.partner_agency_id, contactPerson: row.contact_person || "",
      contactNumber: row.contact_number || "", validUntil: row.valid_until || "",
      caseSummary: row.case_summary || "", worker: row.worker_name || "",
      familyMembers: row.family_members || [], raw: row
    };
  }
  async function loadServerData() {
    const results = await Promise.all([api("/lookups"), api("/transactions?per_page=100")]);
    const lookups = results[0], page = results[1];
    appState.agencies = (lookups.agencies || []).map(a => ({
      id: a.id, name: a.name, address: a.address || "", contact: a.contact || "",
      status: a.status || "Active", recordsCount: a.transactions_count || 0
    }));
    appState.barangays = lookups.barangays || [];
    appState.assistanceTypes = (lookups.assistanceTypes || []).map(a => ({
      id: a.id, type: a.name, copies: a.copies || "", status: a.status || "Active",
      requirements: (a.requirements || []).map(r => r.requirement)
    }));
    appState.signatories = (lookups.signatories || []).map(s => ({
      id: s.id, key: s.key, roleLabel: s.role_label, name: s.name, title: s.title || ""
    }));
    appState.rules = Object.assign({}, appState.rules, lookups.rules || {});
    appState.records = (page.data || []).map(mapRecord);
    saveStorage(STORAGE_KEYS.AGENCIES, appState.agencies);
    saveStorage(STORAGE_KEYS.BARANGAYS, appState.barangays);
    saveStorage(STORAGE_KEYS.ASSISTANCE_TYPES, appState.assistanceTypes);
    saveStorage(STORAGE_KEYS.SIGNATORIES, appState.signatories);
    saveStorage(STORAGE_KEYS.RULES, appState.rules);
    saveStorage(STORAGE_KEYS.RECORDS, appState.records);
    populateBarangayOptions();
    populateAgencyDropdowns();
    renderRecentTransactions();
  }
  async function loadAdminUsers() {
    if (!appState.currentUser || appState.currentUser.role !== "Administrator") return;
    const users = await api("/admin/users");
    appState.users = users.map(u => ({
      id: u.id, name: u.name, username: u.username, role: u.role,
      status: u.status, mustChangePass: !!u.must_change_password
    }));
    renderAdminUsers();
  }

  window.initAuth = async function () {
    if (!token()) { appState.currentUser = null; showAuthView(); return; }
    try {
      const result = await api("/auth/me");
      appState.currentUser = mapUser(result.user);
      await loadServerData();
      setAuthenticatedUser(appState.currentUser);
      await loadAdminUsers();
    } catch (error) {
      localStorage.removeItem(TOKEN_KEY);
      appState.currentUser = null;
      showAuthView();
      console.warn("AICS session restore failed:", error.message);
    }
  };
  window.handleLogin = async function (event) {
    event.preventDefault();
    clearLoginErrors();
    const username = document.getElementById("loginUsername").value.trim();
    const password = document.getElementById("loginPassword").value;
    const button = document.querySelector("#loginForm button[type='submit']");
    if (button) { button.disabled = true; button.textContent = "Signing in..."; }
    try {
      const result = await api("/auth/login", {
        method: "POST",
        body: JSON.stringify({ username: username, password: password, device_name: "AICS Web" })
      });
      localStorage.setItem(TOKEN_KEY, result.token);
      pendingTemporaryPassword = "";
      appState.currentUser = mapUser(result.user);
      // Skip the first-login password screen; open the regular AICS workspace.
      await loadServerData();
      setAuthenticatedUser(appState.currentUser);
      await loadAdminUsers();
    } catch (error) {
      localStorage.removeItem(TOKEN_KEY);
      showLoginError(error.message);
    } finally {
      if (button) { button.disabled = false; button.textContent = "Log in"; }
    }
  };
  window.handleFirstLoginSubmit = async function (event) {
    event.preventDefault();
    const password = document.getElementById("newPasswordInput").value;
    const confirmation = document.getElementById("confirmNewPasswordInput").value;
    if (password.length < 10) { alert("Password must be at least 10 characters long."); return; }
    if (password !== confirmation) { alert("Passwords do not match."); return; }
    try {
      await api("/auth/password", { method: "PUT", body: JSON.stringify({
        current_password: pendingTemporaryPassword, password: password, password_confirmation: confirmation
      }) });
      localStorage.removeItem(TOKEN_KEY);
      pendingTemporaryPassword = "";
      alert("Password updated. Please log in using your new password.");
      document.getElementById("firstLoginCard").classList.add("hidden");
      document.getElementById("loginCard").classList.remove("hidden");
      document.getElementById("loginPassword").value = "";
      document.getElementById("loginUsername").focus();
    } catch (error) { alert(error.message); }
  };
  function clearLoginForm() {
    const form = document.getElementById("loginForm");
    const username = document.getElementById("loginUsername");
    const password = document.getElementById("loginPassword");

    if (form) form.reset();
    if (username) username.value = "";
    if (password) {
      password.value = "";
      password.type = "password";
    }

    const toggle = document.getElementById("btnToggleLoginPass");
    if (toggle) {
      toggle.querySelector(".eye-strike")?.classList.add("hidden");
      toggle.setAttribute("aria-pressed", "false");
      toggle.setAttribute("aria-label", "Show password");
      toggle.setAttribute("title", "Show password");
    }

    // Clear any values/errors left by the previous session.
    ["newPasswordInput", "confirmNewPasswordInput", "chgOldPass", "chgNewPass", "chgConfirmPass"].forEach(id => {
      const input = document.getElementById(id);
      if (input) input.value = "";
    });
    if (typeof clearLoginErrors === "function") clearLoginErrors();
  }

  window.handleLogout = async function () {
    // Revoke the server token when possible, then always clear local credentials.
    try { if (token()) await api("/auth/logout", { method: "POST" }); } catch (_) {}
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    pendingTemporaryPassword = "";
    appState.currentUser = null;
    document.getElementById("userDropdown")?.classList.add("hidden");
    showAuthView();
    clearLoginForm();
  };
  window.executeHomeSearch = async function () {
    const query = document.getElementById("homeSearchInput").value.trim();
    if (query.length < 3) return originalExecuteHomeSearch();
    try {
      const result = await api("/transactions/search?q=" + encodeURIComponent(query));
      appState.records = (result.data || []).map(mapRecord);
      originalExecuteHomeSearch();
    } catch (error) { alert("Could not search the AICS database: " + error.message); }
  };

  function transactionPayload() {
    const cLast = document.getElementById("cLastName").value.trim();
    const cFirst = document.getElementById("cFirstName").value.trim();
    const cMiddle = document.getElementById("cMiddleName").value.trim();
    const cExt = document.getElementById("cExt").value.trim();
    const bLast = document.getElementById("bLastName").value.trim() || cLast;
    const bFirst = document.getElementById("bFirstName").value.trim() || cFirst;
    const bMiddle = document.getElementById("bMiddleName").value.trim() || cMiddle;
    const bExt = document.getElementById("bExt").value.trim() || cExt;
    const full = function (first, middle, last, ext) { return [first, middle, last, ext].filter(Boolean).join(" "); };
    const typeName = document.querySelector("input[name='finAssistance']:checked")?.value || "Medical";
    const assistance = appState.assistanceTypes.find(a => a.type === typeName);
    const sector = Array.from(document.querySelectorAll("input[name='targetSector']:checked")).map(x => x.value).join(", ");
    const dateValue = document.getElementById("formTxnDate").value;
    const parsedDate = dateValue && !Number.isNaN(Date.parse(dateValue)) ? new Date(dateValue) : new Date();
    const cStreet = document.getElementById("cStreet").value;
    const cBarangay = document.getElementById("cBarangay").value;
    return {
      transaction_date: parsedDate.toISOString().slice(0, 10),
      client_type: document.querySelector("input[name='clientType']:checked")?.value || "New",
      source: document.querySelector("input[name='sourceType']:checked")?.value || "Walk-in",
      target_sector: sector || "FHONA", assistance_type_id: assistance ? assistance.id : null,
      assistance_provided: document.getElementById("astProvided").value,
      amount: Number(document.getElementById("astAmount").value || 0),
      amount_words: document.getElementById("astAmountWords").value,
      fund_source: document.getElementById("astFundSource").value,
      purpose: document.getElementById("astPurpose").value,
      partner_agency_name: document.getElementById("astPartnerAgency").value || null,
      contact_person: document.getElementById("astContactPerson").value,
      contact_number: document.getElementById("astContactNumber").value,
      valid_until: document.getElementById("astValidUntil").value || null,
      case_summary: document.getElementById("caseSummaryText").value,
      client: {
        last_name: cLast, first_name: cFirst, middle_name: cMiddle || null, extension: cExt || null,
        full_name: full(cFirst, cMiddle, cLast, cExt), street: cStreet, barangay: cBarangay,
        city: "Maramag", province: "Bukidnon", region: "10",
        mobile: document.getElementById("cMobile").value,
        birthdate: document.getElementById("cBirthdate").value || null,
        gender: document.getElementById("cGender").value,
        civil_status: document.getElementById("cCivilStatus").value,
        occupation: document.getElementById("cOccupation").value,
        monthly_salary: Number(document.getElementById("cSalary").value || 0)
      },
      beneficiary: {
        last_name: bLast, first_name: bFirst, middle_name: bMiddle || null, extension: bExt || null,
        full_name: full(bFirst, bMiddle, bLast, bExt),
        street: document.getElementById("bStreet").value || cStreet,
        barangay: document.getElementById("bBarangay").value || cBarangay,
        city: "Maramag", province: "Bukidnon", region: "10",
        mobile: document.getElementById("cMobile").value,
        birthdate: document.getElementById("bBirthdate").value || document.getElementById("cBirthdate").value || null,
        gender: document.getElementById("bGender").value || document.getElementById("cGender").value,
        civil_status: document.getElementById("bCivilStatus").value || document.getElementById("cCivilStatus").value,
        occupation: document.getElementById("bOccupation").value || "None",
        monthly_salary: Number(document.getElementById("bSalary").value || 0),
        relationship_to_client: document.getElementById("bRelationship").value || "Self"
      }
    };
  }
  window.executeSaveRecord = async function () {
    if (savingTransaction) return;
    savingTransaction = true;
    try {
      const response = await api("/transactions", { method: "POST", body: JSON.stringify(transactionPayload()) });
      const saved = mapRecord(response.data);
      document.getElementById("formGlNo").value = saved.glNo;
      await loadServerData();
      originalExecuteSaveRecord();
      appState.records = [saved].concat(appState.records.filter(r => r.id !== saved.id));
      appState.lastSavedRecord = saved;
      renderRecentTransactions();
    } catch (error) {
      alert("Transaction was not saved to the database: " + error.message);
    } finally { savingTransaction = false; }
  };
  window.saveRecordCorrection = async function () {
    const glNo = appState.currentEditingRecordGl;
    const record = appState.records.find(r => r.glNo === glNo);
    if (!record || !record.id) { alert("This record is not linked to a database record."); return; }
    const last = document.getElementById("editClientLast").value.trim();
    const first = document.getElementById("editClientFirst").value.trim();
    const barangay = document.getElementById("editBarangay").value.trim();
    const fullName = [first, record.client.middleName, last].filter(Boolean).join(" ");
    try {
      const response = await api("/transactions/" + record.id, {
        method: "PUT",
        body: JSON.stringify({
          client: { last_name: last, first_name: first, middle_name: record.client.middleName || null,
            extension: record.client.ext || null, full_name: fullName, barangay: barangay },
          amount: Number(document.getElementById("editAmount").value || 0),
          amount_words: document.getElementById("editAmountWords").value,
          partner_agency_name: document.getElementById("editPartnerAgency").value || null
        })
      });
      originalSaveRecordCorrection();
      const updated = mapRecord(response.data);
      appState.records = appState.records.map(r => r.id === updated.id ? updated : r);
      filterRecordsList();
    } catch (error) { alert("Record correction was not saved: " + error.message); }
  };
  window.handleChangePasswordSubmit = async function (event) {
    event.preventDefault();
    const oldPassword = document.getElementById("chgOldPass").value;
    const password = document.getElementById("chgNewPass").value;
    const confirmation = document.getElementById("chgConfirmPass").value;
    if (password.length < 10) { alert("New password must be at least 10 characters."); return; }
    if (password !== confirmation) { alert("New passwords do not match."); return; }
    try {
      await api("/auth/password", { method: "PUT", body: JSON.stringify({
        current_password: oldPassword, password: password, password_confirmation: confirmation
      }) });
      localStorage.removeItem(TOKEN_KEY);
      closeChangePasswordModal();
      alert("Password changed. Please log in again.");
      showAuthView();
    } catch (error) { alert(error.message); }
  };


  let activeBudgetSummary = null;
  function peso(value) {
    return "₱" + Number(value || 0).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  function selectedBudgetMonth() {
    const input = document.getElementById("budgetMonth");
    if (!input.value) input.value = new Date().toISOString().slice(0, 7);
    return input.value;
  }
  window.loadMonthlyBudget = async function () {
    const role = appState.currentUser?.role;
    const setup = document.getElementById("budgetSetupCard");
    if (setup) setup.classList.toggle("hidden", role !== "Administrator");
    const month = selectedBudgetMonth();
    try {
      const summary = await api("/budget/monthly?month=" + encodeURIComponent(month));
      activeBudgetSummary = summary;
      document.getElementById("budgetTotalInput").value = summary.total_budget || "";
      document.getElementById("budgetTotalDisplay").textContent = peso(summary.total_budget);
      document.getElementById("budgetUsedDisplay").textContent = peso(summary.used);
      document.getElementById("budgetRemainingDisplay").textContent = peso(summary.remaining);
      document.getElementById("budgetIssuedCount").textContent = (summary.issued_count || 0) + " issued";
      const body = document.getElementById("budgetTransactionsBody");
      body.innerHTML = (summary.transactions || []).length ? summary.transactions.map(t =>
        "<tr><td>" + escapeBudgetText(t.gl_number) + "</td><td>" + escapeBudgetText(t.client || "") + "</td><td>" + escapeBudgetText(t.date || "") + "</td><td class='text-right'>" + peso(t.amount) + "</td></tr>"
      ).join("") : "<tr><td colspan='4' class='text-center text-muted p-4'>No issued Guarantee Letters for this month.</td></tr>";
    } catch (error) { alert("Could not load monthly budget: " + error.message); }
  };
  function escapeBudgetText(value) {
    return String(value).replace(/[&<>"']/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c]));
  }
  window.saveMonthlyBudget = async function () {
    if (appState.currentUser?.role !== "Administrator") { alert("Only Administrators can set the monthly budget."); return; }
    const month = selectedBudgetMonth();
    const total = Number(document.getElementById("budgetTotalInput").value);
    if (!Number.isFinite(total) || total < 0) { alert("Enter a valid monthly budget."); return; }
    try {
      await api("/budget/monthly", { method: "PUT", body: JSON.stringify({ month: month, total_budget: total }) });
      await loadMonthlyBudget();
      alert("Monthly budget saved.");
    } catch (error) { alert(error.message); }
  };
  window.issueCurrentGuaranteeLetter = async function () {
    const record = appState.lastSavedRecord;
    if (!record || !record.id) { alert("Save the transaction first, then issue its Guarantee Letter."); return; }
    if (!["Administrator", "Senior staff"].includes(appState.currentUser?.role)) {
      alert("Only Senior Staff or Administrators can approve and issue a Guarantee Letter.");
      return;
    }
    if (!confirm("Approve and issue Guarantee Letter " + record.glNo + "? The assistance amount will be deducted from this month's budget.")) return;
    const button = document.getElementById("btnIssueGuaranteeLetter");
    if (button) { button.disabled = true; button.textContent = "Processing..."; }
    try {
      const result = await api("/transactions/" + record.id + "/issue-guarantee-letter", { method: "POST" });
      const budgetMonth = document.getElementById("budgetMonth");
      if (budgetMonth && record.dateIso) budgetMonth.value = record.dateIso.slice(0, 7);
      const status = document.getElementById("glIssueStatus");
      status.className = "alert alert-success mb-2";
      status.textContent = result.message + " The budget has been updated.";
      if (button) button.classList.add("hidden");
      await loadMonthlyBudget();
    } catch (error) {
      alert(error.message);
    } finally {
      if (button) { button.disabled = false; button.textContent = "Approve and issue Guarantee Letter"; }
    }
  };
  document.addEventListener("DOMContentLoaded", function () {
    const month = document.getElementById("budgetMonth");
    if (month) month.value = new Date().toISOString().slice(0, 7);
    if (month) month.addEventListener("change", function () { loadMonthlyBudget(); });
  });

  window.addEventListener("online", function () { appState.isOnline = true; updateOnlineStatusUI(); });
  window.addEventListener("offline", function () { appState.isOnline = false; updateOnlineStatusUI(); });
  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll(".demo-accounts-box").forEach(el => el.classList.add("hidden"));
  });
})();
