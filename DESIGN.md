---
version: alpha
name: "AICS Records"
description: "A desktop-first AICS records workspace for MSWDO personnel, using an institutional navy and document-led visual language."
colors:
  primary: "#0c2340"
  secondary: "#15325b"
  accent: "#1b55b0"
  accentHover: "#14428d"
  danger: "#c53030"
  success: "#276749"
  page: "#f4f6f9"
  surface: "#ffffff"
  border: "#cbd5e1"
  borderLight: "#e2e8f0"
  text: "#1e293b"
  textSecondary: "#475569"
  textMuted: "#64748b"
  previewHighlight: "#fff1a8"
  previewBorder: "#e8c84a"
typography:
  sans:
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    fontSize: "14px"
    lineHeight: "1.5"
  document:
    fontFamily: '"Times New Roman", Times, Georgia, serif'
rounded:
  DEFAULT: "8px"
  sm: "4px"
  md: "6px"
  lg: "8px"
omitted:
  - section: spacing
    reason: "The legacy stylesheet uses local spacing values and framework utility classes rather than one coherent spacing-token scale; do not infer a new scale from isolated values."
components:
  button: {}
  card: {}
  formField: {}
  navigation: {}
  table: {}
  documentPreview: {}
---

# AICS Records — Design System

## Overview

### Creative North Star

AICS Records should feel like an orderly municipal service counter and an official records desk: calm, legible, accountable, and document-led. The interface uses an institutional navy shell, restrained blue actions, red reserved for important boundaries and destructive states, and paper-like document previews. It is a working product, not a public-facing campaign page.

### Product context and register

- **Audience and primary job:** MSWDO personnel who check prior records, validate assistance requirements, capture AICS transaction information, review generated documents, and maintain records.
- **Target market(s) and evidence:** LGU Maramag, Bukidnon, Philippines. This is grounded in the application identity and the maintained project context; it is not a claim of deployment or operational approval.
- **Locale(s) and language policy:** Current interface copy is English. The project does not yet expose a centralized localization provider; preserve clear English labels and Philippine administrative terminology until a locale policy is approved.
- **Usage scene:** Office desktop computers are the primary operating environment. Staff use a mouse and keyboard for repeated data entry and document review. Tablet and phone widths remain supported but are secondary.
- **Register:** Product. Task clarity, accurate data entry, familiar records patterns, and document readability take priority over visual novelty.
- **Memorable signature:** The live GIS / Certificate of Eligibility / Guarantee Letter preview connects data entry to the official paper documents staff prepare.
- **Restraint:** Keep form controls, tables, record search, and administrative screens quiet and consistent. Do not decorate operational data or introduce dashboard-like metrics without a real job to support them.
- **Anti-references:** Avoid consumer-finance dashboards, marketing landing pages, glassmorphism, neon gradients, playful illustrations, and dark-first admin themes; these would weaken the system's institutional records-desk character.
- **Token ownership/runtime mapping:** `public/style.css` is the canonical runtime token source. This document records the existing values and rationale; it does not generate CSS. Runtime tokens are defined in the root `:root` block. Do not duplicate or hand-copy values into a second theme layer.

## Colors

The palette separates structural identity from operational feedback.

- **Primary navy** (#0c2340) anchors the header and institutional shell. **Secondary navy** (#15325b) supports deeper brand surfaces.
- **Accent blue** (#1b55b0) is the main action and selected-control color; its hover state is #14428d.
- **Accent red** (#c53030) is a restrained warning/destructive accent and the header's thin lower rule. It should not be used as a general decorative highlight.
- **Success green** (#276749), light green (#e6f4ea), light red (#fde8e8), and light yellow (#fefcbf) communicate validation and status.
- **Page** (#f4f6f9) and **surface** (#ffffff) distinguish the work area from cards and forms. Borders use #cbd5e1 and #e2e8f0.
- **Primary text** (#1e293b), secondary text (#475569), and muted text (#64748b) provide hierarchy without competing with form content.
- **Document highlights** (#fff1a8 with #e8c84a border) are reserved for values injected into official document previews.

The stylesheet also contains a later print-specific token override. Keep print color decisions scoped to print output; do not treat them as a second screen theme.

## Typography

- The interface uses the system sans stack: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif. Body text is 14px with a 1.5 line-height.
- Headings use heavier weights and measured size differences; the header product name is 17px bold, while labels and dense secondary metadata remain smaller.
- Official document previews intentionally use Times New Roman / Times / Georgia to resemble paper-based forms. This is a document role, not the UI body font.
- Keep table values and form labels readable at ordinary desktop zoom. Avoid shrinking operational data to fit a layout; adjust columns or allow intentional horizontal scrolling instead.

## Layout

- The app header is 64px tall, sticky at the top, navy, with a 3px red lower border. The navigation is horizontal with a white underline for the active destination.
- The core work area uses light page background, white bordered cards, and compact form grouping.
- The primary transaction workspace is desktop-first. At wide desktop widths it uses section navigation, form fields, and a live document preview. At 1100px and narrower the preview starts collapsed to protect form width; staff can reopen it.
- The transaction form itself uses natural document/page scrolling. Section navigation and preview are sticky below the header on wide desktop. The paper preview is allowed its own bounded scroll because it is a distinct document viewport.
- Form action controls remain in normal document flow at the end of the form; do not pin them over active inputs or validation feedback.
- At 820px and narrower the transaction workspace becomes a single column, section navigation becomes a horizontally scrollable strip, and side panels are not sticky.
- Existing responsive breakpoints in `public/style.css` include 1200px, 1100px (workspace preview behavior), 820px, and 600px. Keep new rules aligned with these established thresholds.
- The base layout is designed around 1440×900 and remains usable at 1366×768. Do not constrain long forms to the height of a table or preview panel.

## Elevation & Depth

- Static cards use subtle borders and low-intensity shadows rather than heavy elevation.
- White surfaces sit directly on the light-gray page background.
- Sticky header, preview tabs, and action areas need opaque surfaces and clear edges so scrolling content does not bleed through.
- Dialogs and overlays may use stronger elevation to distinguish blocking interactions from page content.
- Do not add blur/glass overlays to routine administrative surfaces.

## Shapes

- The existing radius language is restrained: 4px small controls, 6px medium controls, and 8px cards/large surfaces.
- Buttons are generally rectangular with modest rounding; the system does not use pill-shaped buttons as a global rule.
- The circular municipal seal is a brand asset and should remain circular. Do not extrapolate its shape to unrelated controls.

## Components

### Foundational visual states

- Default inputs use white or lightly tinted surfaces, 1px gray borders, and dark readable text.
- Focused controls use the primary blue border/ring; retain a clearly visible keyboard focus outline.
- Invalid fields use red text/border and adjacent correction guidance; do not rely on color alone.
- Disabled and read-only controls must remain visually distinguishable from editable controls.
- Success, warning, and error banners use their existing semantic colors and explicit text.
- Loading, empty, error, and success states must reserve stable space where possible to avoid layout shift.

### Buttons and actions

- Primary blue is reserved for the main action of a screen, such as Review and save.
- Outline buttons are secondary actions such as Cancel or Show/Hide preview.
- Destructive actions use the danger red intent and explicit verbs; do not use red for routine actions.
- Busy actions retain their button geometry and clearly communicate the pending state.

### Navigation and data display

- The top navigation uses text labels, active underline, and role-specific visibility. The role permissions in the application are authoritative; do not infer access from appearance alone.
- Transaction section navigation uses native buttons inside a labeled navigation region. The active section is indicated visually and with `aria-current="step"`.
- Tables favor compact but readable rows, clear headings, and explicit search/filter controls. Horizontal scrolling is acceptable for wide tables at narrow viewports if all values remain accessible.
- The transaction preview uses tabs for GIS, Certificate of Eligibility, and Guarantee Letter. Preview values remain visually marked as generated data; the preview is not a substitute for validating the saved record.

### Forms and overlays

- Inputs must have visible labels; placeholders are supplementary, not labels.
- Validation summaries and field-level errors must be programmatically associated and announced.
- Long form navigation should not create multiple competing vertical scroll owners. The form follows the page scroll; the paper preview is the intentional exception.
- Preview visibility is user-controllable. The Show/Hide toggle exposes its state with `aria-expanded` and `aria-controls`, and collapsing must not clear field values or change the selected document.
- Dialogs use app-owned accessible interactions, with keyboard dismissal and focus restoration where applicable. Do not reintroduce browser-native alert/confirm/prompt dialogs.

### Iconography

Use the existing Unicode/inline SVG/CSS icon treatments already present in the application. Keep iconography secondary to text labels and never make critical navigation depend on an unlabeled icon.

### Motion

- Existing transitions are short and restrained (approximately 120–180ms for common controls).
- Respect `prefers-reduced-motion: reduce`; section jumps should become immediate when reduced motion is requested.
- Motion communicates state changes; do not add decorative page-load sequences to the records workflow.

### Content and data visualization

- Use concise English action labels with explicit outcomes: Save draft, Review and save, Print, Show preview, Hide preview.
- Distinguish client/requester and beneficiary consistently. Use Philippine peso notation for monetary values where the workflow displays currency.
- Use labels that explain system state rather than internal technical concepts. Error copy should say what failed and how staff can recover.

## Do's and Don'ts

- **Do:** Preserve the municipal AICS records identity and the established navy/blue/white palette.
- **Do:** Optimize the transaction form for repeated desktop data entry and accurate document review.
- **Do:** Keep the preview available while allowing the staff member to reclaim horizontal space.
- **Don't:** Add a second vertical scroll container for the long form.
- **Don't:** place persistent action bars over the active data-entry area.
- **Don't:** use decorative gradients, oversized metrics, or marketing layouts in administrative workflows.
