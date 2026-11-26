/**
 * AICS RECORDS MANAGEMENT SYSTEM - MSWDO LGU MARAMAG, BUKIDNON
 * Core Application Engine & Data Layer
 * Fully supports all wireframe user flows: Login, Eligibility Check, Stepper Form,
 * Live Synchronous Document Preview (GIS, COE, GL), Records, Monthly Reports,
 * Administration, Local Storage persistence, and Print Generation.
 */

// ==========================================================================
// 1. DATA MODELS & LOCAL STORAGE STATE
// ==========================================================================

const STORAGE_KEYS = {
  CURRENT_USER: "aics_current_user",
  USERS: "aics_users_db",
  RECORDS: "aics_records_db",
  DRAFTS: "aics_drafts_db",
  AGENCIES: "aics_agencies_db",
  ASSISTANCE_TYPES: "aics_assistance_types_db",
  BARANGAYS: "aics_barangays_db",
  SIGNATORIES: "aics_signatories_db",
  RULES: "aics_rules_db",
  IS_ONLINE: "aics_is_online",
  LAST_TAB: "aics_last_tab"
};

// Initial Seed Data matching prototype screenshots
const SEED_DATA = {
  users: [
    { id: "usr-1", name: "Ana Dela Cruz", username: "staff", role: "Staff", status: "Active", password: "password123", mustChangePass: false },
    { id: "usr-2", name: "Liza Ramos", username: "sstaff", role: "Senior staff", status: "Active", password: "password123", mustChangePass: false },
    { id: "usr-3", name: "Maria Theresa S. Aleria", username: "admin", role: "Administrator", status: "Active", password: "admin123", mustChangePass: false },
    { id: "usr-4", name: "Auditor Personnel", username: "viewer", role: "Viewer", status: "Active", password: "password123", mustChangePass: false },
    { id: "usr-5", name: "Former Staff", username: "disabled_user", role: "Staff", status: "Disabled", password: "password123", mustChangePass: false }
  ],
  agencies: [
    { id: "ag-1", name: "Bupharco Pharmacy", address: "North Poblacion, Maramag, Bukidnon", contact: "0917-123-4567", status: "Active", recordsCount: 96 },
    { id: "ag-2", name: "King David Pharmacy", address: "Maramag, Bukidnon", contact: "0928-234-5678", status: "Active", recordsCount: 128 },
    { id: "ag-3", name: "Bongcas Holy Child Hospital", address: "Maramag, Bukidnon", contact: "0939-345-6789", status: "Active", recordsCount: 41 },
    { id: "ag-4", name: "St. Joseph Hospital", address: "Maramag, Bukidnon", contact: "0945-456-7890", status: "Active", recordsCount: 37 }
  ],
  barangays: [
    "Anahawon", "Bagontaas", "Base Camp", "Bayabason", "Camp 1",
    "Colambugon", "Dagumba-an", "Danggawan", "Dibulawan", "Kisanday",
    "Kuya", "Laican", "North Poblacion", "South Poblacion", "Poblacion",
    "Panadtalan", "Panalsalan", "San Miguel", "Tubigon"
  ],
  signatories: [
    { key: "noted", roleLabel: "Noted by (all documents)", name: "Maria Theresa S. Aleria, RSW", title: "Municipal Social Welfare & Development Officer" },
    { key: "mayor", roleLabel: "Approved (Guarantee Letter)", name: "Atty. Jose Joel P. Maniquis", title: "Municipal Mayor" },
    { key: "aide", roleLabel: "Prepared by (Guarantee Letter)", name: "Ana Dela Cruz", title: "Admin Aide IV" },
    { key: "worker", roleLabel: "Interviewed by (GIS)", name: "Ana Dela Cruz", title: "SWAide / SW Assistant / SWO" }
  ],
  rules: {
    waitingPeriodMonths: 3,
    glValidityDays: 9,
    logoutTimeoutMinutes: 10,
    keepDraftsDays: 30
  },
  assistanceTypes: [
    {
      type: "Medical",
      copies: "4 sets (sample)",
      status: "Active",
      requirements: [
        "Barangay indigency certificate",
        "Valid ID of the client",
        "Medical certificate or prescription (dated)",
        "Bill or quotation from the pharmacy or hospital",
        "Photocopies of the documents above (4 sets)"
      ]
    },
    {
      type: "Burial",
      copies: "3 sets (sample)",
      status: "Active",
      requirements: [
        "Barangay certificate of indigency",
        "Valid ID of the claimant",
        "Death certificate (certified true copy)",
        "Funeral contract / statement of account"
      ]
    },
    {
      type: "Fire incident",
      copies: "3 sets (sample)",
      status: "Active",
      requirements: [
        "Barangay certificate of indigency",
        "Bureau of Fire Protection (BFP) certification",
        "Valid government ID of the affected household head"
      ]
    },
    {
      type: "Transportation",
      copies: "2 sets (sample)",
      status: "Active",
      requirements: [
        "Barangay indigency certificate",
        "Valid ID of the client",
        "Police blotter / Referral or ticket quotation"
      ]
    },
    {
      type: "Food",
      copies: "2 sets (sample)",
      status: "Active",
      requirements: [
        "Barangay indigency certificate",
        "Valid ID of the client"
      ]
    },
    {
      type: "Cash",
      copies: "3 sets (sample)",
      status: "Active",
      requirements: [
        "Barangay indigency certificate",
        "Valid ID of the client",
        "Social worker case assessment report"
      ]
    }
  ],
  records: [
    {
      glNo: "0993-2026",
      date: "Nov 17, 2026",
      dateIso: "2026-11-17",
      year: "2026",
      client: {
        lastName: "Santos",
        firstName: "Maria",
        middleName: "L.",
        ext: "",
        fullName: "Maria L. Santos",
        street: "Purok 3",
        barangay: "Poblacion",
        city: "Maramag",
        province: "Bukidnon",
        region: "10",
        mobile: "0912 345 6789",
        birthdate: "1980-05-16",
        age: 46,
        gender: "Female",
        civilStatus: "Married",
        occupation: "Vendor",
        salary: 8000
      },
      beneficiary: {
        lastName: "Santos",
        firstName: "Juan",
        middleName: "",
        ext: "",
        fullName: "Juan Santos",
        street: "Purok 3",
        barangay: "Poblacion",
        city: "Maramag",
        province: "Bukidnon",
        region: "10",
        birthdate: "2017-07-07",
        age: 9,
        gender: "Male",
        civilStatus: "Single",
        occupation: "None",
        salary: 0,
        relationship: "Mother"
      },
      targetSector: "FHONA",
      subCategory: "",
      familyMembers: [
        { name: "Maria L. Santos", rel: "Client", age: 46, civilStatus: "Married", occupation: "Vendor", salary: 8000 },
        { name: "Pedro Santos", rel: "Husband", age: 48, civilStatus: "Married", occupation: "Farmer", salary: 8000 },
        { name: "Ana Santos", rel: "Daughter", age: 17, civilStatus: "Single", occupation: "Student", salary: 0 },
        { name: "Juan Santos", rel: "Beneficiary", age: 9, civilStatus: "Single", occupation: "None", salary: 0 }
      ],
      service: "Medical",
      assistanceProvided: "Medical assistance",
      amount: 2000,
      amountWords: "TWO THOUSAND PESOS ONLY",
      fundSource: "MSWDO",
      purpose: "Medicine",
      partnerAgency: "Bupharco Pharmacy",
      contactPerson: "Branch Pharmacist",
      contactNumber: "0917-123-4567",
      validUntil: "Nov 26, 2026",
      caseSummary: "Beneficiary was advised by the attending physician to take prescribed medicine. Client has no money to buy it and came to seek assistance.",
      worker: "Ana Dela Cruz",
      savedAt: "Nov 17, 2026, 10:46 AM",
      clientType: "New",
      source: "Walk-in"
    },
    {
      glNo: "0992-2026",
      date: "Nov 10, 2026",
      dateIso: "2026-11-10",
      year: "2026",
      client: {
        lastName: "Reyes",
        firstName: "Pedro",
        middleName: "C.",
        ext: "",
        fullName: "Pedro Reyes",
        street: "Purok 1",
        barangay: "Poblacion",
        city: "Maramag",
        province: "Bukidnon",
        region: "10",
        mobile: "0921 987 6543",
        birthdate: "1978-03-12",
        age: 48,
        gender: "Male",
        civilStatus: "Married",
        occupation: "Carpenter",
        salary: 7000
      },
      beneficiary: {
        lastName: "Reyes",
        firstName: "Ana",
        middleName: "",
        ext: "",
        fullName: "Ana Reyes",
        street: "Purok 1",
        barangay: "Poblacion",
        city: "Maramag",
        province: "Bukidnon",
        region: "10",
        birthdate: "2015-09-01",
        age: 11,
        gender: "Female",
        civilStatus: "Single",
        occupation: "Student",
        salary: 0,
        relationship: "Father"
      },
      targetSector: "SC",
      subCategory: "",
      service: "Medical",
      assistanceProvided: "Medical assistance",
      amount: 2000,
      amountWords: "TWO THOUSAND PESOS ONLY",
      fundSource: "MSWDO",
      purpose: "Laboratory & Medicine",
      partnerAgency: "Bupharco Pharmacy",
      worker: "Liza Ramos",
      savedAt: "Nov 10, 2026, 09:30 AM",
      clientType: "Returning",
      source: "Walk-in"
    },
    {
      glNo: "0991-2026",
      date: "Nov 09, 2026",
      dateIso: "2026-11-09",
      year: "2026",
      client: {
        lastName: "Cabrera",
        firstName: "Lorna",
        middleName: "B.",
        ext: "",
        fullName: "Lorna Cabrera",
        street: "Purok 5",
        barangay: "North Poblacion",
        city: "Maramag",
        province: "Bukidnon",
        region: "10",
        mobile: "0935 444 1122",
        birthdate: "1985-08-14",
        age: 41,
        gender: "Female",
        civilStatus: "Widowed",
        occupation: "Housewife",
        salary: 3000
      },
      beneficiary: {
        lastName: "Cabrera",
        firstName: "Manuel",
        middleName: "",
        ext: "",
        fullName: "Manuel Cabrera (Deceased)",
        street: "Purok 5",
        barangay: "North Poblacion",
        city: "Maramag",
        province: "Bukidnon",
        region: "10",
        birthdate: "1983-02-10",
        age: 43,
        gender: "Male",
        civilStatus: "Married",
        occupation: "Deceased",
        salary: 0,
        relationship: "Spouse"
      },
      targetSector: "WEDC",
      subCategory: "Solo parents",
      service: "Burial",
      assistanceProvided: "Burial assistance",
      amount: 3000,
      amountWords: "THREE THOUSAND PESOS ONLY",
      fundSource: "MSWDO",
      purpose: "Funeral assistance",
      partnerAgency: "King David Pharmacy",
      worker: "Liza Ramos",
      savedAt: "Nov 09, 2026, 02:15 PM",
      clientType: "New",
      source: "Walk-in"
    },
    {
      glNo: "0990-2026",
      date: "Nov 02, 2026",
      dateIso: "2026-11-02",
      year: "2026",
      client: {
        lastName: "Santos",
        firstName: "Jose",
        middleName: "T.",
        ext: "",
        fullName: "Jose Santos",
        street: "Purok 2",
        barangay: "Panadtalan",
        city: "Maramag",
        province: "Bukidnon",
        region: "10",
        mobile: "0915 777 8899",
        birthdate: "1990-11-20",
        age: 36,
        gender: "Male",
        civilStatus: "Married",
        occupation: "Laborer",
        salary: 5000
      },
      beneficiary: {
        lastName: "Santos",
        firstName: "Ana",
        middleName: "",
        ext: "",
        fullName: "Ana Santos",
        street: "Purok 2",
        barangay: "Panadtalan",
        city: "Maramag",
        province: "Bukidnon",
        region: "10",
        birthdate: "1992-04-15",
        age: 34,
        gender: "Female",
        civilStatus: "Married",
        occupation: "None",
        salary: 0,
        relationship: "Spouse"
      },
      targetSector: "FHONA",
      subCategory: "",
      service: "Medical",
      assistanceProvided: "Medical assistance",
      amount: 1200,
      amountWords: "ONE THOUSAND TWO HUNDRED PESOS ONLY",
      fundSource: "MSWDO",
      purpose: "Prescription drugs",
      partnerAgency: "", // Missing partner agency to trigger wireframe 8b test!
      worker: "Ana Dela Cruz",
      savedAt: "Nov 02, 2026, 11:20 AM",
      clientType: "New",
      source: "Walk-in"
    },
    {
      // Record for Rosa Cruz: Oct 20, 2026 (Under 3-month waiting period from Nov 2026!) -> Test Wireframe 2c
      glNo: "0985-2026",
      date: "Oct 20, 2026",
      dateIso: "2026-10-20",
      year: "2026",
      client: {
        lastName: "Cruz",
        firstName: "Rosa",
        middleName: "M.",
        ext: "",
        fullName: "Rosa Cruz",
        street: "Purok 4",
        barangay: "Poblacion",
        city: "Maramag",
        province: "Bukidnon",
        region: "10",
        mobile: "0927 123 9988",
        birthdate: "1975-06-25",
        age: 51,
        gender: "Female",
        civilStatus: "Married",
        occupation: "Laundry worker",
        salary: 4000
      },
      beneficiary: {
        lastName: "Cruz",
        firstName: "Luis",
        middleName: "",
        ext: "",
        fullName: "Luis Cruz",
        street: "Purok 4",
        barangay: "Poblacion",
        city: "Maramag",
        province: "Bukidnon",
        region: "10",
        birthdate: "1972-01-10",
        age: 54,
        gender: "Male",
        civilStatus: "Married",
        occupation: "Farmer",
        salary: 4000,
        relationship: "Spouse"
      },
      targetSector: "SC",
      service: "Medical",
      assistanceProvided: "Medical assistance",
      amount: 1500,
      amountWords: "ONE THOUSAND FIVE HUNDRED PESOS ONLY",
      fundSource: "MSWDO",
      purpose: "Maintenance medicine",
      partnerAgency: "King David Pharmacy",
      worker: "Ana Dela Cruz",
      savedAt: "Oct 20, 2026, 10:15 AM",
      clientType: "Returning",
      source: "Walk-in"
    },
    {
      // Record for Elena Garcia: Nov 14, 2025 (>3 months elapsed, now ELIGIBLE!) -> Test Wireframe 2b
      glNo: "0452-2025",
      date: "Nov 14, 2025",
      dateIso: "2025-11-14",
      year: "2025",
      client: {
        lastName: "Garcia",
        firstName: "Elena",
        middleName: "S.",
        ext: "",
        fullName: "Elena Garcia",
        street: "Purok 2",
        barangay: "Poblacion",
        city: "Maramag",
        province: "Bukidnon",
        region: "10",
        mobile: "0919 555 3322",
        birthdate: "1982-09-10",
        age: 44,
        gender: "Female",
        civilStatus: "Married",
        occupation: "Sari-sari store owner",
        salary: 6000
      },
      beneficiary: {
        lastName: "Garcia",
        firstName: "Mario",
        middleName: "",
        ext: "",
        fullName: "Mario Garcia",
        street: "Purok 2",
        barangay: "Poblacion",
        city: "Maramag",
        province: "Bukidnon",
        region: "10",
        birthdate: "1980-04-12",
        age: 46,
        gender: "Male",
        civilStatus: "Married",
        occupation: "Driver",
        salary: 6000,
        relationship: "Spouse"
      },
      targetSector: "FHONA",
      service: "Medical",
      assistanceProvided: "Medical assistance",
      amount: 2500,
      amountWords: "TWO THOUSAND FIVE HUNDRED PESOS ONLY",
      fundSource: "MSWDO",
      purpose: "Hospital bill",
      partnerAgency: "St. Joseph Hospital",
      worker: "Liza Ramos",
      savedAt: "Nov 14, 2025, 03:00 PM",
      clientType: "Returning",
      source: "Walk-in"
    },
    {
      glNo: "0431-2025",
      date: "Oct 02, 2025",
      dateIso: "2025-10-02",
      year: "2025",
      client: {
        lastName: "Lim",
        firstName: "Jose",
        middleName: "D.",
        ext: "",
        fullName: "Jose Lim",
        street: "Purok 6",
        barangay: "Poblacion",
        city: "Maramag",
        province: "Bukidnon",
        region: "10",
        mobile: "0947 111 2233",
        birthdate: "1960-07-15",
        age: 66,
        gender: "Male",
        civilStatus: "Married",
        occupation: "Retired",
        salary: 4000
      },
      beneficiary: {
        lastName: "Lim",
        firstName: "Rita",
        middleName: "",
        ext: "",
        fullName: "Rita Lim",
        street: "Purok 6",
        barangay: "Poblacion",
        city: "Maramag",
        province: "Bukidnon",
        region: "10",
        birthdate: "1962-12-05",
        age: 64,
        gender: "Female",
        civilStatus: "Married",
        occupation: "Housekeeper",
        salary: 2000,
        relationship: "Spouse"
      },
      targetSector: "SC",
      service: "Medical",
      assistanceProvided: "Medical assistance",
      amount: 1800,
      amountWords: "ONE THOUSAND EIGHT HUNDRED PESOS ONLY",
      fundSource: "MSWDO",
      purpose: "Hypertension medicine",
      partnerAgency: "St. Joseph Hospital",
      worker: "Ana Dela Cruz",
      savedAt: "Oct 02, 2025, 10:45 AM",
      clientType: "New",
      source: "Walk-in"
    }
  ],
  // Drafts are loaded from the authenticated Laravel API; never seed local draft records.
  drafts: []
};

// Storage helper methods
function loadStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    console.error("Failed to load from storage", key, e);
    return fallback;
  }
}

function saveStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error("Failed to save to storage", key, e);
  }
}

// System state object
const appState = {
  currentUser: null,
  users: loadStorage(STORAGE_KEYS.USERS, SEED_DATA.users),
  records: loadStorage(STORAGE_KEYS.RECORDS, SEED_DATA.records),
  drafts: [],
  currentDraftId: null,
  agencies: loadStorage(STORAGE_KEYS.AGENCIES, SEED_DATA.agencies),
  barangays: loadStorage(STORAGE_KEYS.BARANGAYS, SEED_DATA.barangays),
  signatories: loadStorage(STORAGE_KEYS.SIGNATORIES, SEED_DATA.signatories),
  rules: loadStorage(STORAGE_KEYS.RULES, SEED_DATA.rules),
  assistanceTypes: loadStorage(STORAGE_KEYS.ASSISTANCE_TYPES, SEED_DATA.assistanceTypes),
  isOnline: navigator.onLine,
  currentTxnStep: 1,
  activePreviewDoc: "gis",
  activeReviewDoc: "gis",
  activeStep4Doc: "gl",
  currentEditingRecordGl: null,
  step1AssistanceType: "Medical",
  step1IdentityStatus: "no_match",
  step1PreviousRecordCount: 0,
  lastSavedRecord: null
};

// ==========================================================================
// 2. CURRENCY & NUMBER TO WORDS UTILITY (Exact Official Capitalized Format)
// ==========================================================================

function numberToWords(amount) {
  let num = parseInt(amount, 10);
  if (isNaN(num) || num === 0) return "ZERO PESOS ONLY";

  const ones = ["", "ONE", "TWO", "THREE", "FOUR", "FIVE", "SIX", "SEVEN", "EIGHT", "NINE", "TEN",
    "ELEVEN", "TWELVE", "THIRTEEN", "FOURTEEN", "FIFTEEN", "SIXTEEN", "SEVENTEEN", "EIGHTEEN", "NINETEEN"];
  const tens = ["", "", "TWENTY", "THIRTY", "FORTY", "FIFTY", "SIXTY", "SEVENTY", "EIGHTY", "NINETY"];

  function convertHundreds(n) {
    let str = "";
    if (n >= 100) {
      str += ones[Math.floor(n / 100)] + " HUNDRED ";
      n %= 100;
    }
    if (n >= 20) {
      str += tens[Math.floor(n / 10)] + " ";
      n %= 10;
    }
    if (n > 0) {
      str += ones[n] + " ";
    }
    return str.trim();
  }

  let words = "";
  if (num >= 1000000) {
    words += convertHundreds(Math.floor(num / 1000000)) + " MILLION ";
    num %= 1000000;
  }
  if (num >= 1000) {
    words += convertHundreds(Math.floor(num / 1000)) + " THOUSAND ";
    num %= 1000;
  }
  if (num > 0) {
    words += convertHundreds(num);
  }

  return words.trim() + " PESOS ONLY";
}

function formatCurrency(amount) {
  const val = parseFloat(amount);
  if (isNaN(val)) return "0.00";
  return val.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDateDisplay(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[d.getMonth()]} ${String(d.getDate()).padStart(2, "0")}, ${d.getFullYear()}`;
}

// ==========================================================================
// 3. AUTHENTICATION & SESSION MANAGEMENT
// ==========================================================================

function initAuth() {
  const storedUser = loadStorage(STORAGE_KEYS.CURRENT_USER, null);
  if (storedUser) {
    // Verify user still active
    const u = appState.users.find(x => x.username.toLowerCase() === storedUser.username.toLowerCase());
    if (u && u.status === "Active") {
      setAuthenticatedUser(u);
      return;
    }
  }
  showAuthView();
}

function hidePageLoader() {
  const loader = document.getElementById("pageLoader");
  if (!loader || loader.classList.contains("hidden")) return;
  loader.classList.add("fade-out");
  setTimeout(() => loader.classList.add("hidden"), 380);
}

function showAuthView() {
  hidePageLoader();
  document.getElementById("authContainer").classList.remove("hidden");
  document.getElementById("appContainer").classList.add("hidden");
  document.getElementById("loginCard").classList.remove("hidden");
  document.getElementById("firstLoginCard").classList.add("hidden");
  clearLoginErrors();
  const passInput = document.getElementById("loginPassword");
  if (passInput) passInput.type = "password";
}

// Role-Based Access Control (RBAC) Permissions Matrix
const ROLE_PERMISSIONS = {
  "Viewer": ["assistance-verification"],
  "Staff": ["home", "new-transaction", "records", "budget"],
  "Senior staff": ["home", "new-transaction", "records", "monthly-report", "budget"],
  "Administrator": ["home", "new-transaction", "records", "monthly-report", "admin", "budget"]
};

function applyRbacNavigation(role) {
  const navHome = document.getElementById("navHome");
  const navNewTxn = document.getElementById("navNewTxn");
  const navRecords = document.getElementById("navRecords");
  const navBudget = document.getElementById("navBudget");
  const navMonthly = document.getElementById("navMonthlyReport");
  const navAdmin = document.getElementById("navAdmin");
  const navAssistanceVerification = document.getElementById("navAssistanceVerification");
  const onlineStatusWrap = document.getElementById("onlineStatusWrap");
  const draftsMenuItem = document.getElementById("draftsMenuItem");
  const offlineBanner = document.getElementById("offlineBanner");
  const syncToast = document.getElementById("syncToast");

  const allowedTabs = ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS["Staff"];

  if (navHome) navHome.classList.toggle("hidden", !allowedTabs.includes("home"));
  if (navNewTxn) navNewTxn.classList.toggle("hidden", !allowedTabs.includes("new-transaction"));
  if (navRecords) navRecords.classList.toggle("hidden", !allowedTabs.includes("records"));
  if (navBudget) navBudget.classList.toggle("hidden", !allowedTabs.includes("budget"));
  if (navMonthly) navMonthly.classList.toggle("hidden", !allowedTabs.includes("monthly-report"));
  if (navAdmin) navAdmin.classList.toggle("hidden", !allowedTabs.includes("admin"));
  if (navAssistanceVerification) {
    navAssistanceVerification.classList.toggle("hidden", !allowedTabs.includes("assistance-verification"));
  }
  if (onlineStatusWrap) onlineStatusWrap.classList.toggle("hidden", role === "Viewer");
  if (draftsMenuItem) draftsMenuItem.classList.toggle("hidden", role === "Viewer");
  // Banner and toast visibility are managed exclusively by updateOnlineStatusUI().
  // Viewers never see them; for all other roles, online state decides.
  if (role === "Viewer") {
    if (offlineBanner) offlineBanner.classList.add("hidden");
    if (syncToast) syncToast.classList.add("hidden");
  }
}

function canCreateTxn() {
  if (!appState.isOnline) return false;
  const role = appState.currentUser ? appState.currentUser.role : "Staff";
  return role !== "Viewer";
}

function offlineWriteGuard(action) {
  if (!appState.isOnline) {
    alert("You are offline. " + (action || "This action") + " requires a live connection to the server.");
    return false;
  }
  return true;
}

function setAuthenticatedUser(user) {
  hidePageLoader();
  appState.currentUser = user;
  const issueGlButton = document.getElementById("btnIssueGuaranteeLetter");
  const canIssueGl = ["Administrator", "Senior staff"].includes(user.role);
  if (issueGlButton) issueGlButton.classList.toggle("hidden", !canIssueGl);
  const glStatusText = document.getElementById("glIssueStatusText");
  if (glStatusText) {
    glStatusText.textContent = canIssueGl
      ? "Budget is deducted only after the Guarantee Letter is approved and marked as issued."
      : "Budget is deducted only after a Senior Staff or Administrator approves and issues the Guarantee Letter. Inform your supervisor to issue it.";
  }
  saveStorage(STORAGE_KEYS.CURRENT_USER, user);

  document.getElementById("authContainer").classList.add("hidden");
  document.getElementById("appContainer").classList.remove("hidden");

  // Update Header User Profile
  document.getElementById("currentUserName").textContent = user.name;
  document.getElementById("currentUserRoleBadge").textContent = user.role;
  document.getElementById("dropdownUserName").textContent = user.name;
  document.getElementById("dropdownUserRole").textContent = user.role;

  // Apply strict RBAC navigation visibility
  applyRbacNavigation(user.role);

  // Update drafts count badge
  updateDraftsCountBadge();

  // Sync the offline banner / pill with actual network state now that the
  // user is authenticated and the role-based nav is settled.
  updateOnlineStatusUI();

  // Restore the last visited tab (default: home).
  // Validate it against this user's allowed tabs so cross-role LAST_TAB persists safely.
  const savedTab = loadStorage(STORAGE_KEYS.LAST_TAB, "home");
  const userAllowedTabs = ROLE_PERMISSIONS[user.role] || ROLE_PERMISSIONS["Staff"];
  const restoreTab = (savedTab && savedTab !== "new-transaction" && userAllowedTabs.includes(savedTab))
    ? savedTab
    : (userAllowedTabs[0] || "home");
  navigateToTab(restoreTab);
}

function handleLogin(e) {
  e.preventDefault();
  const unameInput = document.getElementById("loginUsername");
  const passInput = document.getElementById("loginPassword");
  const uname = unameInput.value.trim().toLowerCase();
  const pword = passInput.value;
  const errorAlert = document.getElementById("loginErrorAlert");
  const passError = document.getElementById("loginPassErrorMsg");
  const userError = document.getElementById("loginUserErrorMsg");

  // Reset errors first
  clearLoginErrors();

  const user = appState.users.find(u => u.username.toLowerCase() === uname);

  if (!user) {
    // Username not found
    errorAlert.classList.remove("hidden");
    unameInput.classList.add("input-error");
    if (userError) userError.classList.remove("hidden");
    unameInput.focus();
    return;
  }

  if (user.password !== pword) {
    // Password incorrect - exactly matches wireframe 1b!
    errorAlert.classList.remove("hidden");
    passInput.classList.add("input-error");
    if (passError) passError.classList.remove("hidden");
    passInput.focus();
    return;
  }

  if (user.status === "Disabled") {
    // Account disabled (Wireframe 11b)
    errorAlert.classList.remove("hidden");
    const title = errorAlert.querySelector(".auth-error-title");
    const desc = errorAlert.querySelector(".auth-error-desc");
    if (title) title.textContent = "Account disabled";
    if (desc) desc.textContent = "This account has been disabled. Please contact your system administrator.";
    unameInput.classList.add("input-error");
    return;
  }

  if (user.mustChangePass) {
    // Show First Login Password Setup (Wireframe 11a)
    document.getElementById("loginCard").classList.add("hidden");
    document.getElementById("firstLoginCard").classList.remove("hidden");
    appState.pendingFirstLoginUser = user;
    return;
  }

  clearLoginErrors();
  setAuthenticatedUser(user);
}

function clearLoginErrors() {
  const errorAlert = document.getElementById("loginErrorAlert");
  const passInput = document.getElementById("loginPassword");
  const unameInput = document.getElementById("loginUsername");
  const passError = document.getElementById("loginPassErrorMsg");
  const userError = document.getElementById("loginUserErrorMsg");

  if (errorAlert) errorAlert.classList.add("hidden");
  if (passInput) passInput.classList.remove("input-error");
  if (unameInput) unameInput.classList.remove("input-error");
  if (passError) passError.classList.add("hidden");
  if (userError) userError.classList.add("hidden");

  // Reset default banner text
  if (errorAlert) {
    const title = errorAlert.querySelector(".auth-error-title");
    const desc = errorAlert.querySelector(".auth-error-desc");
    if (title) title.textContent = "Wrong username or password";
    if (desc) desc.textContent = "Please check your details and try again.";
  }
}

function togglePasswordVisibility(inputId, btn) {
  const input = document.getElementById(inputId);
  if (!input) return;

  const isPassword = input.type === "password";
  input.type = isPassword ? "text" : "password";

  const strike = btn.querySelector(".eye-strike");
  if (strike) {
    strike.classList.toggle("hidden", !isPassword);
  }

  // Keep the control's accessible state in sync with the input.
  btn.setAttribute("aria-pressed", String(isPassword));
  btn.setAttribute("aria-label", isPassword ? "Hide password" : "Show password");
  btn.setAttribute("title", isPassword ? "Hide password" : "Show password");
}

function fillDemoUser(roleKey) {
  const creds = {
    admin: { u: "admin", p: "admin123" },
    sstaff: { u: "sstaff", p: "password123" },
    staff: { u: "staff", p: "password123" },
    viewer: { u: "viewer", p: "password123" }
  };
  const target = creds[roleKey];
  if (target) {
    document.getElementById("loginUsername").value = target.u;
    document.getElementById("loginPassword").value = target.p;
  }
}

function handleFirstLoginSubmit(e) {
  e.preventDefault();
  const p1 = document.getElementById("newPasswordInput").value;
  const p2 = document.getElementById("confirmNewPasswordInput").value;

  if (p1.length < 6) {
    alert("Password must be at least 6 characters long.");
    return;
  }
  if (p1 !== p2) {
    alert("Passwords do not match.");
    return;
  }

  const u = appState.pendingFirstLoginUser;
  u.password = p1;
  u.mustChangePass = false;
  saveStorage(STORAGE_KEYS.USERS, appState.users);
  setAuthenticatedUser(u);
}

function cancelFirstLogin() {
  document.getElementById("firstLoginCard").classList.add("hidden");
  document.getElementById("loginCard").classList.remove("hidden");
}

function handleLogout() {
  localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  appState.currentUser = null;
  document.getElementById("userDropdown").classList.add("hidden");
  showAuthView();
}

function toggleUserMenu() {
  const d = document.getElementById("userDropdown");
  d.classList.toggle("hidden");
}

document.addEventListener("click", function (e) {
  const btn = document.getElementById("userMenuBtn");
  const dropdown = document.getElementById("userDropdown");
  if (dropdown && !dropdown.classList.contains("hidden")) {
    if (!btn.contains(e.target) && !dropdown.contains(e.target)) {
      dropdown.classList.add("hidden");
    }
  }
});

// ==========================================================================
// 4. NAVIGATION & TAB SWITCHING
// ==========================================================================

function navigateToTab(tabName) {
  const currentRole = appState.currentUser ? appState.currentUser.role : "Staff";
  const allowedTabs = ROLE_PERMISSIONS[currentRole] || ROLE_PERMISSIONS["Staff"];

  // Security guard: prevent navigating to unauthorized tabs
  if (!allowedTabs.includes(tabName)) {
    tabName = allowedTabs[0] || "home";
  }

  if (tabName !== "assistance-verification" && typeof window.clearViewerAssistanceVerificationUI === "function") {
    window.clearViewerAssistanceVerificationUI();
  }

  // Update header nav tabs active state
  document.querySelectorAll(".header-nav .nav-tab").forEach(tab => {
    tab.classList.toggle("active", tab.getAttribute("data-tab") === tabName);
  });

  // Switch tab pane
  document.querySelectorAll(".tab-pane").forEach(pane => {
    pane.classList.remove("active");
  });

  const targetPane = document.getElementById(`tab-${tabName}`);
  if (targetPane) {
    targetPane.classList.add("active");
  }

  window.scrollTo({ top: 0, behavior: "smooth" });

  // Remember the last visited tab so page refresh returns here.
  // new-transaction is never saved directly — reload goes to home instead.
  saveStorage(STORAGE_KEYS.LAST_TAB, tabName !== "new-transaction" ? tabName : "home");

  // Trigger tab-specific refresh
  if (tabName === "home") {
    const homeSearch = document.getElementById("homeSearchInput");
    if (!homeSearch || !homeSearch.value.trim()) {
      document.getElementById("homeSearchResultArea").classList.add("hidden");
      const recentCard = document.getElementById("recentTransactionsCard");
      if (recentCard) recentCard.classList.remove("hidden");
    }
    renderRecentTransactions();
  } else if (tabName === "new-transaction") {
    if (!appState.isOnline) {
      alert("You are offline. Creating a new transaction requires a live connection to the server.");
      navigateToTab("home");
      return;
    }
    if (appState.currentTxnStep === 1) {
      initStep1Check();
    }
  } else if (tabName === "records") {
    showRecordsSkeleton();
    // Brief yield so skeleton paints before potentially-blocking filter runs
    setTimeout(() => { populateAgencyFilterDropdown(); filterRecordsList(); }, 60);
  } else if (tabName === "monthly-report") {
    handleMonthlyReportTabOpen();
  } else if (tabName === "budget") {
    if (typeof loadMonthlyBudget === "function") loadMonthlyBudget();
  } else if (tabName === "admin") {
    handleAdminTabOpen();
  }
}

// ==========================================================================
// 5. ONLINE / OFFLINE SIMULATION (Wireframe 10d, 10e, 10f)
// ==========================================================================

function toggleOnlineStatus() {
  // Network status is determined by the browser, not by manual toggle.
  // This function is intentionally left as a no-op.
}

function updateOnlineStatusUI() {
  const btn = document.getElementById("onlineStatusBtn");
  const txt = document.getElementById("onlineStatusText");
  const banner = document.getElementById("offlineBanner");
  const toast = document.getElementById("syncToast");

  if (appState.currentUser && appState.currentUser.role === "Viewer") {
    banner?.classList.add("hidden");
    toast?.classList.add("hidden");
    return;
  }

  if (appState.isOnline) {
    btn.className = "status-badge status-online";
    txt.textContent = "Online";
    banner.classList.add("hidden");

    // Show simulated syncing toast (Wireframe 10e/10f)
    toast.classList.remove("hidden");
    document.getElementById("syncSpinner").classList.remove("hidden");
    document.getElementById("syncToastMessage").textContent = "Back online: syncing saved records...";

    setTimeout(() => {
      document.getElementById("syncSpinner").classList.add("hidden");
      document.getElementById("syncToastMessage").innerHTML = "&#10003; All records synced";
      setTimeout(() => {
        toast.classList.add("hidden");
      }, 2500);
    }, 1200);

  } else {
    btn.className = "status-badge status-offline";
    txt.textContent = "Offline";
    banner.classList.remove("hidden");
    toast.classList.add("hidden");
  }
}

// ==========================================================================
// 6. HOME VIEW: SEARCH & 3-MONTH ELIGIBILITY ENGINE (Wireframe 2a, 2b, 2c, 2e, 10g, 10h)
// ==========================================================================

function handleHomeSearchKeyup(e) {
  const query = document.getElementById("homeSearchInput").value.trim();
  if (!query) {
    document.getElementById("homeSearchResultArea").classList.add("hidden");
    document.getElementById("searchShortWarning").classList.add("hidden");
    const recentCard = document.getElementById("recentTransactionsCard");
    if (recentCard) recentCard.classList.remove("hidden");
  }
  if (e.key === "Enter") {
    executeHomeSearch();
  }
}

function executeHomeSearch() {
  const query = document.getElementById("homeSearchInput").value.trim().toLowerCase();
  const resultArea = document.getElementById("homeSearchResultArea");
  const warning = document.getElementById("searchShortWarning");
  const recentCard = document.getElementById("recentTransactionsCard");

  if (!query) {
    resultArea.classList.add("hidden");
    warning.classList.add("hidden");
    if (recentCard) recentCard.classList.remove("hidden");
    return;
  }

  // Minimum length check (Wireframe 10h)
  if (query.length < 3) {
    warning.classList.remove("hidden");
    resultArea.classList.add("hidden");
    if (recentCard) recentCard.classList.remove("hidden");
    return;
  }
  warning.classList.add("hidden");

  // Search in records database
  const matches = appState.records.filter(r => {
    const cName = (r.client.fullName || `${r.client.firstName} ${r.client.lastName}`).toLowerCase();
    const bName = (r.beneficiary.fullName || `${r.beneficiary.firstName} ${r.beneficiary.lastName}`).toLowerCase();
    return cName.includes(query) || bName.includes(query);
  });

  resultArea.classList.remove("hidden");
  if (recentCard) recentCard.classList.add("hidden");

  if (matches.length === 0) {
    // New Client - Fully Eligible (Wireframe 2d / 2e)
    const formattedQueryName = capitalizeWords(query);
    const isOffline = !appState.isOnline;
    const alertDesc = isOffline
      ? `No AICS transaction is recorded for "${formattedQueryName}" in the saved copy. Check again once the connection returns if the record is critical.`
      : `No previous record found in the MSWDO database. The client can continue directly to assistance requirements.`;

    resultArea.innerHTML = `
      <div class="card eligibility-card eligible p-4">
        <div class="eligibility-header-line">
          <span class="eligibility-person-name">${formattedQueryName}</span>
          <span class="client-badge-pill new">New client</span>
        </div>
        <div class="eligibility-alert-box">
          <div class="eligibility-alert-icon">&#10003;</div>
          <div>
            <strong>No previous record found</strong><br>
            <span class="text-sm">${alertDesc}</span>
          </div>
        </div>
        <div class="eligibility-actions-row">
          ${canCreateTxn() ? `<button type="button" class="btn btn-primary" onclick="startNewTxnForClient('${formattedQueryName}', true)">Start new transaction</button>` : `<span class="badge badge-subtle">Viewer access (view only)</span>`}
        </div>
      </div>
    `;
    return;
  }

  // Separate people who share a name by their available identifying details.
  const identityKey = person => [
    (person.birthdate || "").trim(),
    (person.mobile || "").split("").filter(ch => ch >= "0" && ch <= "9").join(""),
    (person.barangay || "").trim().toLowerCase(),
    (person.street || "").trim().toLowerCase(),
    (person.gender || "").trim().toLowerCase()
  ].join("|");
  const identityGroupKey = record => {
    const key = identityKey(record.client || {});
    return key.split("|").some(part => part) ? key : "record-" + record.glNo;
  };
  const identityGroups = new Map();
  matches.forEach(record => {
    const groupKey = identityGroupKey(record);
    const existing = identityGroups.get(groupKey);
    if (!existing || new Date(record.dateIso || record.date) > new Date(existing.dateIso || existing.date)) {
      identityGroups.set(groupKey, record);
    }
  });

  if (identityGroups.size > 1 && !appState.homeSearchSelectedIdentity) {
    const candidates = Array.from(identityGroups.entries()).sort((a, b) =>
      new Date(b[1].dateIso || b[1].date) - new Date(a[1].dateIso || a[1].date)
    );
    resultArea.innerHTML = `
      <div class="card p-4">
        <div class="eligibility-header-line">
          <strong>Multiple clients with a similar name were found</strong>
          <span class="client-badge-pill returning">${candidates.length} possible matches</span>
        </div>
        <p class="text-sm text-muted mb-3">Please verify the client's details before checking the waiting period. Select the correct person below.</p>
        <div class="duplicate-client-list">
          ${candidates.map(([key, record], index) => {
            const person = record.client || {};
            const details = [
              person.birthdate ? "Birthdate: " + person.birthdate : (person.age ? "Age: " + person.age : ""),
              person.mobile ? "Mobile: " + person.mobile : "",
              [person.street, person.barangay].filter(Boolean).join(", ")
            ].filter(Boolean).join(" · ");
            return `
              <div class="duplicate-client-option">
                <div>
                  <strong>${person.fullName || [person.firstName, person.middleName, person.lastName].filter(Boolean).join(" ")}</strong>
                  <div class="text-xs text-muted">${details || "No additional identifying details recorded"}</div>
                  <div class="text-xs text-muted">Last transaction: ${record.date} · ${record.service} · GL ${record.glNo}</div>
                </div>
                <button type="button" class="btn btn-outline-primary btn-sm" onclick="selectHomeSearchIdentity('${encodeURIComponent(key)}')">Select this client</button>
              </div>`;
          }).join("")}
        </div>
        <div class="eligibility-actions-row mt-3">
          ${canCreateTxn() ? `<button type="button" class="btn btn-primary" onclick="startNewTxnForClient('${capitalizeWords(query)}', true)">This is a different person — register as new client</button>` : ""}
        </div>
      </div>`;
    return;
  }

  if (appState.homeSearchSelectedIdentity) {
    const selected = decodeURIComponent(appState.homeSearchSelectedIdentity);
    matches = matches.filter(record => identityGroupKey(record) === selected);
  }

  // Sort by date descending (latest record first)
  matches.sort((a, b) => new Date(b.dateIso || b.date) - new Date(a.dateIso || a.date));
  const latestRec = matches[0];
  const clientName = latestRec.client.fullName || `${latestRec.client.firstName} ${latestRec.client.lastName}`;

  // Check 3-month waiting period rule (default 3 months = ~90 days)
  const waitingMonths = appState.rules.waitingPeriodMonths || 3;
  const servedDate = new Date(latestRec.dateIso || latestRec.date);
  const eligibleDate = new Date(servedDate);
  eligibleDate.setMonth(eligibleDate.getMonth() + waitingMonths);

  // Compare against today's date
  const today = new Date();
  const diffTime = eligibleDate.getTime() - today.getTime();
  const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const isWaitingPeriodActive = daysRemaining > 0;

  if (isWaitingPeriodActive) {
    // NOT YET ELIGIBLE — compact pink warning matching the supplied reference.
    const returnDate = formatDateDisplay(eligibleDate);
    const daysText = daysRemaining === 1 ? "1 day from today" : `${daysRemaining} days from today`;
    resultArea.innerHTML = `
      <div class="card eligibility-card not-eligible p-4">
        <div class="eligibility-header-line">
          <span class="eligibility-person-name">${clientName}</span>
          <span class="client-badge-pill returning">Returning client</span>
        </div>
        <div class="eligibility-alert-box" style="background:#fcecf1;border:2px solid #d9a3b4;border-radius:9px;padding:14px 16px;color:#202b3c;">
          <div>
            <strong>Not yet eligible: ${waitingMonths}-month waiting period</strong><br>
            <span class="text-sm">Last served ${latestRec.date} · ${latestRec.service} · GL ${latestRec.glNo}. The rule applies to every assistance type with no exception. They can come back on <strong>${returnDate}</strong> (${daysText}).</span>
          </div>
        </div>
        <div class="eligibility-actions-row">
          <button type="button" class="btn btn-secondary" disabled title="Unavailable until waiting period passes">Start new transaction</button>
          <span class="text-xs text-muted ml-2">Unavailable until ${returnDate}</span>
        </div>
      </div>
    `;
  } else {
    // ELIGIBLE RETURNING CLIENT (Wireframe 2b)
    resultArea.innerHTML = `
      <div class="card eligibility-card eligible p-4">
        <div class="eligibility-header-line">
          <span class="eligibility-person-name">${clientName}</span>
          <span class="client-badge-pill returning">Returning client</span>
        </div>
        <div class="eligibility-alert-box">
          <div class="eligibility-alert-icon">&#10003;</div>
          <div>
            <strong>Eligible to continue</strong><br>
            <span class="text-sm">Last served: ${latestRec.service} assistance, ${latestRec.date} (GL ${latestRec.glNo}). The ${waitingMonths}-month waiting period has already passed.</span>
          </div>
        </div>
        <div class="eligibility-actions-row">
          <button type="button" class="btn btn-outline-secondary" onclick="openRecordDetail('${latestRec.glNo}')">View previous record</button>
          ${canCreateTxn() ? `<button type="button" class="btn btn-primary" onclick="startNewTxnFromPreviousRecord('${latestRec.glNo}')">Start new transaction</button>` : `<span class="badge badge-subtle ml-2">Viewer access (view only)</span>`}
        </div>
      </div>
    `;
  }
}

function selectHomeSearchIdentity(encodedIdentity) {
  appState.homeSearchSelectedIdentity = encodedIdentity;
  executeHomeSearch();
}

function capitalizeWords(str) {
  return str.replace(/\b\w/g, l => l.toUpperCase());
}

function renderRecentTransactions() {
  const tbody = document.getElementById("recentTransactionsTableBody");
  if (!tbody) return;

  const sorted = [...appState.records].sort((a, b) => new Date(b.dateIso || b.date) - new Date(a.dateIso || a.date)).slice(0, 5);

  tbody.innerHTML = sorted.map(r => `
    <tr>
      <td class="font-weight-bold">${r.glNo}</td>
      <td>${r.client.fullName || `${r.client.firstName} ${r.client.lastName}`}</td>
      <td><span class="badge badge-subtle">${r.service}</span></td>
      <td>${r.date}</td>
      <td class="text-right">
        <button type="button" class="btn btn-sm btn-outline-primary" onclick="openRecordDetail('${r.glNo}')">View</button>
      </td>
    </tr>
  `).join("");
}

// ==========================================================================
// 7. NEW TRANSACTION WIZARD (STEP 1: PRE-CHECK & REQUIREMENTS CHECKLIST)
// ==========================================================================

function renderStep1Pills() {
  const container = document.getElementById("step1AssistancePills");
  if (!container) return;
  const active = appState.assistanceTypes.filter(a => a.status === "Active");
  container.innerHTML = active.map((a, i) => `
    <button type="button" class="btn-pill ${i === 0 ? "active" : ""}" onclick="selectStep1Assistance('${a.type}')">${a.type}</button>
  `).join("");
  if (active.length > 0 && (!appState.step1AssistanceType || !active.find(a => a.type === appState.step1AssistanceType))) {
    appState.step1AssistanceType = active[0].type;
  }
}

function initStep1Check() {
  renderStep1Pills();
  updateStep1Display();
  renderAssistanceChecklist(appState.step1AssistanceType || (appState.assistanceTypes.find(a => a.status === "Active") || {}).type || "Medical");
  populateBarangayOptions();
  populateAgencyDropdowns();
}

function selectStep1Assistance(astType) {
  appState.step1AssistanceType = astType;
  document.querySelectorAll("#step1AssistancePills .btn-pill").forEach(btn => {
    btn.classList.toggle("active", btn.textContent.trim().toLowerCase().startsWith(astType.toLowerCase()));
  });
  renderAssistanceChecklist(astType);
}

function renderAssistanceChecklist(astType) {
  const container = document.getElementById("checklistContainer");
  const activeTypes = appState.assistanceTypes.filter(a => a.status === "Active");
  const found = activeTypes.find(a => a.type.toLowerCase().startsWith(astType.toLowerCase()))
    || activeTypes[0];

  container.innerHTML = found.requirements.map((item, idx) => `
    <label class="checklist-item-check" id="chkItemLabel-${idx}">
      <input type="checkbox" id="chkReq-${idx}" checked onchange="validateStep1Checklist()">
      <span>${item}</span>
    </label>
  `).join("");

  const noteEl = document.getElementById("step1ChecklistNote");
  if (noteEl) {
    noteEl.textContent = `Sample checklist for the ${found.type} type. Documents and number of copies per assistance type are still to be confirmed with the MSWDO.`;
  }

  validateStep1Checklist();
}

function validateStep1Checklist() {
  const checkboxes = document.querySelectorAll("#checklistContainer input[type='checkbox']");
  const unchecked = Array.from(checkboxes).filter(cb => !cb.checked);
  const btn = document.getElementById("btnContinueToForm");
  const warning = document.getElementById("step1MissingWarning");
  const warningCount = document.getElementById("missingWarningCount");
  const beneficiaryBlocked = !!appState.step1BeneficiaryBlocked || !!appState.step1BeneficiaryChecking;

  if (unchecked.length === 0 && !beneficiaryBlocked) {
    btn.disabled = false;
    btn.className = "btn btn-continue-active";
    if (warning) warning.classList.add("hidden");
  } else {
    btn.disabled = true;
    btn.className = "btn btn-continue-disabled";
    if (warning) {
      warning.classList.remove("hidden");
      const word = beneficiaryBlocked
        ? (appState.step1BeneficiaryChecking ? "Checking beneficiary eligibility..." : "Beneficiary has an AICS record within the configured waiting period and is not yet eligible")
        : (unchecked.length === 1 ? "1 required document is missing" : `${unchecked.length} required documents are missing`);
      if (warningCount) warningCount.textContent = word;
    }
  }
}

let beneficiaryEligibilityRequestId = 0;

function handleStep1BeneficiaryChange(e) {
  appState.step1BeneficiaryName = e.target.value.trim();
  runStep1BeneficiaryEligibilityCheck();
}

async function loadStep1FullHistory(page = 1) {
  const container = document.getElementById("step1FullHistory");
  const name = (appState.step1BeneficiaryName || "").trim();
  if (!container || !name || typeof window.getBeneficiaryHistory !== "function") return;

  container.classList.remove("hidden");
  container.textContent = "Loading full history...";
  try {
    const response = await window.getBeneficiaryHistory(name, page, 10);
    const records = response.data || [];
    const pagination = response.pagination || {};
    const panel = document.createElement("div");
    panel.className = "card p-3";

    const heading = document.createElement("strong");
    heading.textContent = "Full AICS history";
    const count = document.createElement("p");
    count.className = "text-xs text-muted mb-2";
    const first = records.length ? ((pagination.current_page - 1) * pagination.per_page) + 1 : 0;
    const last = ((pagination.current_page - 1) * pagination.per_page) + records.length;
    count.textContent = "Showing " + first + "–" + last + " of " + (pagination.total || 0) + " matching records";

    const list = document.createElement("ul");
    list.className = "text-xs mb-2 pl-3";
    records.forEach(record => {
      const item = document.createElement("li");
      item.textContent = [
        "GL " + (record.gl_number || "-"),
        record.transaction_date || "Date unavailable",
        record.assistance_type || "Assistance record",
        "Requester: " + (record.client_name || "Not recorded"),
        "Beneficiary: " + (record.beneficiary_name || "Not recorded")
      ].join(" | ");
      list.appendChild(item);
    });

    const navigation = document.createElement("div");
    navigation.className = "d-flex align-items-center justify-content-between flex-wrap";
    const previous = document.createElement("button");
    previous.type = "button";
    previous.className = "btn btn-sm btn-outline-secondary";
    previous.textContent = "Previous";
    previous.disabled = !pagination.current_page || pagination.current_page <= 1;
    previous.addEventListener("click", () => loadStep1FullHistory(pagination.current_page - 1));

    const pageLabel = document.createElement("span");
    pageLabel.className = "text-xs text-muted";
    pageLabel.textContent = "Page " + (pagination.current_page || 1) + " of " + (pagination.last_page || 1);

    const next = document.createElement("button");
    next.type = "button";
    next.className = "btn btn-sm btn-outline-secondary";
    next.textContent = "Next";
    next.disabled = !pagination.last_page || pagination.current_page >= pagination.last_page;
    next.addEventListener("click", () => loadStep1FullHistory(pagination.current_page + 1));

    navigation.append(previous, pageLabel, next);
    panel.append(heading, count, list, navigation);
    container.replaceChildren(panel);
  } catch (error) {
    container.textContent = "Unable to load full history: " + (error.message || "Please try again.");
  }
}

async function runStep1BeneficiaryEligibilityCheck() {
  const bName = (appState.step1BeneficiaryName || "").trim();
  const resultDiv = document.getElementById("step1EligibilityResult");
  if (!resultDiv) return;

  const requestId = ++beneficiaryEligibilityRequestId;
  const historyContainer = document.getElementById("step1FullHistory");
  if (historyContainer) {
    historyContainer.classList.add("hidden");
    historyContainer.replaceChildren();
  }
  appState.step1BeneficiaryBlocked = false;
  appState.step1BeneficiaryChecking = false;

  if (!bName) {
    appState.step1IdentityStatus = "no_match";
    appState.step1PreviousRecordCount = 0;
    resultDiv.innerHTML = `
      <div class="precheck-result-box">
        <div class="precheck-result-icon">&#10003;</div>
        <div class="precheck-result-texts">
          <strong>Enter beneficiary name</strong>
          <span>The system will check previous AICS records before you continue.</span>
        </div>
      </div>`;
    validateStep1Checklist();
    return;
  }

  appState.step1BeneficiaryChecking = true;
  resultDiv.innerHTML = `
    <div class="alert alert-info" style="border-radius:8px;">
      <strong>Checking beneficiary records...</strong>
      <span class="text-xs">Please wait while the system checks the database.</span>
    </div>`;
  validateStep1Checklist();

  try {
    if (typeof window.checkBeneficiaryEligibility !== "function") {
      throw new Error("The beneficiary eligibility service is unavailable.");
    }
    const result = await window.checkBeneficiaryEligibility(bName);
    if (requestId !== beneficiaryEligibilityRequestId) return;

    const matches = result.matches || [];
    appState.step1IdentityStatus = result.identity_status || (matches.length ? "verification_required" : "no_match");
    appState.step1PreviousRecordCount = Number(result.history_total ?? matches.length);
    appState.step1BeneficiaryBlocked = !result.eligible;
    appState.step1BeneficiaryChecking = false;

    const waitingMonths = Number(result.waiting_period_months || 3);
    if (matches.length === 0) {
      resultDiv.innerHTML = `
        <div class="precheck-result-box">
          <div class="precheck-result-icon">&#10003;</div>
          <div class="precheck-result-texts">
            <strong>No previous record found</strong>
            <span>The beneficiary is not listed in previous AICS transactions and may continue to the requirements.</span>
          </div>
        </div>`;
    } else {
      const isBlocked = appState.step1BeneficiaryBlocked;
      const identityStatus = result.identity_status || "verification_required";
      const needsStaffVerification = ["verification_required", "possible_name_match"].includes(identityStatus);
      const alert = document.createElement("div");
      alert.className = isBlocked ? "alert alert-danger" : (needsStaffVerification ? "alert alert-warning" : "alert alert-success");
      alert.style.borderRadius = "8px";

      const heading = document.createElement("strong");
      heading.textContent = isBlocked
        ? "Verified person is not eligible yet"
        : needsStaffVerification
          ? "Possible duplicate name — staff verification needed"
          : "Previous AICS record found — waiting period completed";

      const detail = document.createElement("div");
      detail.className = "text-xs mt-1";
      detail.textContent = result.message || (isBlocked
        ? "A verified person has a record within the configured waiting period."
        : needsStaffVerification
          ? "A name match is not enough to confirm identity. Check the person's date of birth and history before deciding."
          : "The previous transaction is outside the configured " + waitingMonths + "-month waiting period.");

      const list = document.createElement("ul");
      list.className = "text-xs mt-2 mb-0";
      matches.forEach(item => {
        const entry = document.createElement("li");
        entry.textContent = [
          "GL " + (item.gl_number || "-"),
          item.transaction_date || "Date unavailable",
          item.assistance_type || "Assistance record"
        ].join(" | ");
        list.appendChild(entry);
      });

      alert.append(heading, detail, list);
      if (result.has_more_history) {
        const viewAll = document.createElement("button");
        viewAll.type = "button";
        viewAll.className = "btn btn-sm btn-outline-secondary mt-2";
        viewAll.textContent = "View all " + result.history_total + " matching records";
        viewAll.addEventListener("click", () => loadStep1FullHistory(1));
        alert.appendChild(viewAll);
      }
      resultDiv.replaceChildren(alert);
    }
    validateStep1Checklist();
  } catch (error) {
    if (requestId !== beneficiaryEligibilityRequestId) return;
    appState.step1BeneficiaryBlocked = true;
    appState.step1BeneficiaryChecking = false;
    resultDiv.innerHTML = `
      <div class="alert alert-danger" style="border-radius:8px;">
        <strong>Unable to verify beneficiary eligibility</strong>
        <span class="text-xs">${error.message || "Please check your connection and try again."} You cannot continue until the database check succeeds.</span>
      </div>`;
    validateStep1Checklist();
  }
}

function updateStep1Display() {
  const cEl = document.getElementById("step1ClientDisplay");
  const bInput = document.getElementById("step1BeneficiaryInput");
  const previousRecordColumn = document.getElementById("step1PreviousRecordColumn");
  const requirementsColumn = document.getElementById("step1RequirementsColumn");
  const clientName = appState.step1ClientName || "";

  if (cEl) {
    if (clientName) {
      cEl.textContent = clientName;
      cEl.style.color = "";
    } else {
      cEl.textContent = "Not selected";
      cEl.style.color = "#999";
    }
  }
  if (bInput) bInput.value = appState.step1BeneficiaryName || "";

  runStep1BeneficiaryEligibilityCheck();
}

function startNewTxnForClient(clientName, isNew) {
  appState.step1ClientName = clientName;
  appState.step1BeneficiaryName = "";
  appState.prefillFromRecord = null;
  navigateToTab("new-transaction");
  updateStep1Display();
}

function startNewTxnFromPreviousRecord(glNo) {
  const rec = appState.records.find(r => r.glNo === glNo);
  if (!rec) return;

  appState.step1ClientName = rec.client.fullName || `${rec.client.firstName} ${rec.client.lastName}`;
  appState.step1BeneficiaryName = rec.beneficiary && rec.beneficiary.fullName ? rec.beneficiary.fullName : "";
  appState.prefillFromRecord = rec;
  navigateToTab("new-transaction");
  updateStep1Display();
}

function proceedToStep2Form() {
  if (!offlineWriteGuard("Creating a new transaction")) return;
  if (appState.step1BeneficiaryBlocked || appState.step1BeneficiaryChecking) {
    alert(appState.step1BeneficiaryChecking
      ? "Please wait for the beneficiary eligibility check to finish."
      : "This beneficiary has a previous AICS record and is not eligible. Please enter a different beneficiary.");
    validateStep1Checklist();
    return;
  }
  appState.currentTxnStep = 2;
  updateStepperUI(2);

  document.getElementById("txnStep1").classList.add("hidden");
  document.getElementById("txnStep2").classList.remove("hidden");
  document.getElementById("txnStep3").classList.add("hidden");
  document.getElementById("txnStep4").classList.add("hidden");
  document.getElementById("txnStatusBar").classList.remove("hidden");

  // GL number is assigned by the server on save (atomic, race-condition safe)
  document.getElementById("formGlNo").value = "Pending...";

  // Set today's date formatted
  const todayStr = formatDateDisplay(new Date());
  document.getElementById("formTxnDate").value = todayStr;
  document.getElementById("caseStudyDate").value = todayStr;

  // Set default validity date (date + validity days)
  const validUntilDate = new Date();
  validUntilDate.setDate(validUntilDate.getDate() + (appState.rules.glValidityDays || 9));
  document.getElementById("astValidUntil").value = formatDateDisplay(validUntilDate);

  // Read current beneficiary input from Step 1
  const bInput = document.getElementById("step1BeneficiaryInput");
  const bName = (bInput ? bInput.value.trim() : "") || appState.step1BeneficiaryName || "";
  appState.step1BeneficiaryName = bName;

  // Check if returning client prefill is available
  if (appState.prefillFromRecord) {
    applyReturningClientDetails(appState.prefillFromRecord);
  } else {
    // Populate client name from step 1
    const step1Name = appState.step1ClientName || (document.getElementById("step1ClientDisplay") ? document.getElementById("step1ClientDisplay").textContent.trim() : "");
    if (step1Name) {
      const parts = step1Name.split(" ");
      if (parts.length > 1) {
        document.getElementById("cFirstName").value = parts[0];
        document.getElementById("cLastName").value = parts.slice(1).join(" ");
      } else {
        document.getElementById("cLastName").value = step1Name;
      }
    }

    if (bName) {
      const cleanBName = bName.replace(/\s*\(.*?\)\s*/g, "").trim();
      const bParts = cleanBName.split(" ");
      if (bParts.length > 1) {
        document.getElementById("bFirstName").value = bParts[0];
        document.getElementById("bLastName").value = bParts.slice(1).join(" ");
      } else {
        document.getElementById("bLastName").value = cleanBName;
      }
      const relMatch = bName.match(/\((.*?)\)/);
      if (relMatch) {
        document.getElementById("cRelBeneficiary").value = capitalizeWords(relMatch[1]);
      }
      const chkSame = document.getElementById("chkSameAsClient");
      if (chkSame) {
        chkSame.checked = false;
        toggleSameAsClient(false);
      }
    } else {
      // If beneficiary left blank, default to same as client
      const chkSame = document.getElementById("chkSameAsClient");
      if (chkSame) {
        chkSame.checked = true;
        toggleSameAsClient(true);
      }
    }

    const cDisplay = appState.step1ClientName || "";
}

  // Auto-select the assistance type chosen in Step 1 and fill defaults
  const step1Ast = appState.step1AssistanceType;
  if (step1Ast) {
    const matchingRadio = document.querySelector(`input[name="finAssistance"][value="${step1Ast}"]`);
    if (matchingRadio) {
      matchingRadio.checked = true;
      autoFillAssistanceDefaults(step1Ast);
    }
  }

  // Pre-seed family table
  updateFamilyTableFromClient();
  onAmountChanged(document.getElementById("astAmount").value);
  updateLivePreview();
  validateFormFieldsRemaining();
}

function generateNextGlNumber() {
  const curYear = new Date().getFullYear();
  let maxSeq = 993;
  appState.records.forEach(r => {
    if (r.glNo && r.glNo.includes("-")) {
      const parts = r.glNo.split("-");
      const seq = parseInt(parts[0], 10);
      if (!isNaN(seq) && seq > maxSeq) {
        maxSeq = seq;
      }
    }
  });
  return `${String(maxSeq + 1).padStart(4, "0")}-${curYear}`;
}

function applyReturningClientDetails(rec) {
  document.querySelector("input[name='clientType'][value='Returning']").checked = true;
  document.getElementById("cLastName").value = rec.client.lastName || "";
  document.getElementById("cFirstName").value = rec.client.firstName || "";
  document.getElementById("cMiddleName").value = rec.client.middleName || "";
  document.getElementById("cExt").value = rec.client.ext || "";
  document.getElementById("cStreet").value = rec.client.street || "";
  document.getElementById("cBarangay").value = rec.client.barangay || "";
  document.getElementById("cMobile").value = rec.client.mobile || "";
  document.getElementById("cBirthdate").value = rec.client.birthdate || "";
  document.getElementById("cAge").value = rec.client.age || "";
  document.getElementById("cGender").value = rec.client.gender || "";
  document.getElementById("cCivilStatus").value = rec.client.civilStatus || "";
  document.getElementById("cOccupation").value = rec.client.occupation || "";
  document.getElementById("cSalary").value = rec.client.salary || "";

  if (rec.beneficiary) {
    document.getElementById("bLastName").value = rec.beneficiary.lastName || "";
    document.getElementById("bFirstName").value = rec.beneficiary.firstName || "";
    document.getElementById("bMiddleName").value = rec.beneficiary.middleName || "";
    document.getElementById("bExt").value = rec.beneficiary.ext || "";
    document.getElementById("bStreet").value = rec.beneficiary.street || "";
    document.getElementById("bBarangay").value = rec.beneficiary.barangay || "";
    document.getElementById("bBirthdate").value = rec.beneficiary.birthdate || "";
    document.getElementById("bAge").value = rec.beneficiary.age || "";
    document.getElementById("bGender").value = rec.beneficiary.gender || "";
    document.getElementById("bCivilStatus").value = rec.beneficiary.civilStatus || "";
    document.getElementById("bRelationship").value = rec.beneficiary.relationship || "Mother";
  }
}

// ==========================================================================
// 8. STEP 2: FORM INTERACTIONS & LIVE DOCUMENT SYNCHRONIZATION
// ==========================================================================

function updateStepperUI(activeStep) {
  for (let i = 1; i <= 4; i++) {
    const indicator = document.getElementById(`stepIndicator${i}`);
    if (indicator) {
      indicator.classList.toggle("active", i === activeStep);
      indicator.classList.toggle("done", i < activeStep);
    }
    if (i < 4) {
      const conn = document.getElementById(`connector${i}`);
      if (conn) {
        conn.classList.toggle("done", i < activeStep);
      }
    }
  }

  const breadcrumbLabels = ["Check record", "Fill in form", "Review and save", "Print"];
  document.getElementById("currentStepBreadcrumb").textContent = breadcrumbLabels[activeStep - 1];
}

function calculateClientAge() {
  const bdateStr = document.getElementById("cBirthdate").value;
  if (!bdateStr) return;
  const bdate = new Date(bdateStr);
  const age = calculateAgeFromBirthdate(bdate);
  document.getElementById("cAge").value = age;
}

function calculateBeneficiaryAge() {
  const bdateStr = document.getElementById("bBirthdate").value;
  if (!bdateStr) return;
  const bdate = new Date(bdateStr);
  const age = calculateAgeFromBirthdate(bdate);
  document.getElementById("bAge").value = age;
}

function calculateAgeFromBirthdate(bdate) {
  const diff = Date.now() - bdate.getTime();
  const ageDate = new Date(diff);
  return Math.abs(ageDate.getUTCFullYear() - 1970);
}

function validateMobileField(input) {
  const val = input.value.replace(/\s+/g, "");
  const err = document.getElementById("cMobileError");
  if (val.length > 0 && !val.startsWith("09")) {
    err.classList.remove("hidden");
  } else {
    err.classList.add("hidden");
  }
}

function onClientNameOrFieldChange() {
  updateLivePreview();
  updateFamilyTableFromClient();
  validateFormFieldsRemaining();
}

function onClientAddressChange() {
  updateLivePreview();
  validateFormFieldsRemaining();
}

function onBeneficiaryChange() {
  updateLivePreview();
  validateFormFieldsRemaining();
}

function onRelationshipChange() {
  const rel = document.getElementById("bRelationship").value;
  document.getElementById("caseRelToBen").value = rel;
}

function toggleBeneficiarySameAsClient(isSame) {
  const lockedAlert = document.getElementById("beneficiaryLockedAlert");
  const bFieldsGroup = document.getElementById("beneficiaryFieldsGroup");

  if (isSame) {
    lockedAlert.classList.remove("hidden");

    // Copy client values to beneficiary
    document.getElementById("bLastName").value = document.getElementById("cLastName").value;
    document.getElementById("bFirstName").value = document.getElementById("cFirstName").value;
    document.getElementById("bMiddleName").value = document.getElementById("cMiddleName").value;
    document.getElementById("bExt").value = document.getElementById("cExt").value;
    document.getElementById("bStreet").value = document.getElementById("cStreet").value;
    document.getElementById("bBarangay").value = document.getElementById("cBarangay").value;
    document.getElementById("bMobile").value = document.getElementById("cMobile").value;
    document.getElementById("bBirthdate").value = document.getElementById("cBirthdate").value;
    document.getElementById("bAge").value = document.getElementById("cAge").value;
    document.getElementById("bGender").value = document.getElementById("cGender").value;
    document.getElementById("bCivilStatus").value = document.getElementById("cCivilStatus").value;
    document.getElementById("bOccupation").value = document.getElementById("cOccupation").value;
    document.getElementById("bSalary").value = document.getElementById("cSalary").value;
    document.getElementById("bRelationship").value = "Self";

    // Lock inputs
    bFieldsGroup.querySelectorAll("input, select").forEach(el => {
      el.setAttribute("readonly", true);
      if (el.tagName === "SELECT") el.disabled = true;
    });
  } else {
    lockedAlert.classList.add("hidden");
    bFieldsGroup.querySelectorAll("input, select").forEach(el => {
      el.removeAttribute("readonly");
      if (el.tagName === "SELECT") el.disabled = false;
    });
  }
  updateLivePreview();
}

function toggleOtherCategoryInput(checked) {
  document.getElementById("otherCategoryWrap").classList.toggle("hidden", !checked);
}

const ASSISTANCE_DEFAULTS = {
  "Medical":       { provided: "Medical assistance",                              purpose: "Medicine / Hospital bill" },
  "Burial":        { provided: "Burial assistance",                               purpose: "Funeral / Burial expenses" },
  "Fire incident": { provided: "Financial assistance for fire incident victim",   purpose: "Food / Clothing / Basic necessities" },
  "Transportation":{ provided: "Transportation assistance",                       purpose: "Transportation fare" },
  "Food":          { provided: "Food assistance",                                 purpose: "Food / Basic necessities" },
  "Cash":          { provided: "Financial assistance for other support services", purpose: "Other support services" }
};

function autoFillAssistanceDefaults(value) {
  const defaults = ASSISTANCE_DEFAULTS[value];
  if (!defaults) return;
  const provided = document.getElementById("astProvided");
  const purpose  = document.getElementById("astPurpose");
  if (provided) provided.value = defaults.provided;
  if (purpose)  purpose.value  = defaults.purpose;
}

function onAmountChanged(val) {
  const amountInput = document.getElementById("astAmount");
  const amount = Number(val);
  if (Number.isFinite(amount) && amount > 2000) {
    amountInput.value = "2000";
    val = "2000";
  }
  const words = numberToWords(val);
  document.getElementById("astAmountWords").value = words;
}

function updateCaseSummaryCount(textarea) {
  document.getElementById("caseSummaryCharCount").textContent = `${textarea.value.length} of 600 characters`;
}

function onPartnerAgencySelected() {
  const agSelect = document.getElementById("astPartnerAgency");
  const selName = agSelect.value;
  const found = appState.agencies.find(a => a.name === selName);
  if (found) {
    document.getElementById("astContactNumber").value = found.contact || "";
  }
}

// Family table dynamic row methods
function updateFamilyTableFromClient() {
  const cLast = document.getElementById("cLastName").value;
  const cFirst = document.getElementById("cFirstName").value;
  const cMid = document.getElementById("cMiddleName").value;
  const clientFullName = `${cFirst} ${cMid ? cMid + " " : ""}${cLast}`.trim() || "Client";

  const clientAge = document.getElementById("cAge").value || "46";
  const clientCivil = document.getElementById("cCivilStatus").value || "Married";
  const clientOcc = document.getElementById("cOccupation").value || "Vendor";
  const clientSal = document.getElementById("cSalary").value || "8,000.00";

  const tbody = document.getElementById("familyTableBody");
  if (!tbody) return;

  if (tbody.children.length === 0) {
    // Build the first row with DOM APIs so stored names/values cannot become HTML.
    const row = document.createElement("tr");
    row.className = "family-client-row";
    const fields = [
      { value: clientFullName, type: "text" },
      { value: "Client", type: "text", readOnly: true },
      { value: clientAge, type: "number" },
      { value: clientCivil, type: "text" },
      { value: clientOcc, type: "text" },
      { value: clientSal, type: "text" }
    ];

    fields.forEach(config => {
      const cell = document.createElement("td");
      const input = document.createElement("input");
      input.type = config.type;
      input.className = "form-control form-control-sm";
      input.value = config.value;
      if (config.readOnly) {
        input.readOnly = true;
      } else {
        input.addEventListener("input", updateLivePreview);
      }
      cell.appendChild(input);
      row.appendChild(cell);
    });

    const actionCell = document.createElement("td");
    actionCell.className = "text-center text-muted";
    actionCell.textContent = "—";
    row.appendChild(actionCell);
    tbody.appendChild(row);
  } else {
    // Update first row client name
    const firstRowInputs = tbody.children[0].querySelectorAll("input");
    if (firstRowInputs.length > 0) {
      firstRowInputs[0].value = clientFullName;
      if (clientAge) firstRowInputs[2].value = clientAge;
      if (clientCivil) firstRowInputs[3].value = clientCivil;
      if (clientOcc) firstRowInputs[4].value = clientOcc;
      if (clientSal) firstRowInputs[5].value = clientSal;
    }
  }
}

function addFamilyRow() {
  const tbody = document.getElementById("familyTableBody");
  const tr = document.createElement("tr");
  tr.innerHTML = `
    <td><input type="text" class="form-control form-control-sm" placeholder="Full name" oninput="updateLivePreview()"></td>
    <td><input type="text" class="form-control form-control-sm" placeholder="Relationship" oninput="updateLivePreview()"></td>
    <td><input type="number" class="form-control form-control-sm" placeholder="Age" oninput="updateLivePreview()"></td>
    <td><input type="text" class="form-control form-control-sm" placeholder="Civil status" oninput="updateLivePreview()"></td>
    <td><input type="text" class="form-control form-control-sm" placeholder="Occupation" oninput="updateLivePreview()"></td>
    <td><input type="text" class="form-control form-control-sm" placeholder="Salary" oninput="updateLivePreview()"></td>
    <td class="text-center"><button type="button" class="btn btn-sm text-danger" onclick="removeFamilyRow(this)">&times;</button></td>
  `;
  tbody.appendChild(tr);
  updateLivePreview();
}

function removeFamilyRow(btn) {
  const row = btn.closest("tr");
  if (row) {
    row.remove();
    updateLivePreview();
  }
}

// ==========================================================================
// 9. REAL-TIME SYNCHRONOUS DOCUMENT PREVIEW (GIS, COE, GL)
// ==========================================================================

function switchPreviewDocTab(docKey) {
  appState.activePreviewDoc = docKey;
  document.querySelectorAll(".preview-tab-btn").forEach(btn => {
    btn.classList.toggle("active", btn.getAttribute("data-doc") === docKey);
  });

  document.getElementById("previewDocGis").classList.toggle("hidden", docKey !== "gis");
  document.getElementById("previewDocCoe").classList.toggle("hidden", docKey !== "coe");
  document.getElementById("previewDocGl").classList.toggle("hidden", docKey !== "gl");
}

function updateLivePreview() {
  // 1. Transaction details
  const glNo = document.getElementById("formGlNo").value || "0993-2026";
  const txnDate = document.getElementById("formTxnDate").value || formatDateDisplay(new Date());
  const isNew = document.querySelector("input[name='clientType'][value='New']").checked;
  const isWalkin = document.querySelector("input[name='sourceType'][value='Walk-in']").checked;

  // 2. Client
  const cLast = document.getElementById("cLastName").value;
  const cFirst = document.getElementById("cFirstName").value;
  const cMid = document.getElementById("cMiddleName").value;
  const cExt = document.getElementById("cExt").value;
  const cFullName = `${cFirst} ${cMid ? cMid + " " : ""}${cLast} ${cExt}`.trim();
  const cStreet = document.getElementById("cStreet").value;
  const cBarangay = document.getElementById("cBarangay").value;
  const cMobile = document.getElementById("cMobile").value;
  const cBdate = document.getElementById("cBirthdate").value;
  const cAge = document.getElementById("cAge").value;
  const cGender = document.getElementById("cGender").value;
  const cCivil = document.getElementById("cCivilStatus").value;
  const cOcc = document.getElementById("cOccupation").value;
  const cSal = document.getElementById("cSalary").value;

  // 3. Beneficiary
  const bLast = document.getElementById("bLastName").value;
  const bFirst = document.getElementById("bFirstName").value;
  const bMid = document.getElementById("bMiddleName").value;
  const bExt = document.getElementById("bExt").value;
  const bFullName = `${bFirst} ${bMid ? bMid + " " : ""}${bLast} ${bExt}`.trim();
  const bStreet = document.getElementById("bStreet").value;
  const bBarangay = document.getElementById("bBarangay").value;
  const bBdate = document.getElementById("bBirthdate").value;
  const bAge = document.getElementById("bAge").value;
  const bGender = document.getElementById("bGender").value;
  const bCivil = document.getElementById("bCivilStatus").value;
  const bOcc = document.getElementById("bOccupation").value;
  const bSal = document.getElementById("bSalary").value;
  const bRel = document.getElementById("bRelationship").value || "Mother";

  // 4. Category
  const sectors = Array.from(document.querySelectorAll("input[name='targetSector']:checked")).map(cb => cb.value);
  const targetSectorText = sectors.join(", ") || "FHONA";
  const subCats = Array.from(document.querySelectorAll("input[name='subCategory']:checked")).map(cb => cb.value);
  const subCatText = subCats.join(", ") || "--";

  // 6. Assistance
  const astName = document.getElementById("astProvided").value.toUpperCase();
  const astAmt = parseFloat(document.getElementById("astAmount").value) || 0;
  const astWords = document.getElementById("astAmountWords").value.toUpperCase();
  const astFund = document.getElementById("astFundSource").value;
  const astPurpose = document.getElementById("astPurpose").value.toUpperCase();
  const partnerAgency = document.getElementById("astPartnerAgency").value || "BUPHARCO PHARMACY";
  const caseSummary = document.getElementById("caseSummaryText").value;

  // Signatures
  const interviewedBy = document.getElementById("signInterviewedBy").value;
  const notedBy = document.getElementById("signNotedBy").value;
  const mayor = document.getElementById("signMayor").value;

  // Bind to Section 7 & 8 mirrors
  document.getElementById("caseRepName").value = cFullName;
  document.getElementById("caseRelToBen").value = bRel;
  document.getElementById("signClientGis").value = cFullName;

  // ========== A. UPDATE GIS DOCUMENT ==========
  setText("prevGisGlNo", glNo);
  setText("prevGisDate", txnDate);
  document.getElementById("prevGisCheckNew").innerHTML = isNew ? "&#9746; New" : "&#9744; New";
  document.getElementById("prevGisCheckReturning").innerHTML = !isNew ? "&#9746; Returning" : "&#9744; Returning";
  document.getElementById("prevGisCheckWalkin").innerHTML = isWalkin ? "&#9746; Walk-in" : "&#9744; Walk-in";
  document.getElementById("prevGisCheckReferral").innerHTML = !isWalkin ? "&#9746; Referral" : "&#9744; Referral";

  setText("prevGisCLast", cLast);
  setText("prevGisCFirst", cFirst);
  setText("prevGisCMiddle", cMid);
  setText("prevGisCExt", cExt);
  setText("prevGisCStreet", cStreet);
  setText("prevGisCBarangay", cBarangay);
  setText("prevGisCMobile", cMobile);
  setText("prevGisCBirthdate", formatDateDisplay(cBdate));
  setText("prevGisCAge", cAge);
  setText("prevGisCGender", cGender);
  setText("prevGisCCivilStatus", cCivil);
  setText("prevGisCOccupation", cOcc);
  setText("prevGisCSalary", cSal ? formatCurrency(cSal) : "0.00");

  setText("prevGisBLast", bLast);
  setText("prevGisBFirst", bFirst);
  setText("prevGisBMiddle", bMid);
  setText("prevGisBExt", bExt);
  setText("prevGisBStreet", bStreet);
  setText("prevGisBBarangay", bBarangay);
  setText("prevGisBBirthdate", formatDateDisplay(bBdate));
  setText("prevGisBAge", bAge);
  setText("prevGisBGender", bGender);
  setText("prevGisBCivilStatus", bCivil);
  setText("prevGisBOccupation", bOcc || "None");
  setText("prevGisBSalary", bSal ? formatCurrency(bSal) : "0.00");
  setText("prevGisRelToBen", bRel);

  setText("prevGisTargetSector", targetSectorText);
  setText("prevGisSubCategory", subCatText);
  setText("prevGisCaseSummary", caseSummary);

  setText("prevGisAstName", astName);
  setText("prevGisAstAmt", formatCurrency(astAmt));
  setText("prevGisAstFund", astFund);

  setText("prevGisSigClient", cFullName);
  setText("prevGisSigWorker", interviewedBy);
  setText("prevGisSigNoted", notedBy);

  // Sync Family table rows to GIS preview table
  syncFamilyTableToGisDoc();

  // ========== B. UPDATE COE DOCUMENT ==========
  setText("prevCoeGlNo", glNo);
  setText("prevCoeDate", txnDate);
  document.getElementById("prevCoeCheckNew").innerHTML = isNew ? "&#9746; New" : "&#9744; New";
  document.getElementById("prevCoeCheckReturning").innerHTML = !isNew ? "&#9746; Returning" : "&#9744; Returning";
  document.getElementById("prevCoeCheckWalkin").innerHTML = isWalkin ? "&#9746; Walk-in" : "&#9744; Walk-in";
  document.getElementById("prevCoeCheckReferral").innerHTML = !isWalkin ? "&#9746; Referral" : "&#9744; Referral";

  setText("prevCoeBenName", bFullName || cFullName);
  setText("prevCoeBenGender", bGender || cGender);
  setText("prevCoeBenAge", bAge || cAge);
  setText("prevCoeBenAddress", `${bStreet || cStreet}, ${bBarangay || cBarangay}, Maramag, Bukidnon`);
  setText("prevCoeRel", bRel);
  setText("prevCoeRepName", cFullName);
  setText("prevCoeCaseDate", txnDate);

  setText("prevCoeAstType", astName);
  setText("prevCoeAmtWords", astWords);
  setText("prevCoeAmtNum", formatCurrency(astAmt));
  setText("prevCoePurpose", astPurpose);

  setText("prevCoeSigConforme", cFullName);
  setText("prevCoeSigPrep", interviewedBy);
  setText("prevCoeSigAppr", notedBy);

  // ========== C. UPDATE GUARANTEE LETTER ==========
  setText("prevGlNumber", glNo);
  setText("prevGlDate", txnDate);
  setText("prevGlAgency", partnerAgency.toUpperCase());

  const foundAg = appState.agencies.find(a => a.name === partnerAgency);
  setText("prevGlAgencyAddr", foundAg ? foundAg.address.toUpperCase() : "MARAMAG, BUKIDNON");

  setText("prevGlClientName", cFullName.toUpperCase());
  setText("prevGlClientLoc", `${cBarangay.toUpperCase()}, MARAMAG, BUKIDNON`);
  setText("prevGlBenRel", `${bRel.toUpperCase()} ${bFullName.toUpperCase()}`);
  setText("prevGlAmtWords", astWords);
  setText("prevGlAmtNum", formatCurrency(astAmt));
  setText("prevGlContactNumber", foundAg ? foundAg.contact : "0917-123-4567");

  setText("prevGlWorker", interviewedBy);
  setText("prevGlOfficer", notedBy);
  setText("prevGlMayor", mayor);
}

function syncFamilyTableToGisDoc() {
  const tbody = document.getElementById("familyTableBody");
  const gisTbody = document.getElementById("prevGisFamilyTbody");
  if (!tbody || !gisTbody) return;

  const rows = Array.from(tbody.children);
  gisTbody.innerHTML = rows.map(r => {
    const inputs = r.querySelectorAll("input");
    return `
      <tr>
        <td class="highlight-val">${inputs[0]?.value || ""}</td>
        <td class="highlight-val">${inputs[1]?.value || ""}</td>
        <td class="highlight-val">${inputs[2]?.value || ""}</td>
        <td class="highlight-val">${inputs[3]?.value || ""}</td>
        <td class="highlight-val">${inputs[4]?.value || ""}</td>
        <td class="highlight-val">${inputs[5]?.value || ""}</td>
      </tr>
    `;
  }).join("");
}

function setText(elementId, val) {
  const el = document.getElementById(elementId);
  if (el) el.textContent = val || "";
}

function isFormFieldRequired(field, labelText, optionalFieldIds = new Set(), labelHasAsterisk = false) {
  if (!field || optionalFieldIds.has(field.id)) return false;
  return field.required === true || labelHasAsterisk || String(labelText || "").includes("*");
}

function validateFormFieldsRemaining(options = {}) {
  const stepPanel = document.getElementById("txnStep2");
  const attempted = options.showErrors === true
    || (stepPanel && stepPanel.dataset.validationAttempted === "true");
  const missing = [];
  const formRoot = document.getElementById("formInputsScrollArea") || stepPanel;

  if (!formRoot) return missing;

  const isVisibleField = (field) => {
    if (field.disabled || field.readOnly || field.type === "hidden") return false;
    if (field.closest(".hidden, [hidden]")) return false;
    return true;
  };

  const labelFor = (field) => {
    const label = field.id
      ? formRoot.querySelector(`label[for="${field.id}"]`)
      : null;
    if (label) return label.textContent.replace("*", "").trim();
    const wrappingLabel = field.closest("label");
    if (wrappingLabel) return wrappingLabel.textContent.trim();
    return field.placeholder || field.name || field.id || "Required field";
  };

  const optionalFieldIds = new Set(["cMiddleName", "cExt", "bMiddleName", "bExt"]);
  const controls = Array.from(formRoot.querySelectorAll("input, select, textarea"))
    .filter(isVisibleField)
    .filter(field => {
      // Preserve group controls for their dedicated validators. Other fields are
      // required only when the markup says required or the associated label has *.
      if (["checkbox", "radio"].includes(field.type)) return true;
      const label = field.id ? formRoot.querySelector(`label[for="${field.id}"]`) : field.closest("label");
      const labelHasAsterisk = !!label && label.textContent.includes("*");
      return isFormFieldRequired(field, labelFor(field), optionalFieldIds, labelHasAsterisk);
    });

  // Validate text/date/number/select/textarea values only when marked required.
  controls.filter(field => !["checkbox", "radio", "button", "submit", "reset", "file"].includes(field.type))
    .forEach(field => {
      const value = String(field.value || "").trim();
      if (!value) {
        missing.push({
          id: field.id,
          label: labelFor(field),
          field
        });
      }
      if (attempted) {
        const group = field.closest(".form-group") || field.parentElement;
        let error = group ? group.querySelector(`.field-validation-error[data-for="${field.id}"]`) : null;
        field.classList.toggle("is-invalid", !value);
        field.setAttribute("aria-invalid", !value ? "true" : "false");
        if (!value && group) {
          if (!error) {
            error = document.createElement("small");
            error.className = "field-validation-error";
            error.dataset.for = field.id;
            error.setAttribute("role", "alert");
            group.appendChild(error);
          }
          error.textContent = "This field is required";
        } else if (error) {
          error.remove();
        }
      }
    });

  // Each radio group must have one selected option.
  const radioNames = [...new Set(controls.filter(f => f.type === "radio").map(f => f.name))];
  radioNames.forEach(name => {
    const group = controls.filter(f => f.type === "radio" && f.name === name);
    if (group.length && !group.some(f => f.checked)) {
      missing.push({ id: group[0].id, label: labelFor(group[0]), field: group[0] });
    }
  });

  // At least one target sector must be selected. Financial assistance is a required
  // radio group and is validated together with the other radio groups above.
  const targetSectors = controls.filter(f => f.type === "checkbox" && f.name === "targetSector");
  if (targetSectors.length && !targetSectors.some(f => f.checked)) {
    missing.push({ id: targetSectors[0].id, label: "Category > Target sector", field: targetSectors[0] });
  }
  const summary = document.getElementById("formValidationSummary");
  const summaryTitle = document.getElementById("formValidationTitle");
  const summaryDetail = document.getElementById("formValidationDetail");
  const msgSpan = document.getElementById("requiredFieldsCountMsg");
  const statusIcon = document.querySelector(".form-bottom-bar .status-icon-info, .form-bottom-bar .status-icon-error");
  const reviewBtn = document.getElementById("btnReviewAndSave");

  if (summary) {
    summary.classList.toggle("hidden", !attempted || missing.length === 0);
    if (attempted && missing.length > 0) {
      summaryTitle.textContent = `${missing.length} required field${missing.length === 1 ? " is" : "s are"} missing`;
      summaryDetail.textContent = `${missing[0].label.replace(" > ", " › ")} needs a value. Complete all required fields before reviewing and saving.`;
    }
  }
  if (msgSpan) {
    if (missing.length === 0) {
      msgSpan.textContent = "All required fields are complete.";
      msgSpan.classList.remove("validation-error-text");
    } else if (attempted) {
      msgSpan.textContent = `${missing.length} required field${missing.length === 1 ? "" : "s"} missing: ${missing[0].label.replace(" > ", " › ")}`;
      msgSpan.classList.add("validation-error-text");
    } else {
      msgSpan.textContent = `${missing.length} required field${missing.length === 1 ? "" : "s"} left to complete`;
      msgSpan.classList.remove("validation-error-text");
    }
  }
  if (statusIcon) {
    statusIcon.classList.toggle("status-icon-error", attempted && missing.length > 0);
    statusIcon.classList.toggle("status-icon-info", !(attempted && missing.length > 0));
    statusIcon.textContent = attempted && missing.length > 0 ? "!" : "i";
  }
  if (reviewBtn) reviewBtn.disabled = missing.length > 0;

  ["sec1","sec2","sec3","sec4","sec5","sec6","sec7","sec8"].forEach(secId => {
    const section = document.getElementById(secId);
    if (!section) return;
    const sectionMissing = missing.filter(item => section.contains(item.field));
    updateSectionStatus(secId, sectionMissing.length === 0);
    const status = document.getElementById(`stat-${secId}`);
    if (status && sectionMissing.length > 0) {
      status.textContent = `${sectionMissing.length} missing`;
      status.className = "sec-status text-danger";
    }
  });

  return missing;
}

function updateSectionStatus(secId, isDone) {
  const statEl = document.getElementById(`stat-${secId}`);
  if (statEl) {
    if (isDone) {
      statEl.textContent = "Done";
      statEl.className = "sec-status text-success";
    } else {
      statEl.textContent = "In progress";
      statEl.className = "sec-status text-primary";
    }
  }
}

function setTransactionPreviewVisible(isVisible) {
  const workspace = document.getElementById("transactionWorkspace");
  const toggle = document.getElementById("transactionPreviewToggle");
  if (!workspace || !toggle) return;

  workspace.classList.toggle("preview-collapsed", !isVisible);
  toggle.textContent = isVisible ? "Hide preview" : "Show preview";
  toggle.setAttribute("aria-expanded", String(isVisible));
}

function toggleTransactionPreview() {
  const workspace = document.getElementById("transactionWorkspace");
  if (!workspace) return;

  const isCurrentlyVisible = !workspace.classList.contains("preview-collapsed");
  appState.transactionPreviewUserAdjusted = true;
  setTransactionPreviewVisible(!isCurrentlyVisible);
}

function handleTransactionWorkspaceResize() {
  if (appState.transactionPreviewUserAdjusted) return;
  setTransactionPreviewVisible(window.innerWidth > 1100);
}

function initTransactionWorkspace() {
  appState.transactionPreviewUserAdjusted = false;
  setTransactionPreviewVisible(window.innerWidth > 1100);
  window.addEventListener("resize", handleTransactionWorkspaceResize, { passive: true });
  window.addEventListener("scroll", updateActiveFormSection, { passive: true });
}

function setActiveFormSection(sectionId) {
  document.querySelectorAll(".section-tracker-item").forEach(item => {
    const isActive = item.dataset.sec === sectionId;
    item.classList.toggle("active", isActive);

    const button = item.querySelector("button");
    if (!button) return;
    if (isActive) button.setAttribute("aria-current", "step");
    else button.removeAttribute("aria-current");
  });
}

function updateActiveFormSection() {
  const stepPanel = document.getElementById("txnStep2");
  if (stepPanel && stepPanel.classList.contains("hidden")) return;

  const sections = ["sec1", "sec2", "sec3", "sec4", "sec5", "sec6", "sec7", "sec8"];
  const readingLine = 140;
  let activeSection = sections[0];

  for (const sectionId of sections) {
    const section = document.getElementById(sectionId);
    if (!section) continue;

    if (section.getBoundingClientRect().top <= readingLine) {
      activeSection = sectionId;
    } else {
      break;
    }
  }

  const documentRoot = document.documentElement;
  const isAtDocumentEnd = window.scrollY + window.innerHeight >= documentRoot.scrollHeight - 2;
  if (isAtDocumentEnd) activeSection = sections[sections.length - 1];

  setActiveFormSection(activeSection);
}

function scrollToSection(secId) {
  const el = document.getElementById(secId);
  if (el) {
    const prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    el.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "start" });
    setActiveFormSection(secId);
  }
}

// ==========================================================================
// 10. STEP 3: REVIEW & STEP 4: SAVE RECORD AND PRINT STATION
// ==========================================================================

function proceedToStep3Review() {
  // Show inline validation and keep the user on the form until required fields are complete.
  const stepPanel = document.getElementById("txnStep2");
  if (stepPanel) stepPanel.dataset.validationAttempted = "true";
  const missing = validateFormFieldsRemaining({ showErrors: true });

  if (missing.length > 0) {
    scrollToSection("sec2");
    const firstMissing = document.getElementById(missing[0].id);
    if (firstMissing) {
      firstMissing.focus({ preventScroll: true });
      firstMissing.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    return;
  }

  const cLast = document.getElementById("cLastName").value.trim();
  const cFirst = document.getElementById("cFirstName").value.trim();

  appState.currentTxnStep = 3;
  updateStepperUI(3);

  document.getElementById("txnStep2").classList.add("hidden");
  document.getElementById("txnStep3").classList.remove("hidden");

  const previousCheck = document.getElementById("reviewPreviousRecordCheck");
  const previousIcon = document.getElementById("reviewPreviousRecordIcon");
  const previousStatus = document.getElementById("reviewPreviousRecordStatus");
  const identityStatus = appState.step1IdentityStatus || "no_match";
  if (previousCheck && previousStatus) {
    if (["verification_required", "possible_name_match"].includes(identityStatus)) {
      previousCheck.className = "checklist-status-item alert alert-warning";
      if (previousIcon) previousIcon.textContent = "!";
      previousStatus.textContent = "Possible name match found (" + appState.step1PreviousRecordCount + "). Verify date of birth; both requester and beneficiary are checked again when saving.";
    } else if (identityStatus === "confirmed_match") {
      previousCheck.className = "checklist-status-item alert alert-success";
      if (previousIcon) previousIcon.textContent = "✓";
      previousStatus.textContent = "Verified previous record found. The configured waiting-period result will be enforced when saving.";
    } else {
      previousCheck.className = "checklist-status-item success";
      if (previousIcon) previousIcon.textContent = "✓";
      previousStatus.textContent = "No beneficiary name match found. Both requester and beneficiary will be checked again when saving.";
    }
  }

  // Check for duplicate name warnings (Wireframe 5b)
  const full = `${cFirst} ${cLast}`.toLowerCase();
  const dup = appState.records.find(r => (r.client.fullName || "").toLowerCase() === full);
  document.getElementById("reviewDuplicateWarning").classList.toggle("hidden", !dup);

  // Render document preview inside review container
  renderReviewDocTab("gis");
}

function backToStep2Form() {
  appState.currentTxnStep = 2;
  updateStepperUI(2);
  document.getElementById("txnStep3").classList.add("hidden");
  document.getElementById("txnStep2").classList.remove("hidden");
}

function switchReviewDocTab(docKey) {
  appState.activeReviewDoc = docKey;
  document.querySelectorAll("[data-reviewdoc]").forEach(b => {
    b.classList.toggle("active", b.getAttribute("data-reviewdoc") === docKey);
  });
  renderReviewDocTab(docKey);
}

function renderReviewDocTab(docKey) {
  const container = document.getElementById("reviewDocPreviewContainer");
  const sourceDoc = docKey === "gis" ? document.getElementById("previewDocGis")
    : docKey === "coe" ? document.getElementById("previewDocCoe")
      : document.getElementById("previewDocGl");

  if (sourceDoc) {
    container.innerHTML = sourceDoc.outerHTML;
    const inner = container.querySelector(".document-sheet-view");
    if (inner) inner.classList.remove("hidden");
  }
}

function executeSaveRecord() {
  // Construct new record object from form inputs
  const glNo = document.getElementById("formGlNo").value;
  const now = new Date();
  const dateFormatted = formatDateDisplay(now);

  const cLast = document.getElementById("cLastName").value.trim();
  const cFirst = document.getElementById("cFirstName").value.trim();
  const cMid = document.getElementById("cMiddleName").value.trim();
  const cExt = document.getElementById("cExt").value.trim();
  const cFullName = `${cFirst} ${cMid ? cMid + " " : ""}${cLast} ${cExt}`.trim();

  const bLast = document.getElementById("bLastName").value.trim() || cLast;
  const bFirst = document.getElementById("bFirstName").value.trim() || cFirst;
  const bMid = document.getElementById("bMiddleName").value.trim() || cMid;
  const bExt = document.getElementById("bExt").value.trim() || cExt;
  const bFullName = `${bFirst} ${bMid ? bMid + " " : ""}${bLast} ${bExt}`.trim();

  const astAmt = parseFloat(document.getElementById("astAmount").value) || 0;
  const partnerAgency = document.getElementById("astPartnerAgency").value;

  const newRecord = {
    glNo: glNo,
    date: dateFormatted,
    dateIso: now.toISOString().split("T")[0],
    year: String(now.getFullYear()),
    client: {
      lastName: cLast,
      firstName: cFirst,
      middleName: cMid,
      ext: cExt,
      fullName: cFullName,
      street: document.getElementById("cStreet").value,
      barangay: document.getElementById("cBarangay").value,
      city: "Maramag",
      province: "Bukidnon",
      region: "10",
      mobile: document.getElementById("cMobile").value,
      birthdate: document.getElementById("cBirthdate").value,
      age: parseInt(document.getElementById("cAge").value, 10) || 0,
      gender: document.getElementById("cGender").value,
      civilStatus: document.getElementById("cCivilStatus").value,
      occupation: document.getElementById("cOccupation").value,
      salary: parseFloat(document.getElementById("cSalary").value) || 0
    },
    beneficiary: {
      lastName: bLast,
      firstName: bFirst,
      middleName: bMid,
      ext: bExt,
      fullName: bFullName,
      street: document.getElementById("bStreet").value || document.getElementById("cStreet").value,
      barangay: document.getElementById("bBarangay").value || document.getElementById("cBarangay").value,
      city: "Maramag",
      province: "Bukidnon",
      region: "10",
      birthdate: document.getElementById("bBirthdate").value || document.getElementById("cBirthdate").value,
      age: parseInt(document.getElementById("bAge").value, 10) || 0,
      gender: document.getElementById("bGender").value || document.getElementById("cGender").value,
      civilStatus: document.getElementById("bCivilStatus").value || document.getElementById("cCivilStatus").value,
      occupation: document.getElementById("bOccupation").value || "None",
      salary: parseFloat(document.getElementById("bSalary").value) || 0,
      relationship: document.getElementById("bRelationship").value || "Self"
    },
    targetSector: Array.from(document.querySelectorAll("input[name='targetSector']:checked")).map(cb => cb.value).join(", ") || "FHONA",
    service: document.querySelector("input[name='finAssistance']:checked")?.value || "Medical",
    assistanceProvided: document.getElementById("astProvided").value,
    amount: astAmt,
    amountWords: document.getElementById("astAmountWords").value,
    fundSource: document.getElementById("astFundSource").value,
    purpose: document.getElementById("astPurpose").value,
    partnerAgency: partnerAgency,
    contactPerson: document.getElementById("astContactPerson").value,
    contactNumber: document.getElementById("astContactNumber").value,
    validUntil: document.getElementById("astValidUntil").value,
    caseSummary: document.getElementById("caseSummaryText").value,
    worker: appState.currentUser ? appState.currentUser.name : "Ana Dela Cruz",
    savedAt: `${dateFormatted}, ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
  };

  // Prepend to state & storage
  appState.records.unshift(newRecord);
  saveStorage(STORAGE_KEYS.RECORDS, appState.records);
  appState.lastSavedRecord = newRecord;

  // Clear draft if any matching
  removeDraftByClient(cFullName);

  // Transition to Step 4 Print Station (Wireframe 5c)
  appState.currentTxnStep = 4;
  updateStepperUI(4);

  document.getElementById("txnStep3").classList.add("hidden");
  document.getElementById("txnStep4").classList.remove("hidden");

  document.getElementById("savedSuccessMessage").textContent = `Guarantee Letter No. ${glNo} was created. The three documents are ready to print.`;
  document.getElementById("printGlNoBadge").textContent = `Guarantee Letter No. ${glNo}`;
  document.getElementById("printGlSavedTimeBadge").textContent = `Saved ${newRecord.savedAt} by ${newRecord.worker}`;
  document.getElementById("printGlPartnerSubtext").textContent = `1 page, for ${partnerAgency || "Partner Agency"}`;

  renderStep4DocTab("gl");
}

function switchStep4DocTab(docKey) {
  appState.activeStep4Doc = docKey;
  document.querySelectorAll("[data-step4doc]").forEach(b => {
    b.classList.toggle("active", b.getAttribute("data-step4doc") === docKey);
  });
  renderStep4DocTab(docKey);
}

function renderStep4DocTab(docKey) {
  const container = document.getElementById("step4DocPreviewContainer");
  const sourceDoc = docKey === "gis" ? document.getElementById("previewDocGis")
    : docKey === "coe" ? document.getElementById("previewDocCoe")
      : document.getElementById("previewDocGl");

  if (sourceDoc) {
    container.innerHTML = sourceDoc.outerHTML;
    const inner = container.querySelector(".document-sheet-view");
    if (inner) inner.classList.remove("hidden");
  }
}

function printSelectedDocuments() {
  const printGis = document.getElementById("chkPrintGis").checked;
  const printCoe = document.getElementById("chkPrintCoe").checked;
  const printGl = document.getElementById("chkPrintGl").checked;

  if (!printGis && !printCoe && !printGl) {
    alert("Please select at least one document to print.");
    return;
  }

  const printArea = document.getElementById("printArea");
  printArea.innerHTML = "";

  if (printGis) {
    const page = document.createElement("div");
    page.className = "print-page";
    page.innerHTML = document.getElementById("previewDocGis").innerHTML;
    printArea.appendChild(page);
  }

  if (printCoe) {
    const page = document.createElement("div");
    page.className = "print-page";
    page.innerHTML = document.getElementById("previewDocCoe").innerHTML;
    printArea.appendChild(page);
  }

  if (printGl) {
    const page = document.createElement("div");
    page.className = "print-page";
    page.innerHTML = document.getElementById("previewDocGl").innerHTML;
    printArea.appendChild(page);
  }

  // Show Sign and Stamp Reminder (Wireframe 5d)
  document.getElementById("printReminderBanner").classList.remove("hidden");

  // Trigger Native Print Dialog
  setTimeout(() => {
    window.print();
  }, 100);
}

function startBrandNewTransaction() {
  // Clear the previous transaction's form values before starting a fresh client.
  const transactionPane = document.getElementById("tab-new-transaction");
  if (transactionPane) {
    transactionPane.querySelectorAll("input, select, textarea").forEach(field => {
      if (field.type === "hidden" || field.disabled) return;

      if (field.type === "checkbox" || field.type === "radio") {
        field.checked = false;
      } else if (field.tagName === "SELECT") {
        field.selectedIndex = 0;
      } else if (!field.readOnly) {
        field.value = "";
      }
      field.classList.remove("input-error", "is-invalid");
    });
  }

  appState.prefillFromRecord = null;
  appState.lastSavedRecord = null;
  appState.currentDraftId = null;
  appState.step1ClientName = "";
  appState.step1BeneficiaryName = "";
  appState.step1AssistanceType = "";
  appState.currentTxnStep = 1;
  appState.currentTransaction = null;
  updateStepperUI(1);

  document.getElementById("txnStep4").classList.add("hidden");
  document.getElementById("txnStep3").classList.add("hidden");
  document.getElementById("txnStep2").classList.add("hidden");
  document.getElementById("txnStep1").classList.remove("hidden");
const draftPill = document.getElementById("draftSavedPill");
  if (draftPill) draftPill.classList.add("hidden");
  const issueStatus = document.getElementById("glIssueStatus");
  if (issueStatus) {
    issueStatus.classList.add("hidden");
    issueStatus.textContent = "";
  }
  const issueButton = document.getElementById("btnIssueGuaranteeLetter");
  if (issueButton) issueButton.classList.remove("hidden");

  initStep1Check();
}

function restartTxnCheck() {
  if (confirm("Go back to Step 1 and verify a different client?")) {
    startBrandNewTransaction();
  }
}

// ==========================================================================
// 11. DRAFTS & AUTO-SAVE (Wireframe 10b, 10a, 11e)
// ==========================================================================

let pendingDraftDeleteId = null;
let pendingDraftDeleteTrigger = null;
let pendingDraftAction = null;
let pendingDraftActionTrigger = null;
let draftsModalTrigger = null;

function setDraftStatus(message, kind = "muted") {
  const status = document.getElementById("draftsStatus");
  if (status) {
    status.className = "text-xs " + (kind === "danger" ? "text-danger" : kind === "success" ? "text-success" : "text-muted");
    status.textContent = message || "";
  }
}

function setDraftActionMessage(message, kind = "muted") {
  const status = document.getElementById("draftActionMessage");
  if (status) {
    status.className = "text-xs " + (kind === "danger" ? "text-danger" : kind === "success" ? "text-success" : "text-muted");
    status.textContent = message || "";
  }
}

function formatDraftSavedTime(value) {
  if (!value) return "Time unavailable";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Time unavailable"
    : date.toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short" });
}

async function saveCurrentDraftManually() {
  const button = document.querySelector("[onclick='saveCurrentDraftManually()']");
  if (button) {
    button.disabled = true;
    button.textContent = "Saving...";
  }
  setDraftActionMessage("Saving this draft to your account...");

  try {
    if (typeof window.saveTransactionDraft !== "function") {
      throw new Error("The draft service is unavailable. Please refresh and try again.");
    }

    const draft = await window.saveTransactionDraft();
    const pill = document.getElementById("draftSavedPill");
    const pillTime = document.getElementById("draftSavedTime");
    if (pill) pill.classList.remove("hidden");
    if (pillTime) pillTime.textContent = formatDraftSavedTime(draft.last_saved_at);
    setDraftActionMessage("Draft saved to your account.", "success");

    if (pill) setTimeout(() => pill.classList.add("hidden"), 5000);
  } catch (error) {
    setDraftActionMessage("Draft could not be saved. Check the required information and try again.", "danger");
  } finally {
    if (button) {
      button.disabled = false;
      button.textContent = "Save draft";
    }
  }
}

function confirmDiscardDraft() {
  showDraftActionConfirmation({
    type: "discard",
    title: "Discard current changes?",
    message: "Clear this transaction form? Unsaved changes will be lost. Any previously saved draft will remain in My drafts.",
    confirmLabel: "Clear form"
  });
}

function updateDraftsCountBadge() {
  const badge = document.getElementById("draftsCountBadge");
  if (badge) badge.textContent = String(Array.isArray(appState.drafts) ? appState.drafts.length : 0);
}
window.updateDraftsCountBadge = updateDraftsCountBadge;

async function openDraftsModal() {
  draftsModalTrigger = document.activeElement || document.getElementById("draftsMenuItem");
  document.getElementById("userDropdown")?.classList.add("hidden");
  const modal = document.getElementById("draftsModal");
  if (!modal) return;
  modal.classList.remove("hidden");
  document.querySelector("#draftsModal .modal-close")?.focus();

  const tbody = document.getElementById("draftsTableBody");
  if (tbody) {
    tbody.replaceChildren();
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 5;
    cell.className = "text-center text-muted p-4";
    cell.textContent = "Loading your drafts...";
    row.appendChild(cell);
    tbody.appendChild(row);
  }
  setDraftStatus("Loading drafts for your account...");

  try {
    if (typeof window.loadTransactionDrafts !== "function") {
      throw new Error("The draft service is unavailable. Please refresh and try again.");
    }
    await window.loadTransactionDrafts();
    renderDraftsTable();
    setDraftStatus(appState.drafts.length ? "Only you can view and manage these drafts." : "");
  } catch (error) {
    // Do not render an earlier in-memory list when the server cannot confirm
    // the current account's draft ownership and availability.
    appState.drafts = [];
    updateDraftsCountBadge();
    renderDraftsTable();
    setDraftStatus("Your drafts could not be loaded. Check your connection and try again.", "danger");
  }
}

function closeDraftsModal(restoreFocus = true) {
  document.getElementById("draftsModal")?.classList.add("hidden");
  const trigger = draftsModalTrigger;
  draftsModalTrigger = null;
  if (restoreFocus && trigger && trigger.isConnected && typeof trigger.focus === "function") {
    trigger.focus();
  }
}

function renderDraftsTable() {
  const tbody = document.getElementById("draftsTableBody");
  if (!tbody) return;

  tbody.replaceChildren();
  const drafts = Array.isArray(appState.drafts) ? appState.drafts : [];
  if (drafts.length === 0) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 5;
    cell.className = "text-center text-muted p-4";
    cell.textContent = "No drafts saved. When you save an unfinished transaction, it will appear here.";
    row.appendChild(cell);
    tbody.appendChild(row);
    return;
  }

  drafts.forEach(draft => {
    const row = document.createElement("tr");
    const clientCell = document.createElement("td");
    clientCell.className = "font-weight-bold";
    clientCell.textContent = draft.clientName || "Untitled client";

    const beneficiaryCell = document.createElement("td");
    beneficiaryCell.textContent = draft.beneficiaryName || "Not specified";

    const assistanceCell = document.createElement("td");
    const assistanceBadge = document.createElement("span");
    assistanceBadge.className = "badge badge-subtle";
    assistanceBadge.textContent = draft.assistance || "Unspecified";
    assistanceCell.appendChild(assistanceBadge);

    const savedCell = document.createElement("td");
    savedCell.className = "text-muted text-xs";
    savedCell.textContent = formatDraftSavedTime(draft.lastSavedAt);

    const actionCell = document.createElement("td");
    actionCell.className = "text-right";

    const resumeButton = document.createElement("button");
    resumeButton.type = "button";
    resumeButton.className = "btn btn-sm btn-outline-primary mr-1";
    resumeButton.textContent = "Resume";
    resumeButton.addEventListener("click", () => resumeDraft(draft.id, resumeButton));

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "btn btn-sm btn-outline-secondary text-danger";
    deleteButton.textContent = "Delete";
    deleteButton.addEventListener("click", () => deleteDraft(draft.id, deleteButton));

    actionCell.append(resumeButton, deleteButton);
    row.append(clientCell, beneficiaryCell, assistanceCell, savedCell, actionCell);
    tbody.appendChild(row);
  });
}

async function resumeDraft(draftId, trigger = null) {
  const id = String(draftId);
  if (appState.currentTxnStep === 2 && String(appState.currentDraftId || "") !== id) {
    showDraftActionConfirmation({
      type: "resume",
      draftId: id,
      title: "Replace the open transaction?",
      message: "Opening this draft will replace the transaction form currently open. Any unsaved changes in that form will be lost.",
      confirmLabel: "Resume draft"
    }, trigger);
    return;
  }

  await openDraftInForm(id);
}

async function openDraftInForm(id) {
  setDraftStatus("Loading the full transaction draft...");
  try {
    if (typeof window.getTransactionDraft !== "function") {
      throw new Error("Draft service unavailable");
    }
    const response = await window.getTransactionDraft(id);
    const draft = response && response.data;
    if (!draft || !draft.form_data) {
      throw new Error("Draft form data unavailable");
    }

    navigateToTab("new-transaction");
    if (typeof window.restoreTransactionDraftForm !== "function") {
      throw new Error("Form restore unavailable");
    }
    window.restoreTransactionDraftForm(draft.form_data, draft.id);
    closeDraftsModal(false);
    setDraftActionMessage("Draft resumed. Save draft again to keep any further changes.", "success");
    document.getElementById("cLastName")?.focus();
  } catch (_) {
    setDraftStatus("This draft could not be opened. It may have expired or your access may have changed.", "danger");
  }
}

function showDraftActionConfirmation(action, trigger = null) {
  pendingDraftAction = action;
  pendingDraftActionTrigger = trigger || document.activeElement || null;

  const title = document.getElementById("draftActionConfirmTitle");
  const message = document.getElementById("draftActionConfirmText");
  const confirmButton = document.getElementById("confirmDraftActionButton");
  if (title) title.textContent = action.title;
  if (message) message.textContent = action.message;
  if (confirmButton) confirmButton.textContent = action.confirmLabel || "Continue";

  document.getElementById("draftActionConfirmModal")?.classList.remove("hidden");
  document.getElementById("cancelDraftActionButton")?.focus();
}

function cancelDraftAction() {
  pendingDraftAction = null;
  document.getElementById("draftActionConfirmModal")?.classList.add("hidden");
  const trigger = pendingDraftActionTrigger;
  pendingDraftActionTrigger = null;
  if (trigger && trigger.isConnected && typeof trigger.focus === "function") trigger.focus();
}

async function confirmDraftAction() {
  const action = pendingDraftAction;
  pendingDraftAction = null;
  document.getElementById("draftActionConfirmModal")?.classList.add("hidden");
  pendingDraftActionTrigger = null;
  if (!action) return;

  if (action.type === "resume") {
    await openDraftInForm(String(action.draftId));
    return;
  }

  if (action.type === "discard") {
    startBrandNewTransaction();
    setDraftActionMessage("The transaction form was cleared. Any previously saved draft remains in My drafts.", "success");
    document.getElementById("step1ClientName")?.focus();
  }
}

function deleteDraft(draftId, trigger = null) {
  pendingDraftDeleteId = String(draftId);
  pendingDraftDeleteTrigger = trigger || document.activeElement || null;
  const draft = appState.drafts.find(item => String(item.id) === pendingDraftDeleteId);
  const detail = document.getElementById("deleteDraftConfirmText");
  const error = document.getElementById("deleteDraftError");
  if (detail) {
    detail.textContent = "Delete the unfinished transaction for " + (draft?.clientName || "this client") + "? This cannot be undone.";
  }
  if (error) error.textContent = "";
  document.getElementById("deleteDraftConfirmModal")?.classList.remove("hidden");
  document.getElementById("cancelDeleteDraftButton")?.focus();
}

function cancelDeleteDraft(restoreFocus = true) {
  pendingDraftDeleteId = null;
  document.getElementById("deleteDraftConfirmModal")?.classList.add("hidden");
  if (restoreFocus) {
    const trigger = pendingDraftDeleteTrigger;
    pendingDraftDeleteTrigger = null;
    if (trigger && trigger.isConnected && typeof trigger.focus === "function") trigger.focus();
  } else {
    pendingDraftDeleteTrigger = null;
  }
}

async function confirmDeleteDraft() {
  if (!pendingDraftDeleteId) return;
  const button = document.getElementById("confirmDeleteDraftButton");
  const error = document.getElementById("deleteDraftError");
  if (button) {
    button.disabled = true;
    button.textContent = "Deleting...";
  }
  if (error) error.textContent = "";

  try {
    if (typeof window.deleteTransactionDraft !== "function") {
      throw new Error("Draft service unavailable");
    }
    await window.deleteTransactionDraft(pendingDraftDeleteId);
    cancelDeleteDraft(false);
    renderDraftsTable();
    setDraftStatus("Draft deleted.", "success");
    document.getElementById("draftsModalTitle")?.focus();
  } catch (_) {
    // Keep the destructive dialog open until the server confirms deletion.
    if (error) error.textContent = "The draft could not be deleted. Check your connection and try again.";
    document.getElementById("cancelDeleteDraftButton")?.focus();
  } finally {
    if (button) {
      button.disabled = false;
      button.textContent = "Delete draft";
    }
  }
}

document.addEventListener("keydown", event => {
  const deleteDialog = document.getElementById("deleteDraftConfirmModal");
  const actionDialog = document.getElementById("draftActionConfirmModal");
  const draftsDialog = document.getElementById("draftsModal");
  const activeDialog = deleteDialog && !deleteDialog.classList.contains("hidden") ? deleteDialog
    : actionDialog && !actionDialog.classList.contains("hidden") ? actionDialog
      : draftsDialog && !draftsDialog.classList.contains("hidden") ? draftsDialog
        : null;

  if (event.key === "Escape") {
    if (activeDialog === deleteDialog) cancelDeleteDraft();
    else if (activeDialog === actionDialog) cancelDraftAction();
    else if (activeDialog === draftsDialog) closeDraftsModal();
    return;
  }

  if (event.key !== "Tab" || !activeDialog) return;
  const focusable = Array.from(activeDialog.querySelectorAll(
    'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
  )).filter(item => !item.closest(".hidden") && !item.disabled);
  if (!focusable.length) return;

  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && (document.activeElement === first || !activeDialog.contains(document.activeElement))) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && (document.activeElement === last || !activeDialog.contains(document.activeElement))) {
    event.preventDefault();
    first.focus();
  }
});

function removeDraftByClient() {
  const currentId = appState.currentDraftId;
  if (currentId === null || currentId === undefined) return;

  // The API consumed this exact creator-owned draft in the transaction that
  // created the official AICS record. Never remove another draft by client name.
  appState.drafts = appState.drafts.filter(draft => String(draft.id) !== String(currentId));
  appState.currentDraftId = null;
  updateDraftsCountBadge();
}

window.restoreEmergencyDraft = function (formData) {
  if (!formData) return;
  try {
    // Emergency drafts don't have a server ID, so pass -1 (not persisted yet)
    window.restoreTransactionDraftForm(formData, null);
    // Clear the draft ID since this isn't a server-persisted draft
    appState.currentDraftId = null;
  } catch (err) {
    alert("Could not restore the saved form: " + err.message);
  }
};

window.restoreTransactionDraftForm = function (formData, draftId) {
  if (!formData || formData.schema_version !== 1 || !formData.transaction || !formData.fields) {
    throw new Error("This draft uses an unsupported or incomplete form format.");
  }

  startBrandNewTransaction();
  appState.currentDraftId = Number(draftId);
  appState.step1ClientName = formData.step1?.client_name || formData.transaction.client?.full_name || "";
  appState.step1BeneficiaryName = formData.step1?.beneficiary_name || formData.transaction.beneficiary?.full_name || "";
  appState.step1AssistanceType = formData.step1?.assistance_type || "Medical";
  appState.prefillFromRecord = null;
  appState.currentTransaction = formData.transaction;

  const step2 = document.getElementById("txnStep2");
  if (!step2) throw new Error("The transaction form is unavailable.");

  Object.entries(formData.fields).forEach(([fieldId, stored]) => {
    if (fieldId === "formGlNo") return;
    const field = document.getElementById(fieldId);
    if (!field || !stored || typeof stored !== "object") return;
    if (field.type === "checkbox" || field.type === "radio") {
      field.checked = Boolean(stored.checked);
    } else if (Object.prototype.hasOwnProperty.call(stored, "value")) {
      field.value = stored.value ?? "";
    }
  });

  const controls = Array.from(step2.querySelectorAll("input[name]"));
  Object.entries(formData.groups || {}).forEach(([name, selected]) => {
    controls.filter(control => control.name === name).forEach(control => {
      if (control.type === "radio") {
        control.checked = control.value === selected;
      } else if (control.type === "checkbox") {
        const selectedValues = Array.isArray(selected) ? selected.map(String) : [];
        control.checked = selectedValues.includes(String(control.value));
      }
    });
  });

  const sameAsClient = document.getElementById("beneficiarySameAsClientCheckbox");
  if (sameAsClient) toggleBeneficiarySameAsClient(sameAsClient.checked);

  const tbody = document.getElementById("familyTableBody");
  if (tbody) {
    tbody.replaceChildren();
    updateFamilyTableFromClient();
    const members = Array.isArray(formData.transaction.family_members) ? formData.transaction.family_members : [];
    const applyMember = (row, member) => {
      const inputs = row.querySelectorAll("input");
      const values = [
        member.full_name || "",
        member.relationship || "",
        member.age === null || member.age === undefined ? "" : String(member.age),
        member.civil_status || "",
        member.occupation || "",
        member.monthly_salary === null || member.monthly_salary === undefined ? "" : String(member.monthly_salary)
      ];
      values.forEach((value, index) => {
        if (inputs[index]) inputs[index].value = value;
      });
    };

    if (members.length > 0) {
      const firstRow = tbody.children[0];
      if (firstRow) applyMember(firstRow, members[0]);
      members.slice(1).forEach(member => {
        addFamilyRow();
        const row = tbody.children[tbody.children.length - 1];
        if (row) applyMember(row, member);
      });
    }
  }

  const glNumber = document.getElementById("formGlNo");
  if (glNumber) glNumber.value = "Pending...";

  appState.currentTxnStep = 2;
  updateStepperUI(2);
  document.getElementById("txnStep1")?.classList.add("hidden");
  step2.classList.remove("hidden");
  document.getElementById("txnStep3")?.classList.add("hidden");
  document.getElementById("txnStep4")?.classList.add("hidden");
  document.getElementById("txnStatusBar")?.classList.remove("hidden");
  document.getElementById("draftSavedPill")?.classList.add("hidden");

  if (document.getElementById("cBirthdate")?.value) calculateClientAge();
  if (document.getElementById("bBirthdate")?.value) calculateBeneficiaryAge();
  const caseSummary = document.getElementById("caseSummaryText");
  if (caseSummary) updateCaseSummaryCount(caseSummary);
  updateLivePreview();
  validateFormFieldsRemaining();

  const clientDisplay = document.getElementById("step1ClientDisplay");
  const beneficiaryInput = document.getElementById("step1BeneficiaryInput");
  if (clientDisplay) clientDisplay.textContent = appState.step1ClientName;
  if (beneficiaryInput) beneficiaryInput.value = appState.step1BeneficiaryName;
};

// ==========================================================================
// 12. TAB 3: RECORDS LISTING & EDIT/CORRECT ENGINE (Wireframe 6a, 6d, 7a, 7b)
// ==========================================================================

function showRecordsSkeleton() {
  const container = document.getElementById("recordsGroupContainer");
  if (!container) return;
  const skeletonRow = (widths) => `<tr class="skeleton-row">${widths.map(w =>
    `<td><span class="skeleton skeleton-cell" style="width:${w}"></span></td>`
  ).join("")}</tr>`;
  const cols = ["60px","90px","130px","110px","80px","70px","55px","60px","90px","70px","60px"];
  container.innerHTML = `<div class="year-group">
    <div class="year-group-header"><span class="skeleton skeleton-cell" style="width:60px;height:16px"></span></div>
    <div class="table-responsive"><table class="table mb-0"><tbody>
      ${Array(5).fill(0).map(() => skeletonRow(cols)).join("")}
    </tbody></table></div></div>`;
}

function filterRecordsList() {
  const search = document.getElementById("recordsSearchName")?.value.trim().toLowerCase() || "";
  const yearFilter = document.getElementById("recordsFilterYear")?.value || "All";
  const astFilter = document.getElementById("recordsFilterAssistance")?.value || "All";
  const agencyFilter = document.getElementById("recordsFilterAgency")?.value || "All";

  const container = document.getElementById("recordsGroupContainer");
  const noResult = document.getElementById("recordsNoResult");
  if (!container) return;

  const filtered = appState.records.filter(r => {
    const cName = (r.client.fullName || "").toLowerCase();
    const bName = (r.beneficiary.fullName || "").toLowerCase();
    const matchName = !search || cName.includes(search) || bName.includes(search);
    const matchYear = yearFilter === "All" || r.year === yearFilter;
    const matchAst = astFilter === "All" || (r.service && r.service.toLowerCase().includes(astFilter.toLowerCase()));
    const matchAg = agencyFilter === "All" || (r.partnerAgency && r.partnerAgency === agencyFilter);
    return matchName && matchYear && matchAst && matchAg;
  });

  if (filtered.length === 0) {
    container.innerHTML = "";
    noResult.classList.remove("hidden");
    return;
  }
  noResult.classList.add("hidden");

  // Group by year
  const grouped = {};
  filtered.forEach(r => {
    const y = r.year || "2026";
    if (!grouped[y]) grouped[y] = [];
    grouped[y].push(r);
  });

  const sortedYears = Object.keys(grouped).sort((a, b) => b - a);

  container.innerHTML = sortedYears.map(year => {
    const list = grouped[year];
    return `
      <div class="card p-3 record-year-group">
        <div class="year-group-header" onclick="toggleYearGroup('${year}')">
          <span class="year-toggle-arrow" id="arrow-${year}">&#9660;</span>
          <span>${year} · ${list.length} record${list.length > 1 ? "s" : ""}</span>
        </div>
        <div class="table-responsive" id="tableWrap-${year}">
          <table class="table table-hover align-middle mb-0">
            <thead>
              <tr>
                <th>GL No.</th>
                <th>Date served</th>
                <th>Client</th>
                <th>Beneficiary</th>
                <th>Barangay</th>
                <th>Service</th>
                <th>Amount</th>
                <th>Approval</th>
                <th>Partner agency</th>
                <th>Worker</th>
                <th class="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              ${list.map(r => {
                const glIssued = !!r.guaranteeLetterIssuedAt;
                const glBadge = glIssued
                  ? `<span class="badge badge-success" title="GL issued — budget deducted">Issued</span>`
                  : `<span class="badge badge-warning" title="Awaiting GL issuance by Senior Staff or Admin">Not issued</span>`;
                return `
                <tr>
                  <td class="font-weight-bold">${r.glNo}</td>
                  <td>${r.date}</td>
                  <td>${r.client.fullName}</td>
                  <td>${r.beneficiary.fullName}</td>
                  <td>${r.client.barangay}</td>
                  <td><span class="badge badge-subtle">${r.service}</span></td>
                  <td class="font-weight-bold">${formatCurrency(r.amount)}</td>
                  <td>${glBadge}</td>
                  <td>${r.partnerAgency || "<span class='text-danger'>None</span>"}</td>
                  <td>${r.worker}</td>
                  <td class="text-right">
                    <button type="button" class="btn btn-sm btn-outline-primary mr-1" onclick="openRecordDetail('${r.glNo}')">View</button>
                    ${canEditRecord() ? `<button type="button" class="btn btn-sm btn-outline-secondary" onclick="openEditRecordModal('${r.glNo}')">Edit or correct</button>` : ""}
                  </td>
                </tr>`;
              }).join("")}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }).join("");
}

function canEditRecord() {
  if (!appState.isOnline) return false;
  const role = appState.currentUser ? appState.currentUser.role : "Staff";
  return role !== "Viewer";
}

function toggleYearGroup(year) {
  const wrap = document.getElementById(`tableWrap-${year}`);
  const arrow = document.getElementById(`arrow-${year}`);
  if (wrap) {
    wrap.classList.toggle("hidden");
    arrow.classList.toggle("collapsed");
  }
}

function populateAgencyFilterDropdown() {
  const sel = document.getElementById("recordsFilterAgency");
  if (!sel) return;
  const currentVal = sel.value;
  sel.innerHTML = `<option value="All">All</option>` + appState.agencies.map(a => `
    <option value="${a.name}">${a.name}</option>
  `).join("");
  sel.value = currentVal || "All";
}

function openRecordDetail(glNo) {
  const rec = appState.records.find(r => r.glNo === glNo);
  if (!rec) return;

  appState.currentSelectedRecord = rec;

  document.getElementById("mdlDetailTitle").textContent = `Record ${rec.glNo}`;
  document.getElementById("mdlDetailSavedMeta").textContent = `Saved ${rec.savedAt || rec.date} by ${rec.worker}`;
  document.getElementById("mdlDetailGlNo").textContent = rec.glNo;
  document.getElementById("mdlDetailClient").textContent = `${rec.client.fullName} (${rec.client.gender || "Female"}, ${rec.client.age || 40})`;
  document.getElementById("mdlDetailBeneficiary").textContent = `${rec.beneficiary.fullName} (${rec.beneficiary.gender || "Male"}, ${rec.beneficiary.age || 10}) · ${rec.beneficiary.relationship || "Mother"}`;
  document.getElementById("mdlDetailAddress").textContent = `${rec.client.street}, ${rec.client.barangay}, Maramag, Bukidnon`;
  document.getElementById("mdlDetailAssistance").textContent = `${rec.assistanceProvided || rec.service} · PHP ${formatCurrency(rec.amount)} · Fund source: ${rec.fundSource || "MSWDO"}`;
  document.getElementById("mdlDetailAgency").textContent = rec.partnerAgency || "None";

  // Calculate 3-month waiting period end
  const servedDate = new Date(rec.dateIso || rec.date);
  const eligibleDate = new Date(servedDate);
  eligibleDate.setMonth(eligibleDate.getMonth() + (appState.rules.waitingPeriodMonths || 3));
  document.getElementById("mdlDetailWaitingPeriod").textContent = `${formatDateDisplay(eligibleDate)} (3 months after ${rec.date})`;

  document.getElementById("btnEditFromDetail").style.display = canEditRecord() ? "inline-flex" : "none";

  document.getElementById("recordDetailModal").classList.remove("hidden");
}

function closeRecordDetailModal() {
  document.getElementById("recordDetailModal").classList.add("hidden");
}

function openEditModalFromDetail() {
  closeRecordDetailModal();
  if (appState.currentSelectedRecord) {
    openEditRecordModal(appState.currentSelectedRecord.glNo);
  }
}

function reprintDocument(docKey) {
  const rec = appState.currentSelectedRecord;
  if (!rec) return;

  const printArea = document.getElementById("printArea");
  printArea.innerHTML = "";

  // Populate preview DOM temporarily with record data
  populateDomWithRecord(rec);

  const sourceDoc = docKey === "gis" ? document.getElementById("previewDocGis")
    : docKey === "coe" ? document.getElementById("previewDocCoe")
      : document.getElementById("previewDocGl");

  const page = document.createElement("div");
  page.className = "print-page";
  page.innerHTML = sourceDoc.innerHTML;
  printArea.appendChild(page);

  setTimeout(() => {
    window.print();
  }, 100);
}

function populateDomWithRecord(rec) {
  document.getElementById("formGlNo").value = rec.glNo;
  document.getElementById("formTxnDate").value = rec.date;
  document.getElementById("cLastName").value = rec.client.lastName || "";
  document.getElementById("cFirstName").value = rec.client.firstName || "";
  document.getElementById("cMiddleName").value = rec.client.middleName || "";
  document.getElementById("cExt").value = rec.client.ext || "";
  document.getElementById("cStreet").value = rec.client.street || "";
  document.getElementById("cBarangay").value = rec.client.barangay || "";
  document.getElementById("cMobile").value = rec.client.mobile || "";
  document.getElementById("cBirthdate").value = rec.client.birthdate || "";
  document.getElementById("cAge").value = rec.client.age || "";
  document.getElementById("cGender").value = rec.client.gender || "";
  document.getElementById("cCivilStatus").value = rec.client.civilStatus || "";
  document.getElementById("cOccupation").value = rec.client.occupation || "";
  document.getElementById("cSalary").value = rec.client.salary || "";

  document.getElementById("bLastName").value = rec.beneficiary.lastName || "";
  document.getElementById("bFirstName").value = rec.beneficiary.firstName || "";
  document.getElementById("bMiddleName").value = rec.beneficiary.middleName || "";
  document.getElementById("bExt").value = rec.beneficiary.ext || "";
  document.getElementById("bStreet").value = rec.beneficiary.street || "";
  document.getElementById("bBarangay").value = rec.beneficiary.barangay || "";
  document.getElementById("bBirthdate").value = rec.beneficiary.birthdate || "";
  document.getElementById("bAge").value = rec.beneficiary.age || "";
  document.getElementById("bGender").value = rec.beneficiary.gender || "";
  document.getElementById("bCivilStatus").value = rec.beneficiary.civilStatus || "";
  document.getElementById("bRelationship").value = rec.beneficiary.relationship || "Mother";

  document.getElementById("astProvided").value = rec.assistanceProvided || rec.service;
  document.getElementById("astAmount").value = rec.amount;
  document.getElementById("astAmountWords").value = rec.amountWords || numberToWords(rec.amount);
  document.getElementById("astPartnerAgency").value = rec.partnerAgency || "";
  document.getElementById("caseSummaryText").value = rec.caseSummary || "";

  updateLivePreview();
}

// Edit or Correct Modal logic (Wireframe 7a)
function openEditRecordModal(glNo) {
  if (!offlineWriteGuard("Editing a record")) return;
  const rec = appState.records.find(r => r.glNo === glNo);
  if (!rec) return;

  appState.currentEditingRecordGl = glNo;
  document.getElementById("editModalHeaderTitle").textContent = `Edit or correct: ${glNo}`;

  document.getElementById("editClientLast").value = rec.client.lastName || "";
  document.getElementById("editClientFirst").value = rec.client.firstName || "";
  document.getElementById("editBarangay").value = rec.client.barangay || "";
  document.getElementById("editAmount").value = rec.amount;
  document.getElementById("editAmountWords").value = rec.amountWords || numberToWords(rec.amount);
  document.getElementById("editAmountOriginalHint").textContent = `Original: ${formatCurrency(rec.amount)}`;

  // Populate partner agency selector
  const agSel = document.getElementById("editPartnerAgency");
  agSel.innerHTML = `<option value="">Select partner agency</option>` + appState.agencies.map(a => `
    <option value="${a.name}" ${a.name === rec.partnerAgency ? "selected" : ""}>${a.name}</option>
  `).join("");

  trackEditChanges();
  document.getElementById("editRecordModal").classList.remove("hidden");
}

function closeEditRecordModal() {
  document.getElementById("editRecordModal").classList.add("hidden");
}

function onEditAmountInput(val) {
  const amountInput = document.getElementById("editAmount");
  const amount = Number(val);
  if (Number.isFinite(amount) && amount > 2000) {
    amountInput.value = "2000";
    val = "2000";
  }
  document.getElementById("editAmountWords").value = numberToWords(val);
}

function trackEditChanges() {
  const rec = appState.records.find(r => r.glNo === appState.currentEditingRecordGl);
  if (!rec) return;

  const newLast = document.getElementById("editClientLast").value.trim();
  const newFirst = document.getElementById("editClientFirst").value.trim();
  const newBgy = document.getElementById("editBarangay").value.trim();
  const newAmt = parseFloat(document.getElementById("editAmount").value) || 0;
  const newAg = document.getElementById("editPartnerAgency").value;

  const changes = [];
  if (newLast !== (rec.client.lastName || "") || newFirst !== (rec.client.firstName || "")) {
    changes.push(`Client name updated to "${newFirst} ${newLast}"`);
  }
  if (newBgy !== (rec.client.barangay || "")) {
    changes.push(`Barangay updated from "${rec.client.barangay}" to "${newBgy}"`);
  }
  if (newAmt !== rec.amount) {
    changes.push(`Amount: ${formatCurrency(rec.amount)} to ${formatCurrency(newAmt)}`);
    changes.push("Amount in words: updated");
  }
  if (newAg !== (rec.partnerAgency || "")) {
    changes.push(`Partner agency: updated to "${newAg || "None"}"`);
  }

  const list = document.getElementById("editChangeBulletList");
  if (changes.length === 0) {
    list.innerHTML = `<li>No modifications yet</li>`;
  } else {
    changes.push("All three documents: regenerated");
    list.innerHTML = changes.map(c => `<li>${c}</li>`).join("");
  }
}

function saveRecordCorrection() {
  const rec = appState.records.find(r => r.glNo === appState.currentEditingRecordGl);
  if (!rec) return;

  const newLast = document.getElementById("editClientLast").value.trim();
  const newFirst = document.getElementById("editClientFirst").value.trim();
  const newBgy = document.getElementById("editBarangay").value.trim();
  const newAmt = parseFloat(document.getElementById("editAmount").value) || 0;
  const newAg = document.getElementById("editPartnerAgency").value;

  rec.client.lastName = newLast;
  rec.client.firstName = newFirst;
  rec.client.fullName = `${newFirst} ${rec.client.middleName ? rec.client.middleName + " " : ""}${newLast}`.trim();
  rec.client.barangay = newBgy;
  rec.amount = newAmt;
  rec.amountWords = numberToWords(newAmt);
  rec.partnerAgency = newAg;
  rec.lastModifiedBy = `${appState.currentUser ? appState.currentUser.name : "Ana Dela Cruz"} on ${formatDateDisplay(new Date())}`;

  saveStorage(STORAGE_KEYS.RECORDS, appState.records);
  closeEditRecordModal();
  filterRecordsList();
  alert(`Record ${rec.glNo} updated successfully.`);
}

// ==========================================================================
// 13. TAB 4: MONTHLY REPORT (Wireframe 8a, 8b, 8c, 8d)
// ==========================================================================

function handleMonthlyReportTabOpen() {
  const role = appState.currentUser ? appState.currentUser.role : "Staff";
  const restrictedCard = document.getElementById("monthlyReportRestricted");
  const content = document.getElementById("monthlyReportContent");

  if (role === "Staff" || role === "Viewer") {
    // Show Wireframe 8c Access Restricted screen!
    restrictedCard.classList.remove("hidden");
    content.classList.add("hidden");
    document.getElementById("restrictedRoleLabel").textContent = role;
    return;
  }

  restrictedCard.classList.add("hidden");
  content.classList.remove("hidden");

  // Populate month & agency dropdowns
  populateReportAgencyDropdown();
  renderMonthlyReport();
}

function populateReportAgencyDropdown() {
  const sel = document.getElementById("reportAgencySelect");
  if (!sel) return;
  sel.innerHTML = `<option value="All">All partner agencies</option>` + appState.agencies.map(a => `
    <option value="${a.name}">${a.name}</option>
  `).join("");
}

function renderMonthlyReport() {
  const monthKey = document.getElementById("reportMonthSelect").value; // e.g. "2026-11"
  const agencyFilter = document.getElementById("reportAgencySelect").value;

  // Filter records for selected month
  const monthRecords = appState.records.filter(r => {
    const d = r.dateIso || "";
    return d.startsWith(monthKey);
  });

  // Check for missing partner agency (Wireframe 8b)
  const missingAgencies = monthRecords.filter(r => !r.partnerAgency);
  const warnAlert = document.getElementById("reportMissingAgencyWarning");
  if (missingAgencies.length > 0) {
    warnAlert.classList.remove("hidden");
    document.getElementById("missingAgencyCount").textContent = missingAgencies.length;
  } else {
    warnAlert.classList.add("hidden");
  }

  const tbody = document.getElementById("monthlyReportTableBody");
  if (!tbody) return;

  if (monthRecords.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted p-4">No saved records for this month.</td></tr>`;
    return;
  }

  // Group by partner agency
  const grouped = {};
  monthRecords.forEach(r => {
    const ag = r.partnerAgency || "No partner agency (not included in totals)";
    if (agencyFilter !== "All" && r.partnerAgency !== agencyFilter) return;
    if (!grouped[ag]) grouped[ag] = [];
    grouped[ag].push(r);
  });

  let grandTotal = 0;
  let html = "";

  for (const [agencyName, list] of Object.entries(grouped)) {
    const isMissing = agencyName.includes("No partner agency");
    let subtotal = 0;

    html += `
      <tr class="report-agency-group-header">
        <td colspan="6" class="${isMissing ? "text-danger" : ""}">${agencyName}</td>
      </tr>
    `;

    list.forEach(r => {
      const amt = parseFloat(r.amount) || 0;
      if (!isMissing) {
        subtotal += amt;
        grandTotal += amt;
      }
      html += `
        <tr class="${isMissing ? "text-danger" : ""}">
          <td>${r.glNo}</td>
          <td>${r.client.fullName}</td>
          <td>${r.beneficiary.fullName}</td>
          <td>${r.service}</td>
          <td class="font-weight-bold">${formatCurrency(amt)}</td>
          <td>${r.date}</td>
        </tr>
      `;
    });

    if (!isMissing) {
      html += `
        <tr class="report-subtotal-row">
          <td colspan="4"><strong>Subtotal</strong></td>
          <td colspan="2" class="font-weight-bold">${formatCurrency(subtotal)}</td>
        </tr>
      `;
    }
  }

  // Grand Total row
  html += `
    <tr class="report-grand-total-row">
      <td colspan="4"><strong>Grand total</strong></td>
      <td colspan="2" class="font-weight-bold">PHP ${formatCurrency(grandTotal)}</td>
    </tr>
  `;

  tbody.innerHTML = html;
}

function printMonthlyReport() {
  const monthText = document.getElementById("reportMonthSelect").options[document.getElementById("reportMonthSelect").selectedIndex].text;
  const printArea = document.getElementById("printArea");
  printArea.innerHTML = `
    <div class="print-page">
      <div class="doc-header">
        <div class="doc-header-seal">
          <img src="assets/maramag-seal.jpg" alt="Seal" class="doc-seal-img">
        </div>
        <div class="doc-header-text">
          <div class="doc-republic">REPUBLIC OF THE PHILIPPINES</div>
          <div class="doc-province">PROVINCE OF BUKIDNON</div>
          <div class="doc-lgu">MUNICIPALITY OF MARAMAG</div>
          <div class="doc-office">MUNICIPAL SOCIAL WELFARE &amp; DEVELOPMENT OFFICE</div>
        </div>
      </div>
      <h2 class="text-center font-weight-bold mt-3 mb-1">MONTHLY AICS SUMMARY REPORT</h2>
      <p class="text-center text-sm text-muted mb-4">Period: ${monthText}</p>
      ${document.getElementById("monthlyReportTableCard").innerHTML}
      <div class="doc-signatures-grid mt-5">
        <div class="sig-box">
          <div class="sig-role-title">Prepared by:</div>
          <div class="sig-line-val mt-4">${appState.currentUser ? appState.currentUser.name : "Ana Dela Cruz"}</div>
          <div class="sig-line-label">Records Officer</div>
        </div>
        <div class="sig-box">
          <div class="sig-role-title">Approved by:</div>
          <div class="sig-line-val mt-4">Maria Theresa S. Aleria, RSW</div>
          <div class="sig-line-label">Municipal Social Welfare &amp; Development Officer</div>
        </div>
      </div>
    </div>
  `;

  setTimeout(() => {
    window.print();
  }, 100);
}

// ==========================================================================
// 14. TAB 5: ADMINISTRATION (Wireframe 9a, 9b, 9c, 9d, 9e, 9f, 12a, 12b)
// ==========================================================================

function handleAdminTabOpen() {
  const role = appState.currentUser ? appState.currentUser.role : "Staff";
  const restrictedCard = document.getElementById("adminRestrictedCard");
  const mainContent = document.getElementById("adminMainContent");

  if (role !== "Administrator") {
    if (restrictedCard) restrictedCard.classList.remove("hidden");
    if (mainContent) mainContent.classList.add("hidden");
    const roleLabel = document.getElementById("adminRestrictedRoleLabel");
    if (roleLabel) roleLabel.textContent = role;
    return;
  }

  if (restrictedCard) restrictedCard.classList.add("hidden");
  if (mainContent) mainContent.classList.remove("hidden");

  refreshAdminOverview();
  switchAdminSubTab("users");
}

function refreshAdminOverview() {
  const activeUsers = (appState.users || []).filter(u => u.status === "Active").length;
  const el = document.getElementById("adminOverviewUsers");
  if (el) el.textContent = activeUsers || "—";

  const now = new Date();
  const thisMonth = now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0");
  const txnsThisMonth = (appState.records || []).filter(r => (r.date || "").startsWith(thisMonth)).length;
  const txnEl = document.getElementById("adminOverviewTxns");
  if (txnEl) txnEl.textContent = txnsThisMonth;

  if (typeof loadMonthlyBudget === "function") {
    loadMonthlyBudget().then(() => {
      // Budget overview card is populated via loadMonthlyBudget/loadQuarterlyBudget callbacks
      const remaining = document.getElementById("budgetRemainingDisplay")?.textContent || "—";
      const budgetEl = document.getElementById("adminOverviewBudget");
      if (budgetEl) budgetEl.textContent = remaining;
      const quarterEl = document.getElementById("adminOverviewQuarter");
      const badge = document.getElementById("quarterlyHealthBadge");
      if (quarterEl && badge) quarterEl.textContent = badge.textContent;
    }).catch(() => {});
  }
}

function quickSwitchToRole(targetRole) {
  const user = appState.users.find(u => u.role.toLowerCase() === targetRole.toLowerCase() && u.status === "Active");
  if (user) {
    setAuthenticatedUser(user);
  }
}

function quickSwitchToAdmin() {
  quickSwitchToRole("Administrator");
  navigateToTab("admin");
}

function quickSwitchToSeniorStaff() {
  quickSwitchToRole("Senior staff");
  navigateToTab("monthly-report");
}

function switchAdminSubTab(subKey) {
  document.querySelectorAll(".admin-nav-item").forEach(item => {
    item.classList.toggle("active", item.getAttribute("data-admsub") === subKey);
  });
  document.querySelectorAll(".admin-subpane").forEach(pane => {
    pane.classList.add("hidden");
  });

  const target = document.getElementById(`adminSub-${subKey}`);
  if (target) {
    target.classList.remove("hidden");
  }

  if (subKey === "users") renderAdminUsers();
  else if (subKey === "agencies") renderAdminAgencies();
  else if (subKey === "assistance") renderAdminAssistance();
  else if (subKey === "barangays") renderAdminBarangays();
  else if (subKey === "signatories") renderAdminSignatories();
  else if (subKey === "rules") renderAdminRules();
}

// 1. Users & Access
function renderAdminUsers() {
  const tbody = document.getElementById("adminUsersTableBody");
  if (!tbody) return;

  tbody.innerHTML = appState.users.map(u => {
    const isSelf = appState.currentUser && appState.currentUser.id === u.id;
    const isLastAdmin = u.role === "Administrator" && appState.users.filter(x => x.role === "Administrator" && x.status === "Active").length <= 1;

    return `
      <tr>
        <td>
          <strong>${u.name}</strong>
          <div class="text-xs text-muted">@${u.username}</div>
        </td>
        <td>${u.role}</td>
        <td>
          <span class="badge ${u.status === "Active" ? "badge-success-pill" : "badge-subtle text-danger"}">${u.status}</span>
        </td>
        <td class="text-right">
          <button type="button" class="btn btn-sm btn-outline-secondary mr-1" onclick="openEditUserModal('${u.id}')">Edit</button>
          ${u.status === "Active"
            ? `<button type="button" class="btn btn-sm btn-outline-secondary text-danger mr-1" onclick="toggleUserStatus('${u.id}', 'Disabled')" ${isLastAdmin ? "disabled title='Cannot disable last administrator'" : ""}>Disable</button>`
            : `<button type="button" class="btn btn-sm btn-outline-primary mr-1" onclick="toggleUserStatus('${u.id}', 'Active')">Enable</button>`
          }
          <button type="button" class="btn btn-sm btn-outline-danger" onclick="deleteSystemUser('${u.id}')">Delete</button>
        </td>
      </tr>
    `;
  }).join("");
}

function openEditUserModal(userId) {
  const user = appState.users.find(item => String(item.id) === String(userId));
  if (!user) return;
  document.getElementById('editUserId').value = user.id;
  document.getElementById('editUserFullName').value = user.name || '';
  document.getElementById('editUserUsername').value = user.username || '';
  document.getElementById('editUserRole').value = user.role || 'Staff';
  document.getElementById('editUserPassword').value = '';
  document.getElementById('editUserErrorAlert').classList.add('hidden');
  document.getElementById('editUserModal').classList.remove('hidden');
}
function closeEditUserModal() { document.getElementById('editUserModal').classList.add('hidden'); }
async function handleUpdateUser(event) {
  event.preventDefault();
  if (!appState.isOnline) { alert("You are offline. Updating a user requires a live connection."); return; }
  const id = document.getElementById('editUserId').value;
  const payload = { name: document.getElementById('editUserFullName').value.trim(), role: document.getElementById('editUserRole').value };
  const password = document.getElementById('editUserPassword').value;
  if (password) payload.password = password;
  try {
    await window.adminUpdateUser(id, payload);
    const user = appState.users.find(item => String(item.id) === String(id));
    if (user) { user.name = payload.name; user.role = payload.role; }
    closeEditUserModal(); renderAdminUsers();
  } catch (error) {
    const alert = document.getElementById('editUserErrorAlert'); alert.textContent = error.message; alert.classList.remove('hidden');
  }
}
async function deleteSystemUser(userId) {
  if (!appState.isOnline) { alert("You are offline. Deleting a user requires a live connection."); return; }
  const user = appState.users.find(item => String(item.id) === String(userId));
  if (!user) return;
  if (!confirm('Permanently delete the account for ' + user.name + '? This cannot be undone. If the account is linked to saved records or drafts, the system will ask you to disable it instead.')) return;
  try { await window.adminDeleteUser(userId); appState.users = appState.users.filter(item => String(item.id) !== String(userId)); renderAdminUsers(); }
  catch (error) { alert(error.message); }
}
function openAddUserModal() {
  document.getElementById("addUserModal").classList.remove("hidden");
  document.getElementById("addUserErrorAlert").classList.add("hidden");
}

function closeAddUserModal() {
  document.getElementById("addUserModal").classList.add("hidden");
}

function updateNewUserRoleHint(role) {
  const hints = {
    Staff: "Staff: enter, search and correct records. Cannot open the monthly report.",
    "Senior staff": "Senior staff: enter, search, correct records and open monthly reports.",
    Administrator: "Administrator: full system access including users, agencies, and settings.",
    Viewer: "Viewer: read-only access to records."
  };
  document.getElementById("newUserRoleHint").textContent = hints[role] || "";
}

async function handleSaveNewUser(e) {
  e.preventDefault();
  if (!appState.isOnline) { alert("You are offline. Adding a user requires a live connection."); return; }
  const name = document.getElementById("newUserFullName").value.trim();
  const uname = document.getElementById("newUserName").value.trim().toLowerCase();
  const role = document.getElementById("newUserRole").value;
  const tempPass = document.getElementById("newUserTempPass").value;
  const alertBox = document.getElementById("addUserErrorAlert");
  const submitButton = e.submitter || e.target.querySelector("button[type='submit']");

  alertBox.classList.add("hidden");
  if (!name || !uname || !tempPass) {
    alertBox.textContent = "Please complete all required fields.";
    alertBox.classList.remove("hidden");
    return;
  }
  if (tempPass.length < 10) {
    alertBox.textContent = "Temporary password must be at least 10 characters.";
    alertBox.classList.remove("hidden");
    return;
  }

  if (submitButton) { submitButton.disabled = true; submitButton.textContent = "Adding user..."; }
  try {
    await window.adminCreateUser({ name, username: uname, role, password: tempPass });
    document.getElementById("newUserFullName").value = "";
    document.getElementById("newUserName").value = "";
    document.getElementById("newUserRole").value = "Staff";
    document.getElementById("newUserTempPass").value = "";
    closeAddUserModal();
    renderAdminUsers();
  } catch (error) {
    alertBox.textContent = error.message || "Unable to add user. Please try again.";
    alertBox.classList.remove("hidden");
  } finally {
    if (submitButton) { submitButton.disabled = false; submitButton.textContent = "Add user"; }
  }
}

function toggleUserStatus(userId, newStatus) {
  const u = appState.users.find(x => x.id === userId);
  if (!u) return;

  if (newStatus === "Disabled" && u.role === "Administrator") {
    const activeAdmins = appState.users.filter(x => x.role === "Administrator" && x.status === "Active");
    if (activeAdmins.length <= 1) {
      alert("Cannot disable the last Administrator.");
      return;
    }
  }

  u.status = newStatus;
  saveStorage(STORAGE_KEYS.USERS, appState.users);
  renderAdminUsers();
}

function editUserRolePrompt(userId) {
  const u = appState.users.find(x => x.id === userId);
  if (!u) return;
  const newRole = prompt(`Change access level for ${u.name}\n(Viewer, Staff, Senior staff, Administrator):`, u.role);
  if (newRole && ["Viewer", "Staff", "Senior staff", "Administrator"].includes(newRole)) {
    u.role = newRole;
    saveStorage(STORAGE_KEYS.USERS, appState.users);
    renderAdminUsers();
  }
}

// 2. Partner Agencies
function renderAdminAgencies() {
  const tbody = document.getElementById("adminAgenciesTableBody");
  if (!tbody) return;

  tbody.innerHTML = appState.agencies.map(a => {
    // Count records tied to agency
    const count = appState.records.filter(r => r.partnerAgency === a.name).length;
    return `
      <tr>
        <td class="font-weight-bold">${a.name}</td>
        <td>${a.address}</td>
        <td><span class="badge ${a.status === "Active" ? "badge-success-pill" : "badge-subtle"}">${a.status}</span></td>
        <td>${count || a.recordsCount}</td>
        <td class="text-right">
          <button type="button" class="btn btn-sm btn-outline-secondary mr-1" onclick="editAgencyPrompt('${a.id}')">Edit</button>
          <button type="button" class="btn btn-sm btn-outline-secondary text-danger" onclick="attemptDeleteAgency('${a.id}')">Delete</button>
        </td>
      </tr>
    `;
  }).join("");
}

function attemptDeleteAgency(agencyId) {
  const ag = appState.agencies.find(a => a.id === agencyId);
  if (!ag) return;

  // Protect against deleting agency used by records (Wireframe 9d)
  const isUsed = appState.records.some(r => r.partnerAgency === ag.name);
  const alertBox = document.getElementById("agencyDeleteErrorAlert");

  if (isUsed) {
    alertBox.classList.remove("hidden");
    document.getElementById("agencyDeleteErrorMsg").textContent = `${ag.name} cannot be deleted: It is used by saved records. Disable it instead so it no longer appears in new transactions.`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }

  if (confirm(`Delete partner agency "${ag.name}"?`)) {
    appState.agencies = appState.agencies.filter(a => a.id !== agencyId);
    saveStorage(STORAGE_KEYS.AGENCIES, appState.agencies);
    renderAdminAgencies();
  }
}

function openAddAgencyModal() {
  document.getElementById("addAgencyModal").classList.remove("hidden");
}
function closeAddAgencyModal() {
  document.getElementById("addAgencyModal").classList.add("hidden");
}

function handleSaveNewAgency(e) {
  e.preventDefault();
  const name = document.getElementById("newAgencyName").value.trim();
  const addr = document.getElementById("newAgencyAddress").value.trim();
  const contact = document.getElementById("newAgencyContact").value.trim();

  appState.agencies.push({
    id: `ag-${Date.now()}`,
    name: name,
    address: addr,
    contact: contact,
    status: "Active",
    recordsCount: 0
  });

  saveStorage(STORAGE_KEYS.AGENCIES, appState.agencies);
  closeAddAgencyModal();
  renderAdminAgencies();
  populateAgencyDropdowns();
}

function editAgencyPrompt(id) {
  const ag = appState.agencies.find(a => a.id === id);
  if (!ag) return;
  const newAddr = prompt(`Edit address for ${ag.name}:`, ag.address);
  if (newAddr) {
    ag.address = newAddr;
    saveStorage(STORAGE_KEYS.AGENCIES, appState.agencies);
    renderAdminAgencies();
  }
}

// 3. Assistance Types & Checklists (Wireframe 9e, 12d)
function renderAdminAssistance() {
  const tbody = document.getElementById("adminAssistanceTableBody");
  if (!tbody) return;

  tbody.innerHTML = appState.assistanceTypes.map(a => `
    <tr>
      <td class="font-weight-bold">${a.type}</td>
      <td>${a.requirements.length} items (${a.requirements[0]}...)</td>
      <td>${a.copies}</td>
      <td><span class="badge ${a.status === "Active" ? "badge-success-pill" : "badge-subtle"}">${a.status}</span></td>
      <td class="text-right">
        <button type="button" class="btn btn-sm btn-outline-primary mr-1" onclick="openEditChecklistModal('${a.type}')">Edit checklist</button>
        <button type="button" class="btn btn-sm btn-outline-secondary text-danger" onclick="toggleAssistanceStatus('${a.type}')">${a.status === "Active" ? "Disable" : "Enable"}</button>
      </td>
    </tr>
  `).join("");
}

function openEditChecklistModal(typeKey) {
  const found = appState.assistanceTypes.find(a => a.type === typeKey);
  if (!found) return;

  document.getElementById("editChecklistTitle").textContent = `Edit checklist: ${typeKey}`;
  document.getElementById("editChecklistTypeKey").value = typeKey;
  document.getElementById("editChecklistItems").value = found.requirements.join("\n");
  document.getElementById("editChecklistCopies").value = found.copies || "";

  document.getElementById("editChecklistModal").classList.remove("hidden");
}

function closeEditChecklistModal() {
  document.getElementById("editChecklistModal").classList.add("hidden");
}

function handleSaveChecklist(e) {
  e.preventDefault();
  const typeKey = document.getElementById("editChecklistTypeKey").value;
  const rawItems = document.getElementById("editChecklistItems").value.trim().split("\n");
  const copies = document.getElementById("editChecklistCopies").value.trim();

  const found = appState.assistanceTypes.find(a => a.type === typeKey);
  if (found) {
    found.requirements = rawItems.filter(i => i.trim() !== "");
    found.copies = copies;
    saveStorage(STORAGE_KEYS.ASSISTANCE_TYPES, appState.assistanceTypes);
    closeEditChecklistModal();
    renderAdminAssistance();
  }
}

function toggleAssistanceStatus(typeKey) {
  if (!appState.isOnline) { alert("You are offline. Cannot change assistance type status."); return; }
  const found = appState.assistanceTypes.find(a => a.type === typeKey);
  if (!found || !found.id) return;
  const newStatus = found.status === "Active" ? "Disabled" : "Active";
  window.adminUpdateAssistanceType(found.id, { status: newStatus }).then(() => {
    found.status = newStatus;
    saveStorage(STORAGE_KEYS.ASSISTANCE_TYPES, appState.assistanceTypes);
    renderAdminAssistance();
  }).catch(err => {
    alert("Failed to update assistance type: " + (err.message || "Please try again."));
  });
}

// 4. Barangay List (Wireframe 9f)
function renderAdminBarangays(filterText = "") {
  const container = document.getElementById("adminBarangaysContainer");
  if (!container) return;

  const filtered = appState.barangays.filter(b => b.toLowerCase().includes(filterText.toLowerCase()));
  container.innerHTML = filtered.map(b => `
    <span class="barangay-chip">
      ${b}
      <button type="button" class="btn-xs border-0 text-muted" onclick="removeBarangay('${b}')" style="background:none; cursor:pointer;">&times;</button>
    </span>
  `).join("");
}

function filterAdminBarangayList() {
  const val = document.getElementById("adminBarangayFilter").value;
  renderAdminBarangays(val);
}

function openAddBarangayModal() {
  document.getElementById("addBarangayModal").classList.remove("hidden");
}
function closeAddBarangayModal() {
  document.getElementById("addBarangayModal").classList.add("hidden");
}

function handleSaveNewBarangay(e) {
  e.preventDefault();
  const name = document.getElementById("newBarangayName").value.trim();
  if (name && !appState.barangays.includes(name)) {
    appState.barangays.push(name);
    appState.barangays.sort();
    saveStorage(STORAGE_KEYS.BARANGAYS, appState.barangays);
    closeAddBarangayModal();
    renderAdminBarangays();
    populateBarangayOptions();

    // Show confirmation alert
    const alertBox = document.getElementById("barangayAddedAlert");
    alertBox.classList.remove("hidden");
    setTimeout(() => alertBox.classList.add("hidden"), 3000);
  }
}

function removeBarangay(name) {
  if (confirm(`Remove barangay "${name}" from the searchable list?`)) {
    appState.barangays = appState.barangays.filter(b => b !== name);
    saveStorage(STORAGE_KEYS.BARANGAYS, appState.barangays);
    renderAdminBarangays();
    populateBarangayOptions();
  }
}

// 5. Signatories (Wireframe 12a)
function renderAdminSignatories() {
  const tbody = document.getElementById("adminSignatoriesTableBody");
  if (!tbody) return;

  tbody.innerHTML = appState.signatories.map(s => `
    <tr>
      <td class="font-weight-bold">${s.roleLabel}</td>
      <td>${s.name}</td>
      <td>${s.title}</td>
      <td class="text-right">
        <button type="button" class="btn btn-sm btn-outline-primary" onclick="openEditSignatoryModal('${s.key}')">Edit</button>
      </td>
    </tr>
  `).join("");
}

function openEditSignatoryModal(key) {
  const s = appState.signatories.find(x => x.key === key);
  if (!s) return;

  document.getElementById("editSignatoryKey").value = s.key;
  document.getElementById("editSignatoryRole").value = s.roleLabel;
  document.getElementById("editSignatoryName").value = s.name;
  document.getElementById("editSignatoryTitle").value = s.title;

  document.getElementById("editSignatoryModal").classList.remove("hidden");
}

function closeEditSignatoryModal() {
  document.getElementById("editSignatoryModal").classList.add("hidden");
}

function handleSaveSignatory(e) {
  e.preventDefault();
  const key = document.getElementById("editSignatoryKey").value;
  const s = appState.signatories.find(x => x.key === key);
  if (s) {
    s.name = document.getElementById("editSignatoryName").value.trim();
    s.title = document.getElementById("editSignatoryTitle").value.trim();
    saveStorage(STORAGE_KEYS.SIGNATORIES, appState.signatories);
    closeEditSignatoryModal();
    renderAdminSignatories();
  }
}

// 6. Rules and Settings (Wireframe 12b)
function renderAdminRules() {
  document.getElementById("ruleWaitingPeriod").value = appState.rules.waitingPeriodMonths || 3;
  document.getElementById("ruleGlValidity").value = appState.rules.glValidityDays || 9;
  document.getElementById("ruleLogoutTimeout").value = appState.rules.logoutTimeoutMinutes || 10;
  document.getElementById("ruleDraftRetention").value = appState.rules.keepDraftsDays || 30;
}

async function saveAdminRules(e) {
  e.preventDefault();
  if (!appState.isOnline) { alert("You are offline. Saving system settings requires a live connection."); return; }
  const status = document.getElementById("adminRulesStatus");
  const button = document.querySelector("#adminRulesForm button[type='submit']");
  if (appState.currentUser?.role !== "Administrator") {
    if (status) status.textContent = "Only an Administrator can change system settings.";
    return;
  }

  const payload = {
    waitingPeriodMonths: parseInt(document.getElementById("ruleWaitingPeriod").value, 10),
    glValidityDays: parseInt(document.getElementById("ruleGlValidity").value, 10),
    logoutTimeoutMinutes: parseInt(document.getElementById("ruleLogoutTimeout").value, 10),
    keepDraftsDays: parseInt(document.getElementById("ruleDraftRetention").value, 10)
  };

  const valid = Number.isInteger(payload.waitingPeriodMonths) && payload.waitingPeriodMonths >= 0 && payload.waitingPeriodMonths <= 24
    && Number.isInteger(payload.glValidityDays) && payload.glValidityDays >= 1 && payload.glValidityDays <= 365
    && Number.isInteger(payload.logoutTimeoutMinutes) && payload.logoutTimeoutMinutes >= 1 && payload.logoutTimeoutMinutes <= 1440
    && Number.isInteger(payload.keepDraftsDays) && payload.keepDraftsDays >= 1 && payload.keepDraftsDays <= 365;
  if (!valid) {
    if (status) status.textContent = "Enter valid values within the allowed ranges before saving.";
    return;
  }

  if (button) {
    button.disabled = true;
    button.textContent = "Saving settings...";
  }
  if (status) status.textContent = "Saving settings to the system...";

  try {
    if (typeof window.adminUpdateSettings !== "function") {
      throw new Error("Settings service unavailable");
    }
    await window.adminUpdateSettings(payload);
    if (status) status.textContent = "Settings saved to the system.";
  } catch (_) {
    if (status) status.textContent = "Settings could not be saved. Check your connection and try again.";
  } finally {
    if (button) {
      button.disabled = false;
      button.textContent = "Save settings";
    }
  }
}

function resetAdminRules() {
  renderAdminRules();
}

// Dropdown population helpers
function populateBarangayOptions() {
  const datalist = document.getElementById("barangayOptions");
  if (!datalist) return;
  datalist.innerHTML = appState.barangays.map(b => `<option value="${b}">`).join("");
}

function populateAgencyDropdowns() {
  const sel = document.getElementById("astPartnerAgency");
  if (!sel) return;
  const cur = sel.value;
  sel.innerHTML = `<option value="">Select partner agency</option>` + appState.agencies.map(a => `
    <option value="${a.name}">${a.name}</option>
  `).join("");
  if (cur) sel.value = cur;
}

// Change Password Modal
function openChangePasswordModal() {
  document.getElementById("userDropdown").classList.add("hidden");
  document.getElementById("changePasswordModal").classList.remove("hidden");
}
function closeChangePasswordModal() {
  document.getElementById("changePasswordModal").classList.add("hidden");
}
function handleChangePasswordSubmit(e) {
  e.preventDefault();
  const oldP = document.getElementById("chgOldPass").value;
  const newP = document.getElementById("chgNewPass").value;
  const confP = document.getElementById("chgConfirmPass").value;

  if (appState.currentUser && appState.currentUser.password !== oldP) {
    alert("Current password does not match.");
    return;
  }
  if (newP !== confP) {
    alert("New passwords do not match.");
    return;
  }

  appState.currentUser.password = newP;
  saveStorage(STORAGE_KEYS.CURRENT_USER, appState.currentUser);
  const u = appState.users.find(x => x.id === appState.currentUser.id);
  if (u) {
    u.password = newP;
    saveStorage(STORAGE_KEYS.USERS, appState.users);
  }

  closeChangePasswordModal();
  alert("Password changed successfully.");
}

// Session Timeout simulation (Wireframe 11c)
function handleSessionResume(e) {
  e.preventDefault();
  const pass = document.getElementById("resumePassword").value;
  if (appState.currentUser && appState.currentUser.password === pass) {
    document.getElementById("sessionTimeoutModal").classList.add("hidden");
  } else {
    alert("Incorrect password.");
  }
}

// ==========================================================================
// 15. SYSTEM INITIALIZATION ON DOM READY
// ==========================================================================

document.addEventListener("DOMContentLoaded", function () {
  initTransactionWorkspace();

  // Re-check required fields whenever the user edits a form control.
  const formRoot = document.getElementById("formInputsScrollArea");
  if (formRoot) {
    ["input", "change"].forEach(eventName => {
      formRoot.addEventListener(eventName, event => {
        if (event.target.matches("input, select, textarea")) {
          validateFormFieldsRemaining();
        }
      });
    });
  }
  initAuth();
  updateOnlineStatusUI();
  populateBarangayOptions();
  populateAgencyDropdowns();
});
