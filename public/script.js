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
  IS_ONLINE: "aics_is_online"
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
  drafts: [
    {
      id: "draft-1",
      clientName: "Maria Santos",
      beneficiaryName: "Juan Santos",
      assistance: "Medical",
      lastSaved: "Today, 10:42 AM",
      formData: null // Will resume into form
    },
    {
      id: "draft-2",
      clientName: "Pedro Reyes",
      beneficiaryName: "Ana Reyes",
      assistance: "Burial",
      lastSaved: "Yesterday, 3:15 PM",
      formData: null
    }
  ]
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
  drafts: loadStorage(STORAGE_KEYS.DRAFTS, SEED_DATA.drafts),
  agencies: loadStorage(STORAGE_KEYS.AGENCIES, SEED_DATA.agencies),
  barangays: loadStorage(STORAGE_KEYS.BARANGAYS, SEED_DATA.barangays),
  signatories: loadStorage(STORAGE_KEYS.SIGNATORIES, SEED_DATA.signatories),
  rules: loadStorage(STORAGE_KEYS.RULES, SEED_DATA.rules),
  assistanceTypes: loadStorage(STORAGE_KEYS.ASSISTANCE_TYPES, SEED_DATA.assistanceTypes),
  isOnline: loadStorage(STORAGE_KEYS.IS_ONLINE, true),
  currentTxnStep: 1,
  activePreviewDoc: "gis",
  activeReviewDoc: "gis",
  activeStep4Doc: "gl",
  currentEditingRecordGl: null,
  step1AssistanceType: "Medical",
  lastSavedRecord: null
};

// ==========================================================================
// 2. CURRENCY & NUMBER TO WORDS UTILITY (Exact Official Capitalized Format)
// ==========================================================================

function numberToWords(amount) {
  const num = parseInt(amount, 10);
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

function showAuthView() {
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
  "Viewer": ["home", "records"],
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

  const allowedTabs = ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS["Staff"];

  if (navHome) navHome.classList.toggle("hidden", !allowedTabs.includes("home"));
  if (navNewTxn) navNewTxn.classList.toggle("hidden", !allowedTabs.includes("new-transaction"));
  if (navRecords) navRecords.classList.toggle("hidden", !allowedTabs.includes("records"));
  if (navBudget) navBudget.classList.toggle("hidden", !allowedTabs.includes("budget"));
  if (navMonthly) navMonthly.classList.toggle("hidden", !allowedTabs.includes("monthly-report"));
  if (navAdmin) navAdmin.classList.toggle("hidden", !allowedTabs.includes("admin"));
}

function canCreateTxn() {
  const role = appState.currentUser ? appState.currentUser.role : "Staff";
  return role !== "Viewer";
}

function setAuthenticatedUser(user) {
  appState.currentUser = user;
  const issueGlButton = document.getElementById("btnIssueGuaranteeLetter");
  if (issueGlButton) issueGlButton.classList.toggle("hidden", !["Administrator", "Senior staff"].includes(user.role));
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

  // Load Home Tab
  navigateToTab("home");
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
    if (appState.currentTxnStep === 1) {
      initStep1Check();
    }
  } else if (tabName === "records") {
    populateAgencyFilterDropdown();
    filterRecordsList();
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
  appState.isOnline = !appState.isOnline;
  saveStorage(STORAGE_KEYS.IS_ONLINE, appState.isOnline);
  updateOnlineStatusUI();
}

function updateOnlineStatusUI() {
  const btn = document.getElementById("onlineStatusBtn");
  const txt = document.getElementById("onlineStatusText");
  const banner = document.getElementById("offlineBanner");
  const toast = document.getElementById("syncToast");

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
    // NOT YET ELIGIBLE (Wireframe 2c)
    resultArea.innerHTML = `
      <div class="card eligibility-card not-eligible p-4">
        <div class="eligibility-header-line">
          <span class="eligibility-person-name">${clientName}</span>
          <span class="client-badge-pill returning">Returning client</span>
        </div>
        <div class="eligibility-alert-box">
          <div class="eligibility-alert-icon">!</div>
          <div>
            <strong>Not yet eligible: ${waitingMonths}-month waiting period</strong><br>
            <span class="text-sm">${clientName} was last served on ${latestRec.date}. The waiting period applies to every assistance type with no exception. She can come back on ${formatDateDisplay(eligibleDate)}.</span>
          </div>
        </div>
        <div class="waiting-countdown-strip">
          <span>Last served: <strong>${latestRec.date} · ${latestRec.service} · GL ${latestRec.glNo}</strong></span>
          <span>Waiting period ends: <strong class="text-danger">${formatDateDisplay(eligibleDate)}</strong></span>
          <span>Days remaining: <strong class="text-danger">${daysRemaining} days</strong></span>
        </div>
        <div class="eligibility-actions-row">
          <button type="button" class="btn btn-outline-secondary" onclick="openRecordDetail('${latestRec.glNo}')">View previous record</button>
          <button type="button" class="btn btn-secondary" disabled title="Unavailable until waiting period passes">Start new transaction</button>
          <span class="text-xs text-danger ml-2">Unavailable until ${formatDateDisplay(eligibleDate)}</span>
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

function initStep1Check() {
  if (!appState.step1ClientName) {
    appState.step1ClientName = "Maria Santos";
    appState.step1BeneficiaryName = "Juan Santos (son)";
  }
  updateStep1Display();
  renderAssistanceChecklist(appState.step1AssistanceType || "Medical");
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
  const found = appState.assistanceTypes.find(a => a.type.toLowerCase().startsWith(astType.toLowerCase()))
    || appState.assistanceTypes[0];

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

  if (unchecked.length === 0) {
    // Complete (Wireframe 3a)
    btn.disabled = false;
    btn.className = "btn btn-continue-active";
    if (warning) warning.classList.add("hidden");
  } else {
    // Incomplete (Wireframe 3b)
    btn.disabled = true;
    btn.className = "btn btn-continue-disabled";
    if (warning) {
      warning.classList.remove("hidden");
      const word = unchecked.length === 1 ? "1 required document is missing" : `${unchecked.length} required documents are missing`;
      if (warningCount) warningCount.textContent = word;
    }
  }
}

function handleStep1BeneficiaryChange(e) {
  appState.step1BeneficiaryName = e.target.value.trim();
  runStep1BeneficiaryEligibilityCheck();
}

function runStep1BeneficiaryEligibilityCheck() {
  const bName = (appState.step1BeneficiaryName || "").toLowerCase();
  const resultDiv = document.getElementById("step1EligibilityResult");
  if (!resultDiv) return;

  // Check if beneficiary has an active 3-month waiting period in records
  let match = null;
  if (bName) {
    match = appState.records.find(r => {
      const rc = (r.client.fullName || `${r.client.firstName} ${r.client.lastName}`).toLowerCase();
      const rb = (r.beneficiary.fullName || `${r.beneficiary.firstName} ${r.beneficiary.lastName}`).toLowerCase();
      return rc.includes(bName) || rb.includes(bName);
    });
  }

  if (match) {
    const waitingMonths = appState.rules.waitingPeriodMonths || 3;
    const servedDate = new Date(match.dateIso || match.date);
    const eligibleDate = new Date(servedDate);
    eligibleDate.setMonth(eligibleDate.getMonth() + waitingMonths);
    const diffTime = eligibleDate.getTime() - new Date().getTime();
    const daysRem = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (daysRem > 0) {
      resultDiv.innerHTML = `
        <div class="alert alert-danger" style="border-radius: 8px;">
          <span class="mr-2">&#9888;</span>
          <div>
            <strong>Beneficiary waiting period active</strong><br>
            <span class="text-xs">Beneficiary was last served on ${match.date} (${match.service}). Eligible again on ${formatDateDisplay(eligibleDate)} (${daysRem} days remaining).</span>
          </div>
        </div>
      `;
      return;
    }
  }

  const checkText = bName
    ? "Both names were checked. The client can continue to the requirements."
    : "Client eligibility verified. The client can continue to the requirements.";

  resultDiv.innerHTML = `
    <div class="precheck-result-box">
      <div class="precheck-result-icon">&#10003;</div>
      <div class="precheck-result-texts">
        <strong>No previous record found</strong>
        <span>${checkText}</span>
      </div>
    </div>
  `;
}

function updateStep1Display() {
  const cEl = document.getElementById("step1ClientDisplay");
  const bInput = document.getElementById("step1BeneficiaryInput");
  const previousRecordColumn = document.getElementById("step1PreviousRecordColumn");
  const requirementsColumn = document.getElementById("step1RequirementsColumn");
  const clientName = appState.step1ClientName || "Maria Santos";

  if (cEl) cEl.textContent = clientName;
  if (bInput) bInput.value = appState.step1BeneficiaryName || "";

  // Match the PR #15 layout: client details stay in the left column,
  // and the requirements checklist stays in the right column.
  if (previousRecordColumn) previousRecordColumn.classList.remove("hidden");
  if (requirementsColumn) {
    requirementsColumn.classList.remove("col-md-4", "col-md-12");
    requirementsColumn.classList.add("col-md-8");
  }

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
  appState.currentTxnStep = 2;
  updateStepperUI(2);

  document.getElementById("txnStep1").classList.add("hidden");
  document.getElementById("txnStep2").classList.remove("hidden");
  document.getElementById("txnStep3").classList.add("hidden");
  document.getElementById("txnStep4").classList.add("hidden");
  document.getElementById("txnStatusBar").classList.remove("hidden");

  // Generate next sequential GL Number
  const nextGl = generateNextGlNumber();
  document.getElementById("formGlNo").value = nextGl;

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
    const step1Name = appState.step1ClientName || (document.getElementById("step1ClientDisplay") ? document.getElementById("step1ClientDisplay").textContent.trim() : "Maria Santos");
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

    const cDisplay = appState.step1ClientName || "Maria Santos";
    const statusNote = bName
      ? `Previous record checked: none found for "${cDisplay}" and "${bName}". Requirements are complete.`
      : `Previous record checked: none found for "${cDisplay}". Requirements are complete.`;
    document.getElementById("txnStatusText").textContent = statusNote;
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

function onAmountChanged(val) {
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
    // Start with the client only. Additional household members are added by the user.
    tbody.innerHTML = `
      <tr class="family-client-row">
        <td><input type="text" class="form-control form-control-sm" value="${clientFullName}" oninput="updateLivePreview()"></td>
        <td><input type="text" class="form-control form-control-sm" value="Client" readonly></td>
        <td><input type="number" class="form-control form-control-sm" value="${clientAge}" oninput="updateLivePreview()"></td>
        <td><input type="text" class="form-control form-control-sm" value="${clientCivil}" oninput="updateLivePreview()"></td>
        <td><input type="text" class="form-control form-control-sm" value="${clientOcc}" oninput="updateLivePreview()"></td>
        <td><input type="text" class="form-control form-control-sm" value="${clientSal}" oninput="updateLivePreview()"></td>
        <td class="text-center text-muted">—</td>
      </tr>
    `;
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

  const controls = Array.from(formRoot.querySelectorAll("input, select, textarea"))
    .filter(isVisibleField);

  // Every visible editable text/date/number/select/textarea field is required.
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

  // At least one target sector and one financial assistance type must be selected.
  ["targetSector", "finAssistance"].forEach(name => {
    const group = controls.filter(f => f.type === "checkbox" && f.name === name);
    if (group.length && !group.some(f => f.checked)) {
      missing.push({ id: group[0].id, label: name === "targetSector" ? "Category > Target sector" : "Assistance > Financial assistance", field: group[0] });
    }
  });

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

function scrollToSection(secId) {
  const el = document.getElementById(secId);
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function onFormScroll() {
  const container = document.getElementById("formInputsScrollArea");
  const sections = ["sec1", "sec2", "sec3", "sec4", "sec5", "sec6", "sec7", "sec8"];

  for (const s of sections) {
    const el = document.getElementById(s);
    if (el) {
      const rect = el.getBoundingClientRect();
      if (rect.top >= 50 && rect.top <= 250) {
        document.querySelectorAll(".section-tracker-item").forEach(item => {
          item.classList.toggle("active", item.getAttribute("data-sec") === s);
        });
        break;
      }
    }
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
  appState.prefillFromRecord = null;
  appState.step1ClientName = "";
  appState.step1BeneficiaryName = "";
  appState.currentTxnStep = 1;
  updateStepperUI(1);

  document.getElementById("txnStep4").classList.add("hidden");
  document.getElementById("txnStep3").classList.add("hidden");
  document.getElementById("txnStep2").classList.add("hidden");
  document.getElementById("txnStep1").classList.remove("hidden");
  document.getElementById("txnStatusBar").classList.add("hidden");
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

function saveCurrentDraftManually() {
  const cLast = document.getElementById("cLastName").value.trim();
  const cFirst = document.getElementById("cFirstName").value.trim();
  const clientName = `${cFirst} ${cLast}`.trim() || "Untitled Client";
  const bName = document.getElementById("bFirstName").value.trim() || clientName;
  const ast = document.getElementById("astProvided").value || "Medical";

  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const draftObj = {
    id: `draft-${Date.now()}`,
    clientName: clientName,
    beneficiaryName: bName,
    assistance: ast,
    lastSaved: `Today, ${timeStr}`,
    timestamp: Date.now()
  };

  appState.drafts.unshift(draftObj);
  saveStorage(STORAGE_KEYS.DRAFTS, appState.drafts);
  updateDraftsCountBadge();

  // Show toast & pill badge
  const pill = document.getElementById("draftSavedPill");
  pill.classList.remove("hidden");
  document.getElementById("draftSavedTime").textContent = timeStr;

  setTimeout(() => {
    pill.classList.add("hidden");
  }, 4000);
}

function confirmDiscardDraft() {
  if (confirm("Discard changes? Any unsaved edits will be lost and you will be returned to Step 1.")) {
    startBrandNewTransaction();
  }
}

function updateDraftsCountBadge() {
  const count = appState.drafts.length;
  document.getElementById("draftsCountBadge").textContent = count;
}

function openDraftsModal() {
  document.getElementById("userDropdown").classList.add("hidden");
  const modal = document.getElementById("draftsModal");
  modal.classList.remove("hidden");
  renderDraftsTable();
}

function closeDraftsModal() {
  document.getElementById("draftsModal").classList.add("hidden");
}

function renderDraftsTable() {
  const tbody = document.getElementById("draftsTableBody");
  if (!tbody) return;

  if (appState.drafts.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted p-4">No drafts saved on this computer.</td></tr>`;
    return;
  }

  tbody.innerHTML = appState.drafts.map(d => `
    <tr>
      <td class="font-weight-bold">${d.clientName}</td>
      <td>${d.beneficiaryName}</td>
      <td><span class="badge badge-subtle">${d.assistance}</span></td>
      <td class="text-muted text-xs">${d.lastSaved}</td>
      <td class="text-right">
        <button type="button" class="btn btn-sm btn-outline-primary mr-1" onclick="resumeDraft('${d.id}')">Resume</button>
        <button type="button" class="btn btn-sm btn-outline-secondary text-danger" onclick="deleteDraft('${d.id}')">Delete</button>
      </td>
    </tr>
  `).join("");
}

function resumeDraft(draftId) {
  closeDraftsModal();
  const d = appState.drafts.find(x => x.id === draftId);
  if (d) {
    navigateToTab("new-transaction");
    document.getElementById("step1ClientName").value = d.clientName;
    proceedToStep2Form();
  }
}

function deleteDraft(draftId) {
  appState.drafts = appState.drafts.filter(x => x.id !== draftId);
  saveStorage(STORAGE_KEYS.DRAFTS, appState.drafts);
  updateDraftsCountBadge();
  renderDraftsTable();
}

function removeDraftByClient(name) {
  appState.drafts = appState.drafts.filter(d => d.clientName.toLowerCase() !== name.toLowerCase());
  saveStorage(STORAGE_KEYS.DRAFTS, appState.drafts);
  updateDraftsCountBadge();
}

// ==========================================================================
// 12. TAB 3: RECORDS LISTING & EDIT/CORRECT ENGINE (Wireframe 6a, 6d, 7a, 7b)
// ==========================================================================

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
                <th>Partner agency</th>
                <th>Worker</th>
                <th class="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              ${list.map(r => `
                <tr>
                  <td class="font-weight-bold">${r.glNo}</td>
                  <td>${r.date}</td>
                  <td>${r.client.fullName}</td>
                  <td>${r.beneficiary.fullName}</td>
                  <td>${r.client.barangay}</td>
                  <td><span class="badge badge-subtle">${r.service}</span></td>
                  <td class="font-weight-bold">${formatCurrency(r.amount)}</td>
                  <td>${r.partnerAgency || "<span class='text-danger'>None</span>"}</td>
                  <td>${r.worker}</td>
                  <td class="text-right">
                    <button type="button" class="btn btn-sm btn-outline-primary mr-1" onclick="openRecordDetail('${r.glNo}')">View</button>
                    ${canEditRecord() ? `<button type="button" class="btn btn-sm btn-outline-secondary" onclick="openEditRecordModal('${r.glNo}')">Edit or correct</button>` : ""}
                  </td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }).join("");
}

function canEditRecord() {
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

  switchAdminSubTab("users");
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
          <button type="button" class="btn btn-sm btn-outline-secondary mr-1" onclick="editUserRolePrompt('${u.id}')">Edit</button>
          ${u.status === "Active"
            ? `<button type="button" class="btn btn-sm btn-outline-secondary text-danger" onclick="toggleUserStatus('${u.id}', 'Disabled')" ${isLastAdmin ? "disabled title='Cannot disable last administrator'" : ""}>Disable</button>`
            : `<button type="button" class="btn btn-sm btn-outline-primary" onclick="toggleUserStatus('${u.id}', 'Active')">Enable</button>`
          }
        </td>
      </tr>
    `;
  }).join("");
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

function handleSaveNewUser(e) {
  e.preventDefault();
  const name = document.getElementById("newUserFullName").value.trim();
  const uname = document.getElementById("newUserName").value.trim().toLowerCase();
  const role = document.getElementById("newUserRole").value;
  const tempPass = document.getElementById("newUserTempPass").value;

  const exists = appState.users.some(u => u.username.toLowerCase() === uname);
  if (exists) {
    document.getElementById("addUserErrorAlert").classList.remove("hidden");
    return;
  }

  const newUser = {
    id: `usr-${Date.now()}`,
    name: name,
    username: uname,
    role: role,
    status: "Active",
    password: tempPass,
    mustChangePass: true
  };

  appState.users.push(newUser);
  saveStorage(STORAGE_KEYS.USERS, appState.users);
  closeAddUserModal();
  renderAdminUsers();
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
  const found = appState.assistanceTypes.find(a => a.type === typeKey);
  if (found) {
    found.status = found.status === "Active" ? "Disabled" : "Active";
    saveStorage(STORAGE_KEYS.ASSISTANCE_TYPES, appState.assistanceTypes);
    renderAdminAssistance();
  }
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

function saveAdminRules(e) {
  e.preventDefault();
  appState.rules.waitingPeriodMonths = parseInt(document.getElementById("ruleWaitingPeriod").value, 10);
  appState.rules.glValidityDays = parseInt(document.getElementById("ruleGlValidity").value, 10);
  appState.rules.logoutTimeoutMinutes = parseInt(document.getElementById("ruleLogoutTimeout").value, 10);
  appState.rules.keepDraftsDays = parseInt(document.getElementById("ruleDraftRetention").value, 10);

  saveStorage(STORAGE_KEYS.RULES, appState.rules);
  alert("Settings saved successfully.");
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
