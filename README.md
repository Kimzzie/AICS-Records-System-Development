# AICS Records Management System
**Assistance to Individuals in Crisis Situation**  
*Municipal Social Welfare and Development Office (MSWDO) · LGU Maramag, Bukidnon*

---

## 📌 Overview
This system has been converted and developed from the complete UI prototype and wireframes located in `F:\AICS System Prototype`. Built using pure **HTML5, CSS3, and JavaScript**, it is completely self-contained, runs offline and in any modern web browser without dependencies, and persists data across sessions using `localStorage`.

---

---

## ✨ System Features & Wireframe Alignments

### 1. Authentication & Security
- **Split-Screen Login** with official LGU Maramag seal and branding.
- **First-Time Login**: Prompts user to change temporary password (`11a`).
- **Account Disabled Notification**: Prevents disabled accounts from signing in (`11b`).
- **Session Timeout Protection**: Lock screen with password resume (`11c`).
- **User Profile Menu**: Quick access to drafts, password change, and logout (`11d`).

### 2. Home & 3-Month Waiting Period Rule Engine
- **Global Search**: Search client or beneficiary by name with 3-character minimum check (`10h`).
- **Eligibility Verification**:
  - **Returning Client within 3 Months**: Displays alert with last served date, assistance type, return date, and exact remaining days (`2c`, test with `Rosa Cruz`).
  - **Eligible Returning Client**: Displays green status badge when > 3 months have passed, with option to prefill returning client details (`2b`, test with `Elena Garcia`).
  - **New Client**: Confirms no previous record found and allows direct continuation (`2e`).
- **Recent Transactions Feed**: Quick table of latest served clients.

### 3. New Transaction Stepper (4 Steps)
- **Step 1: Record Verification & Requirements Checklist**
  - Assistance types: *Medical, Burial, Fire incident, Transportation, Food, Cash*.
  - Dynamic checklist with mandatory verification before proceeding (`3a`, `3b`).
  - Option to load returning client details from previous record (`10i`, `10j`).
- **Step 2: Interactive Form & Live Document Synchronization**
  - 8 Form Sections: *Transaction Details, Client, Beneficiary, Category, Family Composition, Assistance & GL, Case Summary, Sign-off*.
  - **Synchronous Live Preview**: Side-by-side view with instant reactive yellow fill highlights on:
    - **General Intake Sheet (GIS)** (Complete official MSWDO format)
    - **Certificate of Eligibility (COE)**
    - **Guarantee Letter (GL)**
  - Automated currency-to-words converter (e.g. `2,000` &rarr; `TWO THOUSAND PESOS ONLY`).
  - Automated Age calculation from Birthdate.
  - "Beneficiary is the same as the client" toggle with field locking (`10m`).
  - Searchable Maramag Barangay dropdown (`10k`).
  - Real-time missing field tracking bar.
  - Draft save (`10b`) & discard confirmation dialog (`10a`).
- **Step 3: Review and Save**
  - Verification summary and duplicate record warning alert (`5b`).
  - Final document verification before saving (`5a`).
- **Step 4: Documents Saved & Printing Station**
  - Guarantee Letter number generated sequentially (`0993-2026`, etc.).
  - Document selection checkboxes (GIS, COE, GL) (`5c`).
  - Clean `@media print` layout formatting documents to standard physical paper with seal and signature lines, removing screen navigation UI.
  - Sign and stamp physical reminder (`5d`).

### 4. Records Management
- History grouped by year accordion (*2026, 2025*) (`6a`).
- Filters: Search name, Year, Assistance type, Partner agency.
- **View Record Detail Modal**: Complete summary, 3-month countdown date, and one-click reprints (`6d`, `6e`).
- **Edit or Correct Saved Record Modal**: Edit Name, Barangay, Amount (with auto-word updates), and Partner Agency with change log audit trail (`7a`, `7b`).

### 5. Monthly Reports Module (Senior Staff & Admin)
- Restricted screen for standard Staff (`8c`).
- Grouped by Partner Agency (*Bupharco Pharmacy, King David Pharmacy, Bongcas Holy Child Hospital, St. Joseph Hospital*).
- Subtotals per agency and grand total calculation (`8a`).
- Warning for transactions missing partner agency (`8b`, test with `Jose Santos`).
- Dedicated print layout for accounting and audit submission (`8d`).

### 6. Administration Panel (Admin Only)
- **Users and Access**: Add user, edit roles, enable/disable accounts (prevents disabling last admin) (`9a`, `9b`, `12e`, `12f`).
- **Partner Agencies**: Add/edit agencies, prevents deletion if agency is tied to saved records (`9d`, `12c`).
- **Assistance Types**: Configure requirements and copy counts per assistance type (`9e`, `12d`).
- **Barangay List**: Search and add Maramag barangays (`9f`).
- **Signatories**: Configure names and titles on documents (`12a`).
- **Rules and Settings**: Configure waiting period months (3), GL validity days (9), logout timeout, draft retention (`12b`).

### 7. Offline / Online Simulation
- Navbar switch toggles between Online and Offline modes.
- Offline mode indicators (`10d`).
- Automatic synchronization animation and confirmation toast upon reconnection (`10e`, `10f`).
