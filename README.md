# AICS Records Management System
**Assistance to Individuals in Crisis Situation**  
*Municipal Social Welfare and Development Office (MSWDO) · LGU Maramag, Bukidnon*

---

## Overview
A web-based records and case management system for processing AICS client transactions. Built on a Laravel 12 REST API backend with a vanilla JavaScript single-page frontend, backed by MySQL running on XAMPP.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Laravel 12, PHP, Laravel Sanctum (bearer token auth) |
| Frontend | Vanilla JS SPA (`public/script.js`, `public/aics-api.js`) |
| Database | MySQL via XAMPP |
| Auth | Per-tab session tokens stored in `sessionStorage` |
| Print | `@media print` CSS — no PDF library needed |

---

## Features

### Authentication & Access Control
- Role-based access: **Viewer**, **Staff**, **Senior Staff**, **Administrator**
- Per-tab session tokens (multiple tabs can be logged in as different users)
- Session timeout with lock screen and password resume
- First-time login forces password change

### New Transaction Wizard (4 Steps)
1. **Pre-check & Requirements** — select assistance type, verify requirements checklist, load returning client details
2. **Interactive Form & Live Document Preview** — 8 form sections with side-by-side live preview of GIS, COE, and GL documents; yellow highlights on active fields; currency-to-words conversion; age auto-calculation
3. **Review & Save** — duplicate client warning, final verification before commit
4. **Documents & Print Station** — select which documents to print (GIS / COE / GL); clean print layout strips navigation UI

### GL Number Assignment
GL numbers are assigned atomically by the backend using `DB::transaction()` with `lockForUpdate()` — no race conditions. The form shows `Pending...` during fill and displays the real GL after save.

Two-step GL workflow:
- **Staff** saves the record (backend assigns GL number)
- **Senior Staff / Admin** issues the GL (deducts from monthly budget)

### Records Management
- History grouped by year, sorted by latest GL number
- Filters: name, year, assistance type, partner agency
- View, reprint, and edit saved records with audit trail
- Recent Transactions panel on Home shows the 5 latest records

### Budget Dashboard
- Monthly budget cards with usage bars and color-coded states (normal / low / exhausted)
- Stat tiles: allocated, issued, remaining with usage percentage
- Quarterly totals view

### Monthly AICS Summary Report
- Grouped by partner agency with subtotals and grand total
- Flags transactions missing a partner agency
- Print-ready layout for accounting and audit submission

### Administration Panel (Admin only)
- Users & roles: add, edit, enable/disable accounts
- Partner agencies: add/edit (prevents deletion if tied to records)
- Assistance types: configure requirements and copy counts
- Barangay list management
- Signatories: names and titles printed on documents
- System rules: waiting period, GL validity days, logout timeout, draft retention

### Offline Protection
- `navigator.onLine` detects real network status
- All write operations guarded by `offlineWriteGuard()` — no silent data loss

---

## Local Development Setup

### Prerequisites
- XAMPP (PHP 8.2+, MySQL)
- Composer

### Steps

```bash
# 1. Clone the repo
git clone https://github.com/Kimzzie/AICS-Records-System-Development.git
cd AICS-Records-System-Development

# 2. Install dependencies
composer install

# 3. Configure environment
cp .env.example .env
# Edit .env: set DB_DATABASE, DB_USERNAME, DB_PASSWORD

# 4. Generate app key and run migrations
php artisan key:generate
php artisan migrate

# 5. Start the server
php artisan serve
```

Then open `http://localhost:8000` in your browser.

---

## Project Structure

```
├── app/Http/Controllers/Api/   # REST API controllers
├── app/Http/Middleware/        # Auth and role middleware
├── database/migrations/        # Schema definitions
├── public/
│   ├── index.html              # SPA shell
│   ├── script.js               # All UI logic and state
│   ├── aics-api.js             # API client and DOM population
│   ├── style.css               # All styles including print layout
│   └── logo.png                # LGU Maramag seal
├── routes/api.php              # API route definitions
└── .env                        # Local environment config (gitignored)
```

---

## Default Credentials

| Role | Username | Password |
|---|---|---|
| Administrator | `admin` | set on first login |

> First login prompts a mandatory password change.

---

*MSWDO · LGU Maramag, Bukidnon*
