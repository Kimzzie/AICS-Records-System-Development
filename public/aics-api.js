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

  function token() { return sessionStorage.getItem(TOKEN_KEY) || ""; }
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
      const error = new Error(validation || body.message || ("Request failed (" + response.status + ")"));
      error.status = response.status;
      throw error;
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
      subCategory: row.sub_category || "",
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
  window.verifyViewerAssistanceHistory = async function (name, birthdate) {
    return await api("/viewer/assistance-verification", {
      method: "POST",
      body: JSON.stringify({ name: name, birthdate: birthdate })
    });
  };

  function viewerAssistanceResultArea() {
    return document.getElementById("viewerAssistanceResultArea");
  }

  function showViewerAssistanceMessage(message) {
    const area = viewerAssistanceResultArea();
    if (!area) return;
    area.replaceChildren();
    const paragraph = document.createElement("p");
    paragraph.className = "mb-0";
    paragraph.textContent = message;
    area.appendChild(paragraph);
    area.classList.remove("hidden");
  }

  window.renderViewerAssistanceResult = function (payload) {
    const area = viewerAssistanceResultArea();
    if (!area) return;

    area.replaceChildren();
    const data = payload && payload.data && typeof payload.data === "object" ? payload.data : {};

    if (data.match_status === "confirmed_match") {
      const records = Array.isArray(data.records) ? data.records : [];
      const waitingMonths = data.waiting_period_months ?? 3;
      const nextEligible = data.next_eligible_date || null;
      const isEligibleNow = data.is_eligible_now ?? true;
      const daysLeft = data.days_until_eligible ?? 0;

      let eligibilityBadge = "";
      if (waitingMonths === 0) {
        eligibilityBadge = `<div class="viewer-eligibility-row viewer-elig-ok">
          <span class="viewer-elig-icon">✓</span>
          <div>
            <strong>No waiting period — client may apply again</strong>
            <span class="viewer-elig-sub">The MSWDO has no waiting period restriction set.</span>
          </div>
        </div>`;
      } else if (isEligibleNow) {
        eligibilityBadge = `<div class="viewer-eligibility-row viewer-elig-ok">
          <span class="viewer-elig-icon">✓</span>
          <div>
            <strong>Waiting period has passed — client may apply again</strong>
            <span class="viewer-elig-sub">The ${waitingMonths}-month MSWDO waiting period since the last assistance has already elapsed.</span>
          </div>
        </div>`;
      } else {
        eligibilityBadge = `<div class="viewer-eligibility-row viewer-elig-wait">
          <span class="viewer-elig-icon">✗</span>
          <div>
            <strong>Not yet eligible — waiting period in effect</strong>
            <span class="viewer-elig-sub">The ${waitingMonths}-month MSWDO waiting period applies. Earliest eligible date: <strong>${nextEligible}</strong> (${daysLeft} day${daysLeft !== 1 ? "s" : ""} from today).</span>
          </div>
        </div>`;
      }

      area.innerHTML = `
        <div class="viewer-result-card viewer-result-found">
          <div class="viewer-result-icon">⚠</div>
          <div class="viewer-result-body">
            <h3 class="viewer-result-title">MSWDO assistance record found</h3>
            <p class="viewer-result-desc">This client has existing MSWDO AICS assistance on record. Review the history and eligibility status below before providing additional assistance from your office.</p>
            <div class="viewer-result-records">
              ${records.map(r => `
                <div class="viewer-record-entry">
                  <span class="viewer-record-date">${r.transaction_date || "Date not available"}</span>
                  <span class="viewer-record-type">${r.assistance_type || "Assistance type not specified"}</span>
                </div>
              `).join("")}
            </div>
            ${eligibilityBadge}
            <p class="viewer-result-note">Eligibility is based on the MSWDO waiting period rule. Refer to authorized MSWDO staff if further verification is needed.</p>
          </div>
        </div>`;
    } else if (data.match_status === "possible_match") {
      area.innerHTML = `
        <div class="viewer-result-card viewer-result-possible">
          <div class="viewer-result-icon">ℹ</div>
          <div class="viewer-result-body">
            <h3 class="viewer-result-title">Possible name match — identity unconfirmed</h3>
            <p class="viewer-result-desc">A record with a similar name was found, but the date of birth provided does not confirm identity. Do not use this result to approve or deny assistance.</p>
            <p class="viewer-result-note">Refer this client to authorized MSWDO staff for manual identity verification before proceeding.</p>
          </div>
        </div>`;
    } else if (data.match_status === "no_match") {
      area.innerHTML = `
        <div class="viewer-result-card viewer-result-none">
          <div class="viewer-result-icon">✓</div>
          <div class="viewer-result-body">
            <h3 class="viewer-result-title">No MSWDO assistance record found</h3>
            <p class="viewer-result-desc">No matching record was found in the MSWDO AICS system for this name and date of birth. The client does not appear to have prior MSWDO assistance on record.</p>
            <p class="viewer-result-note">This result does not guarantee eligibility. Confirm further with MSWDO staff if needed.</p>
          </div>
        </div>`;
    } else {
      showViewerAssistanceMessage("Unable to complete assistance verification. Please try again later.");
      return;
    }

    area.classList.remove("hidden");
  };

  window.clearViewerAssistanceVerificationUI = function () {
    const nameInput = document.getElementById("viewerAssistanceName");
    const birthdateInput = document.getElementById("viewerAssistanceBirthdate");
    if (nameInput) nameInput.value = "";
    if (birthdateInput) birthdateInput.value = "";

    const area = viewerAssistanceResultArea();
    if (area) {
      if (typeof area.replaceChildren === "function") area.replaceChildren();
      else area.textContent = "";
      area.classList.add("hidden");
    }
  };

  window.handleViewerAssistanceSubmit = async function (event) {
    if (event && typeof event.preventDefault === "function") event.preventDefault();

    const nameInput = document.getElementById("viewerAssistanceName");
    const birthdateInput = document.getElementById("viewerAssistanceBirthdate");
    const name = nameInput ? String(nameInput.value || "").trim() : "";
    const birthdate = birthdateInput ? String(birthdateInput.value || "") : "";

    const area = viewerAssistanceResultArea();
    if (area) {
      area.replaceChildren();
      area.classList.remove("hidden");
    }

    if (!name || !birthdate) {
      showViewerAssistanceMessage("Enter the person's full name and date of birth.");
      return;
    }

    try {
      const result = await window.verifyViewerAssistanceHistory(name, birthdate);
      window.renderViewerAssistanceResult(result);
    } catch (error) {
      if (error && error.status === 503) {
        showViewerAssistanceMessage("Assistance verification is temporarily unavailable. Please try again later.");
      } else if (error && error.status === 422) {
        showViewerAssistanceMessage("Enter a valid full name and date of birth.");
      } else {
        showViewerAssistanceMessage("Unable to complete assistance verification. Please try again later.");
      }
    }
  };

  window.checkBeneficiaryEligibility = async function (name, birthdate) {
    const query = new URLSearchParams({ name: String(name || "") });
    if (birthdate) query.set("birthdate", birthdate);
    return await api("/beneficiaries/eligibility?" + query.toString());
  };
  window.getBeneficiaryHistory = async function (name, page = 1, perPage = 10) {
    const query = new URLSearchParams({
      name: String(name || ""),
      page: String(page),
      per_page: String(perPage)
    });
    return await api("/beneficiaries/history?" + query.toString());
  };
  function renderIdentityWarnings(warnings, targetId) {
    const container = document.getElementById(targetId);
    if (!container) return;
    container.replaceChildren();
    if (!Array.isArray(warnings) || warnings.length === 0) {
      container.classList.add("hidden");
      return;
    }

    const alertBox = document.createElement("div");
    alertBox.className = "alert alert-warning";
    alertBox.style.borderRadius = "8px";
    const heading = document.createElement("strong");
    heading.textContent = "Identity verification recommended";
    const description = document.createElement("p");
    description.className = "mb-2 text-xs";
    description.textContent = "A name-only historical match was found for one or more people. The transaction was saved because the date of birth did not confirm the same person. Review the history before finalizing the documents.";
    const list = document.createElement("ul");
    list.className = "text-xs mb-0";
    warnings.forEach(warning => {
      const item = document.createElement("li");
      item.textContent = (warning.role === "client" ? "Requester: " : "Beneficiary: ")
        + (warning.name || "Person") + " — " + (warning.message || "Possible name match requires staff verification.");
      list.appendChild(item);
    });
    alertBox.append(heading, description, list);
    container.appendChild(alertBox);
    container.classList.remove("hidden");
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
  window.adminCreateUser = async function (payload) {
    const result = await api('/admin/users', { method: 'POST', body: JSON.stringify(payload) });
    await loadAdminUsers();
    return result;
  };
  window.adminUpdateUser = async function (userId, payload) {
    const isSelfPasswordReset = !!(
      payload
      && Object.prototype.hasOwnProperty.call(payload, 'password')
      && appState.currentUser
      && String(appState.currentUser.id) === String(userId)
    );
    const result = await api('/admin/users/' + encodeURIComponent(userId), { method: 'PATCH', body: JSON.stringify(payload) });
    if (isSelfPasswordReset) {
      await window.handleLogout();
      return result;
    }
    await loadAdminUsers();
    return result;
  };
  window.adminDeleteUser = async function (userId) {
    const result = await api('/admin/users/' + encodeURIComponent(userId), { method: 'DELETE' });
    await loadAdminUsers();
    return result;
  };
  window.adminUpdateAssistanceType = async function (typeId, payload) {
    return await api("/admin/assistance-types/" + encodeURIComponent(typeId), {
      method: "PATCH",
      body: JSON.stringify(payload)
    });
  };
  window.adminUpdateSettings = async function (payload) {
    if (appState.currentUser?.role !== "Administrator") {
      throw new Error("Administrator access is required to change system settings.");
    }
    const result = await api("/admin/settings", {
      method: "PUT",
      body: JSON.stringify(payload)
    });
    appState.rules = Object.assign({}, appState.rules, result.data || payload);
    saveStorage(STORAGE_KEYS.RULES, appState.rules);
    return result;
  };
  async function loadAdminUsers() {
    if (!appState.currentUser || appState.currentUser.role !== "Administrator") return;
    const users = await api("/admin/users");
    appState.users = users.map(u => ({
      id: u.id, name: u.name, username: u.username, role: u.role,
      status: u.status, mustChangePass: !!u.must_change_password
    }));
    renderAdminUsers();
  }

  function clearViewerOperationalData() {
    appState.users = [];
    appState.records = [];
    appState.drafts = [];
    appState.currentDraftId = null;
    appState.agencies = [];
    appState.barangays = [];
    appState.assistanceTypes = [];
    appState.signatories = [];
    appState.rules = {};

    [
      "USERS",
      "RECORDS",
      "DRAFTS",
      "AGENCIES",
      "ASSISTANCE_TYPES",
      "BARANGAYS",
      "SIGNATORIES",
      "RULES"
    ].forEach(storageKey => {
      const key = STORAGE_KEYS[storageKey];
      if (key) localStorage.removeItem(key);
    });

    if (typeof window.clearViewerAssistanceVerificationUI === "function") {
      window.clearViewerAssistanceVerificationUI();
    }
  }

  async function initializeWorkspaceForUser(user) {
    appState.drafts = [];
    appState.currentDraftId = null;
    if (STORAGE_KEYS.DRAFTS) localStorage.removeItem(STORAGE_KEYS.DRAFTS);

    if (user && user.role === "Viewer") {
      clearViewerOperationalData();
    } else {
      await loadServerData();
      try {
        await window.loadTransactionDrafts();
      } catch (error) {
        // Drafts are ancillary to workspace startup. Leave the rest of the
        // authenticated workspace available; the Drafts modal can retry.
        appState.drafts = [];
        appState.currentDraftId = null;
        console.warn("Could not load drafts during workspace initialization:", error.message);
      }
      if (user && user.role === "Administrator") {
        await loadAdminUsers();
      }
    }

    setAuthenticatedUser(user);
  }

  window.initAuth = async function () {
    if (!token()) { appState.currentUser = null; showAuthView(); return; }
    try {
      const result = await api("/auth/me");
      appState.currentUser = mapUser(result.user);
      if (appState.currentUser.mustChangePass) {
        // The temporary password is memory-only. After a reload, require a fresh login.
        try { await api("/auth/logout", { method: "POST" }); } catch (_) {}
        sessionStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
        pendingTemporaryPassword = "";
        appState.currentUser = null;
        showAuthView();
        showLoginError("Your first-login session ended. Please sign in again to continue.");
        return;
      }
      await initializeWorkspaceForUser(appState.currentUser);
    } catch (error) {
      // error.status is set for HTTP errors; absence means a network/fetch failure.
      const isAuthError = error.status === 401 || error.status === 403;
      if (isAuthError) {
        // Token is invalid or expired — require a fresh login.
        sessionStorage.removeItem(TOKEN_KEY);
        pendingTemporaryPassword = "";
        appState.currentUser = null;
        showAuthView();
      } else {
        // Network or server error — restore from cached user so a slow server
        // or brief connection drop does not force the user to log in again.
        const raw = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
        const cachedUser = raw ? (() => { try { return JSON.parse(raw); } catch (_) { return null; } })() : null;
        if (cachedUser) {
          appState.currentUser = cachedUser;
          appState.isOnline = false;
          setAuthenticatedUser(cachedUser);
        } else {
          sessionStorage.removeItem(TOKEN_KEY);
          appState.currentUser = null;
          showAuthView();
        }
      }
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
      sessionStorage.setItem(TOKEN_KEY, result.token);
      appState.currentUser = mapUser(result.user);
      if (appState.currentUser.mustChangePass) {
        // Keep the temporary password in memory only for the required change request.
        pendingTemporaryPassword = password;
        document.getElementById("loginPassword").value = "";
        document.getElementById("loginCard").classList.add("hidden");
        document.getElementById("firstLoginCard").classList.remove("hidden");
        document.getElementById("newPasswordInput").focus();
        return;
      }
      pendingTemporaryPassword = "";
      await initializeWorkspaceForUser(appState.currentUser);
    } catch (error) {
      sessionStorage.removeItem(TOKEN_KEY);
      pendingTemporaryPassword = "";
      showLoginError(error.message);
    } finally {
      if (button) { button.disabled = false; button.textContent = "Log in"; }
    }
  };
  window.handleFirstLoginSubmit = async function (event) {
    event.preventDefault();
    if (!token() || !pendingTemporaryPassword) {
      await window.handleLogout();
      showLoginError("Your first-login session expired. Please sign in again to continue.");
      return;
    }

    const password = document.getElementById("newPasswordInput").value;
    const confirmation = document.getElementById("confirmNewPasswordInput").value;
    if (password.length < 10) { alert("Password must be at least 10 characters long."); return; }
    if (password !== confirmation) { alert("Passwords do not match."); return; }
    try {
      await api("/auth/password", { method: "PUT", body: JSON.stringify({
        current_password: pendingTemporaryPassword, password: password, password_confirmation: confirmation
      }) });
      sessionStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      pendingTemporaryPassword = "";
      appState.currentUser = null;
      alert("Password updated. Please log in using your new password.");
      document.getElementById("firstLoginCard").classList.add("hidden");
      document.getElementById("loginCard").classList.remove("hidden");
      document.getElementById("loginPassword").value = "";
      document.getElementById("newPasswordInput").value = "";
      document.getElementById("confirmNewPasswordInput").value = "";
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
    sessionStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    if (STORAGE_KEYS.DRAFTS) localStorage.removeItem(STORAGE_KEYS.DRAFTS);
    pendingTemporaryPassword = "";
    appState.drafts = [];
    appState.currentDraftId = null;
    if (typeof window.updateDraftsCountBadge === "function") window.updateDraftsCountBadge();
    if (typeof window.clearViewerAssistanceVerificationUI === "function") {
      window.clearViewerAssistanceVerificationUI();
    }
    appState.currentUser = null;
    document.getElementById("userDropdown")?.classList.add("hidden");
    showAuthView();
    clearLoginForm();
  };
  window.cancelFirstLogin = async function () { await window.handleLogout(); };
  window.executeHomeSearch = async function () {
    const query = document.getElementById("homeSearchInput").value.trim();
    if (query.length < 3) return originalExecuteHomeSearch();
    try {
      const result = await api("/transactions/search?q=" + encodeURIComponent(query));
      // Temporarily swap records so originalExecuteHomeSearch renders search results,
      // then immediately restore so the Records tab is never affected.
      const fullRecords = appState.records;
      appState.records = (result.data || []).map(mapRecord);
      originalExecuteHomeSearch();
      appState.records = fullRecords;
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
    const subCategories = Array.from(document.querySelectorAll("input[name='subCategory']:checked"))
      .map(x => String(x.value || "").trim())
      .filter(Boolean);
    const otherCategory = document.getElementById("otherCategoryInput")?.value.trim() || "";
    const normalizedSubCategories = subCategories.map(value =>
      value === "Others" && otherCategory ? "Others: " + otherCategory : value
    );
    const subCategory = normalizedSubCategories.join(", ");
    const familyRows = Array.from(document.getElementById("familyTableBody")?.children || []);
    const familyMembers = familyRows.map(row => {
      const inputs = row.querySelectorAll("input");
      const fullName = inputs[0]?.value.trim() || "";
      const ageValue = inputs[2]?.value.trim() || "";
      const salaryValue = inputs[5]?.value || "0";
      const salary = Number(String(salaryValue).replace(/[^0-9.-]/g, "")) || 0;
      return {
        full_name: fullName,
        relationship: inputs[1]?.value.trim() || null,
        age: ageValue === "" ? null : Number.parseInt(ageValue, 10),
        civil_status: inputs[3]?.value.trim() || null,
        occupation: inputs[4]?.value.trim() || null,
        monthly_salary: salary
      };
    }).filter(member => member.full_name);
    const dateValue = document.getElementById("formTxnDate").value;
    const parsedDate = dateValue && !Number.isNaN(Date.parse(dateValue)) ? new Date(dateValue) : new Date();
    const cStreet = document.getElementById("cStreet").value;
    const cBarangay = document.getElementById("cBarangay").value;
    return {
      transaction_date: parsedDate.toISOString().slice(0, 10),
      client_type: document.querySelector("input[name='clientType']:checked")?.value || "New",
      source: document.querySelector("input[name='sourceType']:checked")?.value || "Walk-in",
      target_sector: sector || "FHONA",
      sub_category: subCategory || null,
      family_members: familyMembers,
      assistance_type_id: assistance ? assistance.id : null,
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
        birthdate: document.getElementById("bBirthdate").value || null,
        gender: document.getElementById("bGender").value || document.getElementById("cGender").value,
        civil_status: document.getElementById("bCivilStatus").value || document.getElementById("cCivilStatus").value,
        occupation: document.getElementById("bOccupation").value || "None",
        monthly_salary: Number(document.getElementById("bSalary").value || 0),
        relationship_to_client: document.getElementById("bRelationship").value || "Self"
      }
    };
  }
  function mapDraft(row) {
    const lastSavedAt = row.last_saved_at || row.updated_at || null;
    const date = lastSavedAt ? new Date(lastSavedAt) : null;
    return {
      id: Number(row.id),
      clientName: row.client_name || "Untitled client",
      beneficiaryName: row.beneficiary_name || "Not specified",
      assistance: row.assistance || "Unspecified",
      lastSavedAt: lastSavedAt,
      lastSaved: date && !Number.isNaN(date.getTime())
        ? date.toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short" })
        : "Time unavailable"
    };
  }

  window.loadTransactionDrafts = async function () {
    const response = await api("/drafts");
    appState.drafts = (response.data || []).map(mapDraft);
    if (typeof window.updateDraftsCountBadge === "function") window.updateDraftsCountBadge();
    return appState.drafts;
  };

  window.getTransactionDraft = async function (draftId) {
    return await api("/drafts/" + encodeURIComponent(draftId));
  };

  window.saveTransactionDraft = async function () {
    if (typeof window.captureTransactionDraftForm !== "function") {
      throw new Error("The transaction form could not be captured.");
    }

    const formData = window.captureTransactionDraftForm();
    const transaction = formData.transaction || {};
    const clientName = transaction.client?.full_name || appState.step1ClientName || "Untitled client";
    const beneficiaryName = transaction.beneficiary?.full_name || appState.step1BeneficiaryName || clientName;
    const assistance = document.querySelector("input[name='finAssistance']:checked")?.value
      || document.getElementById("astProvided")?.value
      || "Unspecified";
    const payload = {
      client_name: clientName,
      beneficiary_name: beneficiaryName,
      assistance: assistance,
      form_data: formData
    };
    const currentId = appState.currentDraftId;
    const path = currentId ? "/drafts/" + encodeURIComponent(currentId) : "/drafts";
    const result = await api(path, {
      method: currentId ? "PUT" : "POST",
      body: JSON.stringify(payload)
    });

    const saved = result.data;
    appState.currentDraftId = Number(saved.id);
    const mapped = mapDraft(saved);
    const existingIndex = appState.drafts.findIndex(draft => String(draft.id) === String(mapped.id));
    if (existingIndex >= 0) appState.drafts.splice(existingIndex, 1);
    appState.drafts.unshift(mapped);
    if (typeof window.updateDraftsCountBadge === "function") window.updateDraftsCountBadge();
    return saved;
  };

  window.deleteTransactionDraft = async function (draftId) {
    const result = await api("/drafts/" + encodeURIComponent(draftId), { method: "DELETE" });
    appState.drafts = appState.drafts.filter(draft => String(draft.id) !== String(draftId));
    if (String(appState.currentDraftId || "") === String(draftId)) appState.currentDraftId = null;
    if (typeof window.updateDraftsCountBadge === "function") window.updateDraftsCountBadge();
    return result;
  };

  window.captureTransactionDraftForm = function () {
    const step2 = document.getElementById("txnStep2");
    if (!step2) throw new Error("The transaction form is unavailable.");

    const fields = {};
    Array.from(step2.querySelectorAll("input[id], select[id], textarea[id]")).forEach(field => {
      if (field.type === "password" || field.id === "formGlNo") return;
      const stored = { value: field.value ?? "" };
      if (field.type === "checkbox" || field.type === "radio") stored.checked = !!field.checked;
      fields[field.id] = stored;
    });

    const namedControls = Array.from(step2.querySelectorAll("input[name]"));
    const groupNames = Array.from(new Set(namedControls.map(field => field.name)));
    const groups = {};
    groupNames.forEach(name => {
      const controls = namedControls.filter(field => field.name === name);
      if (controls.some(field => field.type === "radio")) {
        groups[name] = controls.find(field => field.checked)?.value || null;
      } else if (controls.every(field => field.type === "checkbox")) {
        groups[name] = controls.filter(field => field.checked).map(field => field.value);
      }
    });

    return {
      schema_version: 1,
      transaction: transactionPayload(),
      fields: fields,
      groups: groups,
      step1: {
        client_name: appState.step1ClientName || "",
        beneficiary_name: appState.step1BeneficiaryName || "",
        assistance_type: appState.step1AssistanceType || "Medical"
      }
    };
  };

  window.executeSaveRecord = async function () {
    if (!appState.isOnline) { alert("You are offline. Saving the transaction requires a live connection to the server."); return; }
    if (savingTransaction) return;
    savingTransaction = true;
    try {
      const payload = transactionPayload();
      if (appState.currentDraftId !== null && appState.currentDraftId !== undefined) {
        payload.draft_id = Number(appState.currentDraftId);
      }
      const response = await api("/transactions", { method: "POST", body: JSON.stringify(payload) });
      const saved = mapRecord(response.data);
      document.getElementById("formGlNo").value = saved.glNo;

      // The server has atomically saved the official record and consumed this
      // exact draft. Clear the local ID before follow-up refreshes can fail.
      const consumedDraftId = appState.currentDraftId;
      appState.currentDraftId = null;
      if (consumedDraftId !== null && consumedDraftId !== undefined) {
        appState.drafts = appState.drafts.filter(draft => String(draft.id) !== String(consumedDraftId));
        if (typeof window.updateDraftsCountBadge === "function") window.updateDraftsCountBadge();
      }

      await loadServerData();
      originalExecuteSaveRecord();
      appState.records = [saved].concat(appState.records.filter(r => r.id !== saved.id && r.glNo !== saved.glNo));
      appState.lastSavedRecord = saved;
      renderRecentTransactions();
      renderIdentityWarnings(response.identity_warnings || [], "savedIdentityWarnings");
    } catch (error) {
      alert("Transaction was not saved to the database: " + error.message);
    } finally { savingTransaction = false; }
  };
  window.saveRecordCorrection = async function () {
    if (!appState.isOnline) { alert("You are offline. Saving corrections requires a live connection."); return; }
    const glNo = appState.currentEditingRecordGl;
    const record = appState.records.find(r => r.glNo === glNo);
    if (!record || !record.id) { alert("This record is not linked to a database record."); return; }
    const last = document.getElementById("editClientLast").value.trim();
    const first = document.getElementById("editClientFirst").value.trim();
    const barangay = document.getElementById("editBarangay").value.trim();
    const fullName = [first, record.client.middleName, last, record.client.ext].filter(Boolean).join(" ");
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
      sessionStorage.removeItem(TOKEN_KEY);
      closeChangePasswordModal();
      alert("Password changed. Please log in again.");
      showAuthView();
    } catch (error) { alert(error.message); }
  };


  let activeBudgetSummary = null;
  const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  function peso(value) {
    return "₱" + Number(value || 0).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  function selectedBudgetMonth() {
    const input = document.getElementById("budgetMonth");
    if (!input.value) input.value = new Date().toISOString().slice(0, 7);
    return input.value;
  }
  function getQuarterInfo(month) {
    const [year, m] = month.split("-").map(Number);
    const q = Math.ceil(m / 3);
    const starts = q * 3 - 2;
    const quarterMonths = [starts, starts + 1, starts + 2].map(mn => ({
      value: year + "-" + String(mn).padStart(2, "0"),
      name: MONTH_NAMES[mn - 1]
    }));
    return { label: "Q" + q + " " + year + ": " + quarterMonths[0].name + " – " + quarterMonths[2].name, months: quarterMonths };
  }
  async function loadQuarterlyBudget(selectedMonth) {
    const qInfo = getQuarterInfo(selectedMonth);
    const titleEl = document.getElementById("quarterlyBudgetTitle");
    const cardsEl = document.getElementById("quarterlyMonthCards");
    if (!titleEl || !cardsEl) return;
    titleEl.textContent = qInfo.label;
    const results = await Promise.all(qInfo.months.map(async m => {
      try { return Object.assign({ _month: m.value }, await api("/budget/monthly?month=" + encodeURIComponent(m.value))); }
      catch (_) { return { _month: m.value, total_budget: 0, used: 0, remaining: 0, issued_count: 0 }; }
    }));
    let totalAllocated = 0, totalIssued = 0, totalRemaining = 0;
    cardsEl.innerHTML = results.map((r, i) => {
      const monthInfo = qInfo.months[i];
      const isCurrent = monthInfo.value === selectedMonth;
      const pct = r.total_budget > 0 ? Math.min(100, (r.used / r.total_budget) * 100) : 0;
      const isExhausted = r.total_budget > 0 && r.remaining <= 0;
      const isLow = r.total_budget > 0 && !isExhausted && (r.remaining / r.total_budget) <= 0.2;
      const barColor = isExhausted ? "#dc3545" : isLow ? "#fd7e14" : "#198754";
      totalAllocated += Number(r.total_budget || 0);
      totalIssued += Number(r.used || 0);
      totalRemaining += Number(r.remaining || 0);
      const badges = [
        isCurrent ? '<span class="badge badge-primary" style="font-size:0.65rem;padding:2px 6px;">Current</span>' : "",
        isExhausted ? '<span class="badge badge-danger" style="font-size:0.65rem;padding:2px 6px;">Exhausted</span>' : "",
        isLow ? '<span class="badge badge-warning" style="font-size:0.65rem;padding:2px 6px;">Low</span>' : ""
      ].filter(Boolean).join(" ");
      return '<div class="col-md-4 mb-3">' +
        '<div class="card p-3 h-100' + (isCurrent ? " border-primary" : "") + '" style="cursor:pointer;" onclick="selectBudgetMonth(\'' + monthInfo.value + '\')">' +
        '<div class="d-flex justify-content-between align-items-center mb-2"><span class="font-weight-bold text-sm">' + escapeBudgetText(monthInfo.name) + '</span><span>' + badges + '</span></div>' +
        '<div class="text-sm text-muted mb-0">Allocated: <strong>' + peso(r.total_budget) + '</strong></div>' +
        '<div class="text-sm text-muted mb-2">Issued: <strong' + (r.used > 0 ? ' class="text-danger"' : "") + '>' + peso(r.used) + '</strong></div>' +
        '<div style="height:6px;background:#e9ecef;border-radius:3px;margin-bottom:4px;">' +
        '<div style="width:' + pct + '%;height:100%;background:' + barColor + ';border-radius:3px;transition:width 0.3s;"></div></div>' +
        '<div class="d-flex justify-content-between"><span class="text-xs text-muted">' + Math.round(pct) + '% used</span>' +
        '<span class="text-xs' + (isExhausted ? ' text-danger' : "") + '">' + peso(r.remaining) + ' left</span></div>' +
        '</div></div>';
    }).join("");
    document.getElementById("quarterlyTotalAllocated").textContent = peso(totalAllocated);
    document.getElementById("quarterlyTotalIssued").textContent = peso(totalIssued);
    document.getElementById("quarterlyTotalRemaining").textContent = peso(totalRemaining);
    const badge = document.getElementById("quarterlyHealthBadge");
    if (badge) {
      const pctUsed = totalAllocated > 0 ? (totalIssued / totalAllocated) * 100 : 0;
      if (totalAllocated === 0) { badge.textContent = "No budget set"; badge.className = "badge badge-secondary"; }
      else if (totalRemaining <= 0) { badge.textContent = "Quarter exhausted"; badge.className = "badge badge-danger"; }
      else if (pctUsed > 80) { badge.textContent = "Low funds"; badge.className = "badge badge-warning"; }
      else { badge.textContent = "On track"; badge.className = "badge badge-success"; }
    }
    const currentData = results.find(r => r._month === selectedMonth);
    const exhaustedAlert = document.getElementById("budgetExhaustedAlert");
    if (exhaustedAlert && currentData) {
      exhaustedAlert.classList.toggle("hidden", !(currentData.total_budget > 0 && currentData.remaining <= 0));
    }
  }
  window.selectBudgetMonth = function(month) {
    const input = document.getElementById("budgetMonth");
    if (input) { input.value = month; loadMonthlyBudget(); }
  };
  window.loadMonthlyBudget = async function () {
    const role = appState.currentUser?.role;
    const setup = document.getElementById("budgetSetupCard");
    if (setup) setup.classList.toggle("hidden", role !== "Administrator");
    const month = selectedBudgetMonth();
    const monthLabel = document.getElementById("budgetMonthLabel");
    if (monthLabel) {
      const [y, m] = month.split("-").map(Number);
      monthLabel.textContent = MONTH_NAMES[m - 1] + " " + y;
    }
    try {
      const summary = await api("/budget/monthly?month=" + encodeURIComponent(month));
      activeBudgetSummary = summary;
      const totalInput = document.getElementById("budgetTotalInput");
      if (totalInput) totalInput.value = summary.total_budget || "";
      document.getElementById("budgetTotalDisplay").textContent = peso(summary.total_budget);
      document.getElementById("budgetUsedDisplay").textContent = peso(summary.used);
      document.getElementById("budgetRemainingDisplay").textContent = peso(summary.remaining);
      document.getElementById("budgetIssuedCount").textContent = (summary.issued_count || 0) + " issued";
      const body = document.getElementById("budgetTransactionsBody");
      body.innerHTML = (summary.transactions || []).length ? summary.transactions.map(t =>
        "<tr><td>" + escapeBudgetText(t.gl_number) + "</td><td>" + escapeBudgetText(t.client || "") + "</td><td>" + escapeBudgetText(t.date || "") + "</td><td class='text-right'>" + peso(t.amount) + "</td></tr>"
      ).join("") : "<tr><td colspan='4' class='text-center text-muted p-4'>No issued Guarantee Letters for this month.</td></tr>";
      await loadQuarterlyBudget(month);
    } catch (error) {
      if (!appState.isOnline) {
        alert("You are offline. Budget data cannot be loaded. Connect to the internet and try again.");
      } else {
        alert("Could not load monthly budget: " + error.message);
      }
    }
  };
  function escapeBudgetText(value) {
    return String(value).replace(/[&<>"']/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c]));
  }
  window.saveMonthlyBudget = async function () {
    if (!appState.isOnline) { alert("You are offline. Setting the budget requires a live connection."); return; }
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
    if (!appState.isOnline) { alert("You are offline. Issuing a Guarantee Letter requires a live connection."); return; }
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

  window.addEventListener("online", function () {
    appState.isOnline = true;
    updateOnlineStatusUI();
    if (typeof filterRecordsList === "function") filterRecordsList();

    // Remind user if there's an unsaved emergency draft from going offline mid-transaction
    const pending = localStorage.getItem("aics_emergency_draft");
    if (pending) {
      try {
        const draft = JSON.parse(pending);
        const when = draft.savedAt ? new Date(draft.savedAt).toLocaleTimeString() : "earlier";
        setTimeout(() => {
          if (confirm(`You're back online.\n\nA transaction form for "${draft.clientName}" was auto-saved locally at ${when} when your connection dropped.\n\nWould you like to restore it and continue the transaction?`)) {
            if (typeof navigateToTab === "function") navigateToTab("new-transaction");
            if (typeof window.restoreEmergencyDraft === "function") window.restoreEmergencyDraft(draft.formData);
          }
          localStorage.removeItem("aics_emergency_draft");
        }, 500);
      } catch (_) {
        localStorage.removeItem("aics_emergency_draft");
      }
    }
  });
  window.addEventListener("offline", function () {
    appState.isOnline = false;
    updateOnlineStatusUI();
    if (typeof filterRecordsList === "function") filterRecordsList();

    // Auto-save form as local draft if the user is mid-transaction (steps 2–4).
    // The form fields in txnStep2 retain their values even when hidden at steps 3/4.
    if (appState.currentTxnStep >= 2 && typeof window.captureTransactionDraftForm === "function") {
      try {
        const formData = window.captureTransactionDraftForm();
        const emergency = {
          savedAt: new Date().toISOString(),
          clientName: appState.step1ClientName || "Unknown client",
          formData: formData
        };
        localStorage.setItem("aics_emergency_draft", JSON.stringify(emergency));
        const banner = document.getElementById("offlineBanner");
        if (banner) {
          const msg = banner.querySelector(".offline-message, span, p") || banner;
          const prev = msg.dataset.originalText || msg.textContent;
          msg.dataset.originalText = prev;
          msg.textContent = "Connection lost — your form progress was saved as a local draft. Reconnect to upload it.";
        }
        // Navigate away from the form so the user doesn't accidentally submit offline
        if (typeof navigateToTab === "function") navigateToTab("home");
      } catch (_) { /* form capture failed — nothing to auto-save */ }
    }
  });
  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll(".demo-accounts-box").forEach(el => el.classList.add("hidden"));
  });
})();
