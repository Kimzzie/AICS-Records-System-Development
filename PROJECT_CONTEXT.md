# AICS Development Recovery — Project Context

Last updated: 2026-11-24
Workspace: `C:\AICS`
Project: AICS Client Record Management System for MSWDO, LGU Maramag
Current stage: Discovery / baseline inspection only. No application code changes have been made in this session.

## 1. Safety and environment boundaries

- The currently deployed Railway application is production and must remain untouched during this repair project.
- The repository folder `C:\AICS` is the isolated local clone selected for work.
- Do not run Railway deployments or deployment-triggering pushes.
- Do not apply migrations, execute DDL, alter data, or issue SQL writes against any current Supabase/production database.
- Do not run destructive Git commands or discard local data.
- Before editing code, create a separate Git repository for the repaired version (or a dedicated branch + new remote after agreeing on naming). Preserve the original clone as a recovery point.
- Never copy real AICS client data into source control, test fixtures, public issue descriptions, or prompts.
- Never place secret values in this file. Store only variable names and safe configuration guidance.
- Always check Git status before and after each phase.
- Keep an append-only decision/change log in this document after every meaningful local or remote action.
- Any Railway or Supabase deployment/environment work requires a clearly isolated staging resource, not the existing production resources.

## 2. User's desired workflow and tooling

Software-development phases/toolkit requested:
1. Planning: Superpowers, GitHub.
2. UI/UX: Figma.
3. Programming: ChatGPT, Context7, GitHub.
4. Backend/database: Supabase.
5. Testing: BrowserStack, Postman, Datadog.
6. Deployment: Railway, Vercel.

Available/connected tools in this ChatGPT context include Context7, Remote Desktop Commander, GitHub, Supabase, Mermaid Chart, plus Figma from earlier work. Use Context7 for current framework documentation. Use Remote Desktop Commander to inspect/edit local `C:\AICS` when explicitly requested. Use GitHub for repository work only after the new repository target and access are established. Use Supabase tooling only for read-only inspection of the current project until an isolated development database has been explicitly chosen and configured.

User says they have a Codex-related assistant/chat in VS Code. A workspace-scoped VS Code/Copilot session store was found, but only one VS Code session titled "New Chat" was present in that workspace store; the referenced chat transcript was not recovered. Do not claim to have read the Codex discussion. Ask user to share its summary/transcript if the information matters.

## 3. Repository and local environment baseline

Local folder exists and is accessible:
- `C:\AICS`
- Remote device: Windows device named `Zie`
- Remote Desktop Commander device ID: `18e9255c-098d-427b-a46b-28ca19396a85`

Git:
- Origin: `https://github.com/AicsSystem/AICS`
- Branch: `main`
- HEAD at inspection: `b17581f` (merge PR #19, enforce 30-character name limit).
- HEAD matched `origin/main` at initial inspection.
- Working tree had no tracked modifications; `.vs/` appeared untracked.
- 130 tracked files.
- Many remote feature/fix branches exist. Review their history before reinventing fixes.
- `Kimmy` branch exists at remote SHA `4d171c4`, but no conclusion about whether it is appropriate for repair work has been made.
- No local Git operations have modified tracked source files in this inspection.

App technology:
- Laravel 12, PHP ^8.2, Laravel Sanctum ^4.0.
- Frontend is plain HTML/CSS/JavaScript, not Flutter.
- Backend uses Laravel controllers/models and MySQL configuration.
- Current tracked files contain root-level historical frontend files and deployed frontend under `public/`.
- No `vendor/`, `node_modules/`, `composer.lock`, `tests/`, or `.env` existed during inspection.
- No PHP or Composer executable found on PATH. Node v24.22.3 and npm 11.19.1 available.
- The local Laravel app cannot yet run until PHP/Composer and dependencies are installed/configured.
- `.env.example` contains only placeholder development MySQL configuration (do not read or expose any future secret values).

Key top-level files:
- `public/index.html`, `public/script.js`, `public/style.css`, `public/aics-api.js`
- `app/Http/Controllers/Api/*`
- `app/Models/*`
- `routes/api.php`, `routes/web.php`
- `database/migrations/*`, `database/seeders/DatabaseSeeder.php`
- `railway.json`, `Procfile`, `README.md`, `README-LARAVEL.md`
- `UI/` contains prototype reference screenshots covering login, eligibility, intake form, document preview, records, reports, admin, drafts, and offline states.
- `public/index.html` references `/style.css`, `script.js`, and `/aics-api.js`.

Duplicate source observations:
- Root and public `script.js` are different; root version 132,121 bytes, public version 141,111 bytes.
- Root and public `index.html` are different; root version 128,657 bytes, public version 309,602 bytes.
- Root and public `style.css` had equal hashes at inspection.
- The deployed web root is `public/`; root-level files may be the earlier prototype/source. Confirm intended authority before consolidation.

## 4. Initial critical findings (inspection only; not yet fixed)

### 4.1 Confirmed JavaScript syntax break in API bridge
File: `public/aics-api.js`.
Command `node --check public/aics-api.js` fails at line 14:
```js
function token() { return sessionStorage.getItem(TOKEN_KEY)) || ""; }
```
Related malformed sessionStorage calls found:
- Line 14: extra closing parenthesis after `getItem`.
- Line 153: `sessionStorage.removeItem(TOKEN_KEY));`
- Line 171: `sessionStorage.setItem(TOKEN_KEY), result.token);`
- Lines 179, 195, 235, 364: `sessionStorage.removeItem(TOKEN_KEY));`
These are definite syntax defects and are a first repair target, but make fixes only after baseline/branch backup.

### 4.2 Potential integration gaps
- API routes expose `GET /drafts`, `POST /drafts`, `DELETE /drafts/{draft}`; the visible API bridge does not currently wire draft saving/loading/deletion into these routes. The main frontend contains prototype draft functions.
- `README-LARAVEL.md` itself notes draft management and some admin maintenance forms remain prototype/local until connected.
- The frontend has a `pendingTemporaryPassword` / first-login handler, but API login flow comments say it skips first-login password screen and the bridge call to store token is malformed. There may be a password-change UX mismatch.
- Bridge hooks the original functions then replaces `executeHomeSearch`, `executeSaveRecord`, `saveRecordCorrection`; compatibility with the actual prototype functions needs deliberate tests.
- `loadServerData()` currently fetches only `/transactions?per_page=100`, so records older than the first page are not loaded. Search API has a separate result limit of 50 and only searches transactions associated with matching client/beneficiary names.
- The frontend stores returned server data in localStorage while API auth token is in sessionStorage; identify which localStorage data remains authoritative vs cache and prevent sensitive cross-account leakage.
- Browser `online/offline` events update display state, but there is not yet clear evidence that queued changes are durably synchronized to server; do not treat the current UI as implemented offline-first behavior.
- Home eligibility API currently returns ineligible if the matched person appears in any client OR beneficiary transaction record, without a date-window calculation. This conflicts with the prototype states that show a 3-month countdown and eligibility after waiting period. Confirm official rule and entity semantics before changing.
- New transaction creation currently rejects a beneficiary if normalized full name exists anywhere in clients or beneficiaries. This appears overly restrictive for legitimate repeat/family scenarios and must be validated against approved workflow/business rules.
- Transaction creation creates a new Client and Beneficiary row each time, rather than reusing canonical person records. This can create duplicates, ambiguous history, and block legitimate use cases.
- Transaction number generation uses latest record ID under `whereYear(transaction_date, $year)` and row locking; race/collision handling needs review and preferably a dedicated counter/unique retry strategy. Note migration GL field uniqueness exists.
- Transaction update updates client/beneficiary rows shared with other transactions, so one edit may retroactively alter historical person data for prior records. Consider immutable transaction snapshots/version history in the design.
- `destroy()` writes an audit log then soft/hard deletes transaction based on model traits (needs model inspect) while audit log FK cascadeOnDelete means the log may be removed with the transaction. This can defeat audit trail preservation. Review before allowing deletes.
- Transaction update does not include transaction date in its fillable update mapping; verify UI requirements.
- Some admin UI forms may not have matching API bridge functions. Perform a full endpoint-to-UI action mapping.

### 4.3 Migration/build concerns
- Two migration files have identical timestamp prefix:
  - `2026_11_21_000001_create_aics_database_tables.php`
  - `2026_11_21_000001_create_aics_monthly_budgets_table.php`
  Laravel migration batch ordering/collision should be reviewed; ensure base tables migration always precedes monthly budgets migration. Do not rename migration files until confirming whether this DB migration has already run on any active environment.
- `railway.json` runs `php artisan migrate --force && php artisan db:seed --force && php artisan serve ...` at start/deploy. This is a production-impacting deployment mechanism. Never invoke it from this project repair phase.
- Seed data includes sample agency contact data and sample requirement lists; confirm which are only test data and which values are actual/approved before shipping.
- README says integration is incomplete and localStorage data is not migrated to MySQL.
- No automated tests currently tracked.

## 5. Backend business rules to validate

Known domain from HCI Discover and prototype:
- Differentiate requester/client from beneficiary.
- Validate beneficiary history and waiting-period rule.
- Assistance categories currently represented in seed data as Medical, Burial, Fire incident, Transportation, Food, Cash.
- UI mentions a configurable three-month waiting period.
- Roles in current Laravel app: Viewer, Staff, Senior staff, Administrator.
- Current frontend role matrix:
  - Viewer: Home, Records.
  - Staff: Home, New transaction, Records, Budget.
  - Senior staff: Home, New transaction, Records, Monthly report, Budget.
  - Administrator: Home, New transaction, Records, Monthly report, Admin, Budget.
- Current API routes allow authenticated Viewer read access to all `/transactions` list/search/show and `/lookups`; staff/senior/admin can create/update; admin can delete; senior/admin access monthly report; senior/admin can issue GL; admin sets monthly budget and manages accounts/master data.
- Confirm record visibility/row-level restrictions, rather than assume that authentication alone is sufficient.
- Clarify whether the waiting-period restriction applies to beneficiary, requester, household, assistance category, or any prior AICS transaction; and whether it has exceptions. Do not implement a name-only restriction without validated logic.
- Clarify GL sequencing, approval/finalization, edits after GL issue, budget accounting, cancel/void, and audit retention.

## 6. Supabase project inspection

Connected Supabase account showed one project:
- Name: `aics-link-dev`
- Project ref: `snwvsatztxylmgefdsfi`
- Region: `ap-southeast-1`
- Status: `ACTIVE_HEALTHY`
- Database engine: Postgres 17.12
- API URL: `https://snwvsatztxylmgefdsfi.supabase.co`

Read-only inspection showed a Supabase schema with 14 tables (all listed with RLS enabled), e.g.:
- profiles
- people
- assistance_categories
- assistance_subcategories
- target_sectors
- providers
- aics_transactions
- family_members
- transaction_assessments
- transaction_status_history
- transaction_documents
- gl_sequences
- audit_logs
- transaction_assistance_categories

Migration history on this Supabase project:
- 20261123222557 transaction_intake_snapshots_and_assistance_categories
- 20261123222635 create_aics_transaction_rpc
- 20261123223136 grant_transaction_assistance_category_access
- 20261123223240 fix_transaction_rpc_json_array_aliases

This Supabase schema is significantly different from the Laravel/MySQL schema in `C:\AICS`. The Laravel README and config indicate MySQL; source contains no Supabase SDK, Supabase CLI config, supabase folder, or Edge Functions. Supabase project may be a separate AICS-Link development variant. Do not assume it belongs to the exact deployed Laravel app until verifying Railway environment and repository history. Never connect app to this Supabase project or migrate it without explicit architecture decision.

Supabase advisors (read-only):
- Security warnings: `public.rls_auto_enable()` is SECURITY DEFINER and executable by anon and authenticated roles. Remediation: https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable and https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable
- Leaked password protection disabled. Remediation: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection
- Performance: 14 unindexed foreign keys; 12 unused indexes; several multiple permissive RLS policy warnings. These are advisory; don't alter until schema intent and staging environment understood.
- Health advisor returned no findings.
- No Supabase Edge Functions found.
- Log query used invalid SELECT * (restricted wildcard) and returned no data. If logs become necessary, specify explicit columns and a 24-hour window.

## 7. Figma design reference

Figma URL supplied by user:
https://www.figma.com/design/ZCCo6ILhkRhtRNEYsKZHa8/Prototype_Design_AICS-Client-Record-Management-System-for-the-MSWDO-of-Maramag?node-id=12-3&t=TBDrUDaXoeq2FqDu-1

File key: `ZCCo6ILhkRhtRNEYsKZHa8`
Starting node: `12:3` (Screens canvas)
Design session created in earlier conversation; use Figma as the UI/UX comparison reference.
Screen flow overview observed in metadata:
- Login; invalid credentials.
- Home search; new/returning; eligibility/not yet eligible; offline saved-copy states.
- New transaction stepper: Check record → Fill in form → Review and save → Print.
- Requirements checklist and prior record check.
- Form with live document previews.
- Review/possible duplicate warning/save/print.
- Records/history/detail/edit/reprint.
- Monthly report.
- Admin users, agencies, assistance types, barangays, signatories, rules/settings.
- Drafts, session timeout, offline indicators.
Do not modify this Figma file unless the user asks.

## 8. Recommended repair sequence

Phase 0 — Preserve & isolate
- Preserve original local clone and Git status.
- Establish new private GitHub repository (new name to be confirmed), push only the clean source baseline; exclude .vs, .env, local DBs, vendor/node_modules, and any sensitive content.
- Preserve source remote history without enabling Railway deployment workflows.
- Configure branch protection / no automatic production deployment.
- Keep existing production Railway project unchanged.
- Identify correct isolated staging DB. Do not use Supabase aics-link-dev until proven to be part of current Laravel app.

Phase 1 — Restore reproducible local environment
- Decide PHP 8.2+ installation method and Composer installation.
- Add composer.lock (after dependency install/review) and establish .env using placeholders/local DB only.
- Set up isolated local MySQL or disposable local SQLite if app supports it; use test data only.
- Run Laravel route listing, config checks, migrations in local isolated DB, and establish test harness. Do not run migrations on production.
- Capture baseline runtime errors.

Phase 2 — Repair frontend/API bridge
- Fix syntax defects first; run node --check after each correction.
- Verify login, token storage, logout, session restoration, password change.
- Verify API/DOM compatibility, app init ordering, network errors, duplicate submits.
- Map all UI actions to real API endpoints; identify localStorage-only remnants (drafts/admin/offline).
- Fix API pagination/search and prevent unauthorized stale local cache.
- Add JS validation/lint and smoke tests.

Phase 3 — Business logic and transaction data model
- Validate AICS rules and scenarios using Discover fieldwork, current workflow and instructor feedback.
- Resolve client/person identity model, requester vs beneficiary, repeated beneficiaries/family members, history, exact three-month logic, duplicate warning vs hard block.
- Validate GL sequencing, draft lifecycle, approved/issued/voided/corrected states, monthly budget calculations.
- Prevent retroactive mutations to historical transaction snapshots; make audit logs append-only and durable.
- Establish formal role/permission matrix and record access scope.
- Record every confirmed rule before coding.

Phase 4 — Backend and API reliability/security
- Refactor validation to request objects/service layer if appropriate.
- Add transactions, concurrency controls, DB constraints, and explicit error contracts.
- Enforce authorization server-side for every sensitive action.
- Review hard delete and audit log retention.
- Review seed behavior, admin operations, relationship ownership, report aggregation and pagination.
- Avoid broad rewrites without tests.

Phase 5 — Automated and manual testing
- Add PHPUnit feature/unit tests for each role and API.
- Add frontend tests and browser flows for core paths.
- Required cases: valid new client; returning beneficiary; prior record less than 3 months; exactly at waiting period boundary; >3 months; requester differs from beneficiary; different requester same beneficiary; multiple family members; duplicate submissions; malformed form; server/network timeout; offline cache staleness; unauthorized role; record correction; GL issue/reissue; insufficient monthly budget; report missing agency; draft ownership.
- Use Postman collections for APIs, BrowserStack/manual cross-browser for screens, Datadog only if appropriate for staged deployment.

Phase 6 — UI/UX alignment
- Compare all live screens with supplied Figma and UI reference images.
- Correct navigation, stepper, validation, statuses, loading/empty/error states, accessibility, responsive layout, print templates.
- Ensure prototype labels do not misrepresent functionality.

Phase 7 — Isolated staging
- New Railway service/environment + separate staging DB (or separately named isolated environment). Configure secrets via dashboard, not committed files.
- Disable/avoid auto-migrations or seed resets until staging deploy procedure verified.
- Run end-to-end UAT against synthetic data.

Phase 8 — Release readiness
- Security review, backup/rollback plan, migration review, UAT signoff, versioned release, deployment plan.
- User explicitly decides whether/when to promote the new build. Existing production stays untouched until deliberate decision.

## 9. Open questions / decisions pending
- What name should the new GitHub repository use? Prefer private initially.
- Do we keep the Laravel + MySQL architecture, or is the separate Supabase/Postgres project actually part of this same AICS application?
- What exactly is deployed on Railway currently (service + database environment), and how does that map to this clone?
- Is the local repository at `C:\AICS` the complete production source currently deployed? Git HEAD remote suggests recent integration but must confirm deployment commit.
- Need user-supplied Codex chat summary if any decisions or fixes were discussed there.
- What are the critical broken workflows first noticed by users? Build reproducible steps before changing code.
- Confirm AICS exact eligibility rule, including boundary, exceptions, and subject (beneficiary/client).
- Confirm if drafts must synchronize across devices, or only persist per user/browser.
- Confirm intended edit permissions after approval/GL issue and archival/deletion policy.

## 10. Current state of actions

Completed:
- [x] Connected to authorized Windows device.
- [x] Read-only listing of `C:\AICS`.
- [x] Checked Git status, remotes, branches, recent commits.
- [x] Inspected Laravel config, routes, API controllers, models, migrations, seeder, frontend API bridge.
- [x] Ran `node --check public/aics-api.js` and confirmed syntax error at line 14.
- [x] Identified migration timestamp collision.
- [x] Identified duplicate root/public frontend copies.
- [x] Confirmed no PHP/Composer, dependencies, .env, tests, or composer.lock currently available.
- [x] Read current Laravel 12 documentation via Context7.
- [x] Read Supabase skill and performed read-only inspection of accessible Supabase project, migrations, advisors, functions, and URL.
- [x] Created Mermaid workflow diagram for repair phases.

Not done:
- [ ] No source code edits.
- [ ] No Git branch, new repository, commit, or push.
- [ ] No PHP/Composer install.
- [ ] No DB schema/data writes.
- [ ] No Railway action.
- [ ] No Figma edits.
- [ ] No application testing beyond JS syntax check.

## 11. Change log

### 2026-11-24 — Initial recovery inspection
- Connected Remote Desktop Commander to Windows device `Zie`.
- Inspected `C:\AICS`.
- Confirmed `origin/main` at `b17581f`, initial worktree clean for tracked files apart from untracked `.vs/`.
- Read Laravel controllers, routes, core models, migrations, seeder, README, deployment config, frontend bridge and frontend entry.
- Confirmed JS bridge syntax errors; no fixes made.
- Supabase project `aics-link-dev` inspected read-only; its Postgres schema differs from Laravel/MySQL source.
- No production/deployment/DB mutations performed.


## 12. Documentation maintenance rule
- Update this file after each meaningful inspection, diagnosis, fix, test run, environment change, branch/repository action, or deployment action.
- Keep the date, changed files, rationale, tests run and outcomes, known regressions, and next steps explicit.
- Do not add credentials, personal client details, or production data. Use placeholders and synthetic data only.
- When a phase ends, add a short phase summary and mark its checklist items.


## 13. User instruction — persistent project record
- The user explicitly requests that all important project details, decisions, findings, actions, and next steps be stored in a location that can be accessed in future sessions.
- Canonical working record: `C:\AICS\PROJECT_CONTEXT.md`. Read this file at the beginning of future AICS development sessions before taking action.
- Update the canonical record after each meaningful action, both when work is performed through ChatGPT-connected tools and when the user reports work performed locally or in Codex.
- If the record grows substantially, split it into linked documents (for example `docs/architecture.md`, `docs/business-rules.md`, `docs/testing-plan.md`, `docs/decisions.md`) while keeping this file as the index and current project status.
- The user wants phase-by-phase work, clear change records, and continuity between sessions. Do not rely on conversational memory alone.


## 14. Phase 0 — repository owner verification and local isolation (2026-11-24)

### GitHub identity and repository-name availability
- Authenticated GitHub login verified: `Kimzzie` (user ID 181654551).
- Existing source repository verified: `AicsSystem/AICS`; connected account has admin/maintain/push permissions.
- Connected GitHub organization membership listing returned no organizations, although the existing `AicsSystem/AICS` organization repository is accessible with admin permission. Therefore the preferred owner for the new repository still needs explicit confirmation: personal owner `Kimzzie` or organization owner `AicsSystem`.
- Exact-name lookups for both `Kimzzie/AICS-Records-System-Development` and `AicsSystem/AICS-Records-System-Development` returned 404; repository search returned no results. The name is currently unused under both candidate owners (availability is a point-in-time observation).
- The connected GitHub toolset exposes repository read and content/branch operations but no create-repository action. GitHub CLI is not installed on the Windows device. No remote repository has been created. User will need to create it through GitHub UI or provide an approved creation method after choosing owner.

### Local isolation completed
- Created `C:\AICS-Records-System-Development` as a separate working copy.
- Copied the original `.git` history intact; HEAD remains `b17581f` on `main`, tracking the original main commit.
- Excluded `.vs/`, `.env`, `vendor/`, `node_modules/`, and `storage/logs/` from the copy.
- Preserved `PROJECT_CONTEXT.md` in the isolated folder.
- Renamed copied `origin` remote to `upstream` (fetch URL points to `AicsSystem/AICS`) and set its push URL to `DISABLED` to reduce accidental writes to source repository.
- Added `.vs/` to the copied repository's `.gitignore`.
- New isolated copy Git status: `main...upstream/main`, with only `.gitignore` modified and `PROJECT_CONTEXT.md` untracked at time of inspection. No commit made yet.
- Existing `C:\AICS` original folder remains unchanged by copy operation; no production or Railway action occurred.

### Pending Phase 0 actions
- User to choose new repository owner: `Kimzzie` or `AicsSystem`.
- Create private remote repository `AICS-Records-System-Development` under chosen owner.
- Add new remote as `origin` in isolated copy; keep `upstream` fetch-only/push-disabled.
- Review deployment workflows/configuration and ensure new repo cannot deploy to existing Railway production.
- Decide which documentation should be committed; keep sensitive data out.
- Create initial preservation commit and push history to the new private remote only after remote is ready and push target is verified.

### Safety status
- No source code modified.
- No commits or pushes made.
- No Railway actions.
- No database writes or migrations.
- No production system changes.


### 2026-11-24 — Phase 0 continuation: owner selected
- User explicitly selected personal GitHub owner `Kimzzie` for the new private repository `Kimzzie/AICS-Records-System-Development`.
- A fresh GitHub repository metadata lookup for that exact full name returned 404, confirming it does not currently exist or is not visible to the connected account at this check.
- Rechecked isolated working copy `C:\AICS-Records-System-Development`: branch `main`, HEAD `b17581f35d12b8712a5ee7aa5201ca7dbce4f7cb`; remotes remain `upstream` fetch-only to `https://github.com/AicsSystem/AICS` with push URL `DISABLED`.
- Working tree remains limited to modified `.gitignore` and untracked `PROJECT_CONTEXT.md`; no commit or push.
- The connected GitHub integration has no repository-creation operation, and GitHub CLI was previously confirmed absent. User must create the empty private repository through GitHub UI.
- Creation instructions: owner `Kimzzie`; repository name `AICS-Records-System-Development`; visibility `Private`; do not initialize with README, .gitignore, or license (keep it empty so preserved Git history can be pushed without unrelated initial commit).
- After creation, verify using GitHub repository metadata that owner is `Kimzzie`, full name is `Kimzzie/AICS-Records-System-Development`, visibility is `private`, and default branch/repository size indicate an empty repository. Only then add `origin` locally and verify both remotes and push target. Do not push until that verification is complete.
- No Railway or production changes.


### 2026-11-24 — Phase 0: new private remote verified and configured
- User supplied the new repository URL: `https://github.com/Kimzzie/AICS-Records-System-Development.git`.
- GitHub metadata verified:
  - Full name: `Kimzzie/AICS-Records-System-Development`
  - Owner login: `Kimzzie` (user ID 181654551)
  - Visibility: `private`
  - Admin/maintain/push permissions available to connected account
  - Repository size: 0; no default branch reported at metadata check, consistent with an empty repository.
- Independently verified the HTTPS remote with `git ls-remote --heads origin`; it returned no branch refs and exit code 0.
- Configured the isolated copy `C:\AICS-Records-System-Development`:
  - Added `origin` = `https://github.com/Kimzzie/AICS-Records-System-Development.git` for fetch and push.
  - Preserved `upstream` = `https://github.com/AicsSystem/AICS` for fetch only, with push URL `DISABLED`.
  - Confirmed `git remote -v` shows origin as new personal private repo and upstream push disabled.
- Deployment isolation:
  - Inspected repository root; no `.github/workflows` workflows found.
  - Found `railway.json` would automatically run `php artisan migrate --force && php artisan db:seed --force` on Railway start/deploy.
  - Modified only the isolated copy's `railway.json` to remove the deploy start command and deploy settings; retained only Nixpacks build builder. This prevents accidental migration/seed command from being inherited by a Railway deployment from this repository. It does not modify the existing Railway service or original source repository.
  - `Procfile` remains present, so deployment must still never be connected to Railway without explicit new staging setup and review.
- Current isolated Git status:
  - `M .gitignore` (adds `.vs/` exclusion)
  - `M railway.json` (removes auto migration/seed deploy command)
  - `?? PROJECT_CONTEXT.md`
  - HEAD remains `b17581f35d12b8712a5ee7aa5201ca7dbce4f7cb` on `main`.
- Secret/local artifact scan of tracked file paths found no tracked `.env`, vendor, node_modules, local DB, Visual Studio cache, or storage log files. The `.env.example` and `storage/logs/.gitignore` are expected tracked files.
- No commit or push has been made yet. The next action is to review the preservation commit content, confirm `PROJECT_CONTEXT.md` contains no secret or client details, make the local preservation commit, recheck remotes/status, then push `main` explicitly to `origin` only.
- Existing `C:\AICS`, original GitHub repository, live Railway deployment and current databases remain untouched.
