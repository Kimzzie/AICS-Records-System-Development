# AICS Records — UX Contract

> This file records shared interface behavior and its source references. It does not replace authoritative MSWDO policy, API authorization, or database constraints. Visual values and rationale live in [DESIGN.md](DESIGN.md).

## Product context

- **Audience:** MSWDO personnel using AICS workflows at the LGU Maramag office; desktop computers are the primary operating environment.
- **Primary jobs:** Find and verify a client/beneficiary, check AICS history and requirements, enter a transaction, review generated documents, save the record, print, search/correct records, and manage permitted administrative data.
- **Locales:** Current interface language is English. There is no centralized locale provider documented in this application.
- **Accessibility target:** Use WCAG 2.2 AA as the design target for semantic controls, keyboard operation, visible focus, accessible names, status announcements, and focus restoration. Runtime verification remains required.

## Business-context sources

| Domain / scope | Authoritative source in this repository | Source type | Reviewed |
|---|---|---|---|
| AICS workflow and waiting-period identity matching | `PROJECT_CONTEXT.md`, Phase 3–4 decisions | Maintained project decision record | 2026-11-25 |
| Role and route access | `routes/api.php`, `public/script.js` (`ROLE_PERMISSIONS`) | Server routes and frontend navigation implementation | 2026-11-25 |
| Account-active and password-change enforcement | `app/Http/Middleware/EnsureActiveUser.php`, `EnsurePasswordChanged.php`, `bootstrap/app.php` | Server authorization implementation | 2026-11-25 |
| Draft ownership and retention | `docs/superpowers/specs/2026-11-25-transaction-drafts-design.md`, `app/Models/TransactionDraft.php`, `TransactionController.php` | Approved workflow contract and backend implementation | 2026-11-25 |
| Transaction form data contract | `TransactionController.php`, `public/aics-api.js`, `public/index.html` | API and frontend implementation | 2026-11-25 |
| Data privacy / LGU DPO approval | No authoritative privacy approval document is present in this repository | Open governance dependency | Not verified |

When repository implementation and an authoritative office policy differ, office policy and approved domain/API contracts take precedence. Do not infer new AICS eligibility or data-sharing policy from UI behavior.

## Visual contract

- **Design reference:** [DESIGN.md](DESIGN.md)
- **Runtime token owner:** `public/style.css` root CSS custom properties.
- **Mapping:** `DESIGN.md` records the current runtime values; no second theme package is maintained.
- **Theme:** Current interface is a light product surface; no alternate theme provider is documented.
- **Canonical UI owner:** Existing vanilla HTML/CSS/JavaScript markup and behavior in `public/index.html`, `public/style.css`, and `public/script.js`. Reuse the existing patterns; do not add a UI framework or duplicate component system without an approved architecture change.

## Canonical UI map

| Capability | Canonical owner | Source of truth | Allowed variants | Verification |
|---|---|---|---|---|
| Top navigation / tabs | `navigateToTab()` and header markup | RBAC implementation and role permissions | Role-filtered destinations | Keyboard + role regression tests |
| Table Selection | Not currently implemented; do not add a screen-local selection pattern | No bulk row-selection workflow is defined | Not applicable | Revisit only when a bulk-selection workflow is approved |
| Transaction section navigation | Native buttons in `#sectionsTrackerList` | `scrollToSection()`, `updateActiveFormSection()` | Desktop vertical list / narrow horizontal strip | Keyboard + scroll test |
| Form | Step 2 markup and `formInputsScrollArea` | API transaction payload and validation rules | Create / resume / correction | Form validation + draft restore tests |
| Select/Listbox | Native `<select>` where currently used | Existing form data contract | Native platform control | Keyboard + open-popup browser check |
| Date | Native `<input type="date">` | Date-only API serialization | Native platform picker | Keyboard + supported browser locale check |
| Search | Existing page-specific inputs and handlers | API search/lookup contracts | Home identity lookup / records filter | Clear, pending, error, and no-results checks |
| Scrollbar | Global application stylesheet | `public/style.css` overflow and scrollbar rules | Native platform scrollbar; bounded preview and table scroll regions | Computed style + keyboard scrolling |
| Document preview | `#documentPreviewPanel` and preview tabs | GIS / COE / GL DOM and `updateLivePreview()` | Visible / collapsed / review | Preview synchronization + tab preservation |
| Action bar | `.form-bottom-bar` | Step 2 transaction workflow | Normal document flow | Last field reachable; no overlay |
| Toast | Existing inline status, alert, and banner regions | `role=status`, `role=alert`, and operation handlers | Inline status / persistent banner; no global toast queue | Live-region + failure recovery checks |
| CRUD | `public/aics-api.js` API bridge plus page-level handlers | Laravel API routes and operation-specific authorization | Pessimistic server-confirmed create/update/delete | Full-flow + failure-path tests |
| Dialogs | Existing app-owned modal markup and handlers | Operation-specific workflow | Confirm / alert / form dialog | Keyboard, focus restoration, failure recovery |


## Dataset navigation

- Records use explicit search and filter controls with a paginated table.
- Preserve the distinction between empty dataset, no search results, loading, and request failure.
- Wide tables may scroll horizontally at narrow widths; do not squeeze critical identifiers into unreadable columns.
- Do not make a long form inherit a table's fixed-height/overflow contract.
- Selected-row actions must remain available without relying on hover alone.

## Flow ledger

| Operation | Trigger | Pending | Success destination / feedback | Failure recovery | Focus outcome | Source |
|---|---|---|---|---|---|---|
| Start transaction | Select eligible client/beneficiary and proceed | Requirements and identity checks are shown | Step 2 form | Keep user on the relevant check and show recoverable error/warning | Focus relevant status or next step | `PROJECT_CONTEXT.md`; `public/script.js` |
| Save draft | Explicit Save draft action | Busy state/status while API confirms | Remain in current form; announce server-confirmed save | Preserve form; show retry guidance | Keep context on action/status | Transaction Draft design spec |
| Resume draft | Select Resume in My Drafts | Fetch full snapshot | Restore complete form in Step 2 | Keep modal and show recoverable error | Focus restored form context | Transaction Draft design spec |
| Delete draft | Explicit delete after confirmation | Mutation remains in dialog | Remove exact owned draft; announce success | Keep confirmation open with retry path | Return to draft list context | Transaction Draft design spec |
| Review transaction | Review and save | Validate required fields | Step 3 review and document inspection | Show summary and focus first invalid field | Scroll/focus first invalid field | `public/script.js` |
| Save official transaction | Confirm save | Prevent duplicate submission | Step 4 saved/print experience | Keep entered data and communicate failure | Focus confirmation/status | Transaction API |
| Print document | Print action | Browser print dialog | Return to saved transaction context | Show printable failure guidance if applicable | Keep document context | `public/index.html`, `public/script.js` |

## Navigation and responsive behavior

- Top-level destinations use the existing app header and role-based navigation. Frontend visibility must match server-side role authorization.
- The transaction wizard's stepper represents process progression; it is not a replacement for the page navigation.
- The transaction form uses natural document scrolling; no nested vertical form scroll area.
- At widths above 1100px, the live preview starts visible. At 1100px and narrower it starts collapsed to protect form width. The staff member can manually Show/Hide preview; the manual choice remains in effect across browser resizes for the current page session.
- The section navigator and preview remain sticky below the header on wide desktop. At 820px and narrower, both are non-sticky and the section list becomes a horizontal strip.
- The Step 2 action bar remains in normal document flow after the final form section. Never pin it over active fields.
- The document preview is an intentional bounded scroll viewport; it must not become the form's scroll owner.
- Important values must remain accessible without hover-only disclosure.

## Overlays and feedback

- Use the existing app-owned dialog pattern for destructive and overwrite decisions; do not use browser `alert()`, `confirm()`, or `prompt()` for product flows.
- Confirmation dialogs remain open until the server reports success. Failure stays in the dialog with retry/cancel recovery.
- Keep status messages near the affected task and announce routine completion politely; use assertive alerts only for urgent interruption.
- A pending action must prevent accidental duplicate submission and preserve its content while the server is working.

## Async and resilience

- Core transaction and draft writes use server-confirmed (pessimistic) feedback.
- Do not report success before the API confirms it.
- Failed saves retain entered form values and expose a retry path.
- Drafts are explicitly saved; no background auto-save or offline draft queue is defined.
- Draft data is server-owned and private to the creator; presentation state such as preview visibility is not part of a transaction or draft payload.
- Session expiry, account disablement, and role restrictions are enforced by the backend; the frontend should show the resulting state without bypassing server authorization.

## Validation

- Required fields are determined by the current form contract and the explicit required metadata/label rules in `public/script.js`.
- Long-form validation shows a summary and inline field messages.
- On invalid submit, scroll to and focus the first invalid field.
- Preserve optional fields; do not infer required status solely from field grouping.
- Keep password/secret values out of transaction snapshots and routine feedback.

## Permission and clipboard

- Frontend role visibility is a usability affordance only; Laravel route middleware and controller authorization are authoritative.
- Viewer accounts are restricted to their approved verification capability and must not see operational record, lookup, draft, budget, report, or Admin data.
- Drafts are private to their creator for Staff, Senior staff, and Administrator alike. An Administrator must not view, resume, update, or delete another user's draft.
- Any broader Viewer information access requires explicit LGU/MSWDO data-sharing approval before implementation.

## Verification

- JavaScript: `node --test tests/js/*.test.cjs`.
- JavaScript syntax: `node --check public/script.js`, `node --check public/aics-api.js`.
- PHP: `& 'C:\xampp\php\php.exe' artisan test --no-ansi`.
- Browser matrix for transaction workspace: 1440×900, 1366×768, 1024×768, and 390×844.
- Check keyboard operation, focus-visible, reduced motion, loading/error/empty/success states, last-field reachability, preview Show/Hide, selected-tab preservation, and no page-level horizontal overflow.
- Canonical sibling flow: New transaction Step 1 identity/eligibility check and Step 3 review.
