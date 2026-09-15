# Freelance Marketplace — Design System

> Warm professional workspace with cobalt actions

**Theme:** Light  
**Product type:** Two-sided freelance marketplace  
**Primary users:** Clients and Freelancers  
**Reference direction:** Sunlit cream paper, cobalt pulse

## 1. Product Context

The product connects Clients who publish freelance opportunities with Freelancers who discover relevant work and submit applications.

Core capabilities:

- Users register, sign in, and maintain a role-specific profile.
- Clients create, publish, edit, close, and manage their own Gigs.
- Freelancers browse, search, filter, save, and apply to open Gigs.
- Clients review applicants and select one Freelancer for each Gig.
- AI matching helps users understand candidate-to-Gig fit through explainable, advisory recommendations.
- Authorization depends on both role and resource ownership. Only the Client who owns a Gig may edit it, close it, review its applicants, or select a Freelancer.

### Domain Terminology

Use these terms consistently in UI copy, routes, component names, and documentation:

| Term | Meaning |
|---|---|
| Job | A freelance work opportunity created by a Client |
| Application | A Freelancer's submission to a Gig |
| Client | A user who publishes and manages Gigs |
| Freelancer | A user who discovers Gigs and submits Applications |
| Applicant | A Freelancer who submitted an Application to a specific Gig |
| AI Match | An advisory explanation of how well a Freelancer profile aligns with a Gig |

Do not alternate between `Job`, `Project`, and `Posting` for the same resource. The product-facing term is **Job**.

## 2. Visual Direction

The interface uses a warm, professional workspace language. A cream canvas makes long browsing and applicant-review sessions comfortable, while electric cobalt identifies primary actions, selected navigation, links, and focused controls.

Marketing pages may use editorial typography, spacious layouts, and restrained gradients. Authenticated application screens use a denser, task-oriented layout with clear hierarchy, ownership, filtering, and status visibility.

The product should feel:

- trustworthy;
- calm;
- capable;
- approachable;
- focused on professional work;
- transparent about decisions and AI recommendations.

The product should not resemble:

- a social-media feed;
- a gaming interface;
- a crypto dashboard;
- a generic admin template;
- a copied version of the reference brand.

## 3. Design Principles

### Trust Before Decoration

Prioritize identity, ownership, compensation, skills, status, and next actions. Decorative elements must never compete with information required to make a work decision.

### One Clear Primary Action

Each screen or modal has one visually dominant action. Secondary actions use neutral or ghost treatments. Destructive actions never use the primary cobalt treatment.

### Role Clarity

Client and Freelancer workflows must remain visually and structurally distinct. Never expose Client-only controls to a Freelancer or non-owner.

### Explainable AI

AI Match is advisory evidence, not a hiring verdict. Show supporting factors and uncertainty instead of presenting a score without context.

### Progressive Disclosure

Cards show decision-relevant summaries. Detailed requirements, cover letters, portfolio evidence, and AI explanations appear in details, drawers, or dedicated pages.

### State Is Always Visible

Users must be able to identify whether a Gig or Application is draft, open, under review, accepted, rejected, closed, or otherwise unavailable.

## 4. Tokens — Colors

### Foundation Colors

| Name | Value | Token | Role |
|---|---|---|---|
| Canvas Cream | `#faf9f7` | `--color-canvas` | Default page canvas |
| Surface Ivory | `#fbfaf7` | `--color-surface-subtle` | Subtle panels and grouped regions |
| Pure White | `#ffffff` | `--color-surface` | Cards, inputs, dialogs, navigation |
| Lavender Mist | `#f4f0ff` | `--color-surface-accent` | Low-frequency decorative or AI-related wash |
| Powder Blue | `#d6e4f1` | `--color-border-accent` | Selected and informational borders |
| Ink Charcoal | `#121722` | `--color-text-primary` | Primary text, headings, strong icons |
| Slate Gray | `#667085` | `--color-text-secondary` | Secondary text and metadata |
| Steel Gray | `#98a2b3` | `--color-text-muted` | Placeholder and disabled text |
| Hairline | `#e7e7e5` | `--color-border` | Default borders and dividers |
| Faint Gray | `#d0d5dd` | `--color-border-strong` | Stronger neutral control borders |

### Brand and Interaction Colors

| Name | Value | Token | Role |
|---|---|---|---|
| Electric Cobalt | `#0068f9` | `--color-primary` | Primary buttons, active navigation, links, focus |
| Deep Cobalt | `#024bb1` | `--color-primary-hover` | Primary hover and pressed states |
| Pale Cobalt | `#eff6ff` | `--color-primary-subtle` | Selected controls and informational backgrounds |
| Vivid Violet | `#6736eb` | `--color-ai` | AI-specific emphasis and decorative accents |
| Pale Violet | `#f4f0ff` | `--color-ai-subtle` | AI explanation backgrounds |

Only cobalt is used for ordinary primary actions. Violet is reserved for AI Match, selected highlights, and limited decorative emphasis.

### Semantic Colors

| Role | Surface | Foreground | Border | Usage |
|---|---|---|---|---|
| Success | `#ecfdf3` | `#027a48` | `#abefc6` | Accepted, completed, verified |
| Warning | `#fffaeb` | `#b54708` | `#fedf89` | Reviewing, incomplete, deadline near |
| Error | `#fef3f2` | `#b42318` | `#fecdca` | Rejected, failed, destructive |
| Info | `#eff8ff` | `#175cd3` | `#b2ddff` | Submitted, informational |
| Neutral | `#f2f4f7` | `#475467` | `#e4e7ec` | Draft, closed, withdrawn |

Never communicate a status through color alone. Pair color with a text label and, when useful, an icon.

### Color Usage Rules

- Use `#faf9f7` as the authenticated application canvas.
- Use white for elevated interactive surfaces.
- Use cobalt for the single primary action, links, focus indicators, and selected navigation.
- Use violet only for AI-related content or rare decorative emphasis.
- Use semantic colors only for semantic states.
- Do not use gradients inside routine dashboard cards, tables, or forms.
- Ensure text and interactive controls satisfy WCAG AA contrast.

## 5. Tokens — Typography

### Font Family

Use **Inter** as the default product font. Do not require Roobert unless a valid project license and font files are supplied.

```css
--font-sans: "Inter", ui-sans-serif, system-ui, -apple-system,
  BlinkMacSystemFont, "Segoe UI", sans-serif;
```

Supported weights:

- 400 — body and supporting text;
- 500 — buttons, navigation, labels;
- 600 — headings and important values;
- 700 — rare high-emphasis values only.

### Product Type Scale

| Role | Desktop | Mobile | Line Height | Weight | Token |
|---|---:|---:|---:|---:|---|
| Caption | 12px | 12px | 1.4 | 500 | `--text-caption` |
| Metadata | 13px | 13px | 1.45 | 400 | `--text-metadata` |
| Body Small | 14px | 14px | 1.5 | 400 | `--text-body-sm` |
| Body | 16px | 16px | 1.55 | 400 | `--text-body` |
| Card Title | 18px | 17px | 1.4 | 600 | `--text-card-title` |
| Section Title | 24px | 22px | 1.3 | 600 | `--text-section-title` |
| Page Title | 32px | 28px | 1.2 | 600 | `--text-page-title` |
| Marketing Heading | 48px | 36px | 1.12 | 600 | `--text-marketing-heading` |
| Marketing Display | 64px | 40px | 1.08 | 600 | `--text-marketing-display` |

### Typography Rules

- Reserve display typography for marketing pages.
- Authenticated screens use a maximum heading size of 32px.
- Use sentence case for headings, labels, and buttons.
- Use tabular numerals for compensation, percentages, counts, and dates when supported.
- Avoid long uppercase text. Uppercase may be used for short overlines at 12px with increased tracking.
- Limit readable text lines to approximately 65–75 characters.
- Do not use weight 700 as a substitute for information hierarchy.

## 6. Tokens — Spacing and Shape

### Spacing Scale

Use an 8px base rhythm with 4px available for compact internal alignment.

| Name | Value | Token |
|---|---:|---|
| 4 | 4px | `--spacing-4` |
| 8 | 8px | `--spacing-8` |
| 12 | 12px | `--spacing-12` |
| 16 | 16px | `--spacing-16` |
| 20 | 20px | `--spacing-20` |
| 24 | 24px | `--spacing-24` |
| 32 | 32px | `--spacing-32` |
| 40 | 40px | `--spacing-40` |
| 48 | 48px | `--spacing-48` |
| 64 | 64px | `--spacing-64` |
| 80 | 80px | `--spacing-80` |

### Radius Language

| Element | Radius | Token |
|---|---:|---|
| Tooltip or compact popup | 8px | `--radius-sm` |
| Input, select, application button | 10px | `--radius-control` |
| Card, panel, dialog | 16px | `--radius-card` |
| Marketing CTA | 48px | `--radius-marketing-cta` |
| Badge, chip, avatar | 9999px | `--radius-full` |

Pill buttons are reserved for marketing CTAs, badges, filter chips, and segmented controls. Routine dashboard actions use a 10px radius.

### Shadows

```css
--shadow-subtle:
  0 1px 1px rgba(0, 0, 0, 0.05),
  inset 0 0 0 0.5px rgba(0, 0, 0, 0.08);

--shadow-dialog:
  0 20px 48px rgba(18, 23, 34, 0.12);
```

Prefer borders and surface changes over shadows. Do not use colored shadows, glows, or heavy elevation.

## 7. Layout System

### Global Layout

- Marketing maximum width: 1200px.
- Application maximum width: 1440px.
- Reading and form maximum width: 720px.
- Desktop page padding: 32px.
- Tablet page padding: 24px.
- Mobile page padding: 16px.
- Marketing section gap: 80px.
- Application section gap: 32px.
- Standard card padding: 24px desktop, 16px mobile.
- Compact list and table cell padding: 12–16px.

### Authenticated Shell

Desktop application screens use:

- a persistent left sidebar between 240px and 264px;
- a top utility bar for page context, search, notifications, and profile;
- a main content region with optional right-side detail panel;
- breadcrumbs only when hierarchy is deeper than two levels.

Tablet may collapse the sidebar to icons. Mobile replaces it with a drawer or bottom navigation containing only the highest-frequency destinations.

### Information Density

- Marketing pages use comfortable density.
- Gig browsing uses medium density.
- Applicant management and data tables use compact density.
- Do not apply a single spacing density across every screen.

## 8. Navigation by Role

### Freelancer Navigation

Primary destinations:

- Find Gigs
- Saved Gigs
- My Applications
- Profile

Contextual primary action:

- Browse Gigs; or
- Complete Profile when required information is missing.

### Client Navigation

Primary destinations:

- My Gigs
- Applicants
- Create Gig
- Profile

Contextual primary action:

- Post a Gig.

### Shared Navigation

- Notifications
- Account Settings
- Help
- Sign Out

Do not mix Client-only management actions into Freelancer navigation. If role switching is supported, display the active role and require an explicit switch.

## 9. Core Components

### Primary Button

- Background: `#0068f9`.
- Text: white.
- Radius: 10px in the application, 48px on marketing pages.
- Height: 44px minimum.
- Padding: 12px 18px.
- Font: 14–16px, weight 500.
- Hover: `#024bb1`.
- Focus: visible 3px cobalt-tinted ring.
- Loading: retain label width and show progress without shifting layout.

Use one primary button per action group.

### Secondary Button

- White background.
- Primary text color.
- 1px neutral border.
- Same height and radius as the adjacent primary button.
- Subtle ivory hover surface.

### Destructive Button

- Use error foreground and error-tinted surface.
- Never use cobalt for delete, reject, cancel, or close actions.
- Require confirmation when the action is irreversible or affects another user.

### Text Link

- Cobalt text.
- Underline on hover and keyboard focus.
- Never use color alone to distinguish an inline link from surrounding text.

### Input and Select

- White background.
- 1px neutral border.
- 10px radius.
- Minimum 44px height.
- Persistent visible label; placeholder is supplementary.
- Inline validation beneath the field.
- Clear focus ring.
- Disabled state must remain readable.

### Status Badge

- Pill shape.
- 12–13px weight 500.
- Semantic tinted surface, foreground, and border.
- Always include readable status text.

### Skill Chip

- Neutral chip by default.
- Selected filters may use pale cobalt.
- Show at most five skills on summary cards, then collapse the remainder into `+N`.
- Skill chips are not status badges.

### Avatar and Identity Block

- Avatar sizes: 32px compact, 40px default, 56–72px profile summary.
- Always show a textual name beside compact avatars when identity matters.
- Use initials fallback when no avatar exists.
- Verification indicators require an accessible label and tooltip.

### Gig Card

A Gig card displays:

- Gig title;
- Client name and verification state;
- budget type and compensation range;
- required skills;
- experience level;
- work arrangement;
- posted time and application deadline;
- Application count only when the current user is authorized;
- saved state for Freelancers;
- AI Match summary for eligible Freelancers.

Use a white surface, 16px radius, 1px hairline border, and 20–24px padding. Hover may strengthen the border and add a subtle shadow. Do not animate position or scale.

The whole card may navigate to details, but nested Save and action buttons must remain independently keyboard accessible.

### Gig Search and Filter Bar

Supported controls:

- keyword;
- category;
- skills;
- budget range;
- experience level;
- work arrangement;
- posted date;
- sort order;
- clear filters.

Desktop uses an inline bar or left filter panel. Mobile uses a filter drawer. Active filters appear as removable chips. Search and filter state must be represented in the URL.

### Gig Form

Group fields into:

1. Overview
2. Scope and requirements
3. Skills and experience
4. Budget and timeline
5. Review and publish

Save Draft and Publish must be visually distinct. Preserve entered content after recoverable failures. Warn before leaving with unsaved changes.

### Application Form

Contains:

- cover letter;
- proposed rate or price;
- estimated duration;
- relevant portfolio selection;
- optional attachment;
- submission summary.

Show validation next to the affected field. Clearly state that submission shares the selected profile and portfolio information with the Client.

### Applicant Card

Displays:

- Freelancer identity and professional title;
- relevant skills;
- experience summary;
- proposed rate;
- submitted time;
- Application status;
- AI Match indication;
- portfolio evidence.

Client-only actions may include Shortlist, Accept, Reject, and View Profile. Do not place Accept and Reject adjacent without visual separation.

### Applicant Management Table

Designed for a Client viewing a Gig they own.

Recommended columns:

- Candidate
- Proposed Rate
- Relevant Skills
- AI Match
- Submitted Date
- Status
- Actions

Support filtering, sorting, pagination, row selection where needed, loading skeletons, empty states, and row-level actions.

On mobile, replace the table with stacked applicant cards or provide an intentionally designed horizontal scroll region.

### AI Match Summary

AI Match is advisory and must display:

- a qualitative label such as Strong, Potential, or Limited Match;
- a numeric percentage only when the backend provides a defined score;
- top matching skills or requirements;
- missing or weak requirements;
- a concise explanation;
- calculation, unavailable, stale, and retry states.

Use violet for AI-specific visual emphasis, never for ordinary success or selection.

Required disclaimer:

> AI Match is a recommendation based on available profile and Gig information. Review the full Application before making a decision.

Never:

- claim guaranteed suitability;
- invent a score on the client;
- use AI Match as the sole visible reason for accepting or rejecting an applicant;
- hide missing information;
- imply that AI made the final hiring decision.

### Profile Summary Card

Freelancer profile content:

- avatar and identity;
- professional title;
- biography;
- skills;
- work experience;
- portfolio;
- availability;
- expected rate;
- profile completeness.

Client profile content:

- avatar or organization logo;
- display or organization name;
- overview;
- industry and location when applicable;
- verification state;
- active and completed Gigs.

### Pagination

- Show Previous and Next plus nearby page numbers on desktop.
- Use compact Previous and Next controls on mobile.
- Preserve filters and sort order during navigation.
- Announce result-count changes to assistive technology.

### Dialog

- Use for focused decisions, confirmations, and compact forms.
- Keep one primary action and one cancel action.
- Trap focus, support Escape when safe, and restore focus on close.
- Do not use a dialog for long multi-section workflows.

### Toast

- Use for non-blocking confirmation of completed actions.
- Do not use a toast as the only place an important error is explained.
- Keep destructive or authorization errors visible near the affected content.

## 10. Domain Status Language

### Gig Status

| Status | Semantic Treatment | Meaning |
|---|---|---|
| Draft | Neutral | Visible only to the owner until published |
| Open | Success | Accepting Applications |
| Reviewing | Warning | Client is reviewing submitted Applications |
| Filled | Violet or Success | A Freelancer has been selected |
| Closed | Neutral | No longer accepting Applications |
| Cancelled | Error | Cancelled by the owner |

### Application Status

| Status | Semantic Treatment | Meaning |
|---|---|---|
| Submitted | Info | Successfully submitted |
| Reviewing | Warning | Client is reviewing the Application |
| Shortlisted | Violet | Candidate is being considered closely |
| Accepted | Success | Freelancer was selected |
| Rejected | Error | Application was not selected |
| Withdrawn | Neutral | Freelancer withdrew the Application |

When a Client accepts an Application:

- require a confirmation that identifies the selected Freelancer and Gig;
- explain that only one Freelancer may be selected;
- disable repeated acceptance while the request is pending;
- update the selected Application to Accepted;
- update the Gig to Filled;
- refresh or invalidate the remaining Application states from the server;
- never infer final statuses locally if the API response does not provide them.

## 11. Required Screens

### Public and Authentication

- Landing page
- Browse public Gigs when permitted
- Public Gig detail
- Sign in
- Sign up
- Role selection
- Forgot password
- Reset password

### Freelancer

- Find Gigs
- Gig detail
- Saved Gigs
- Submit Application
- My Applications
- Application detail
- Freelancer profile
- Edit profile and portfolio

### Client

- My Gigs
- Create Gig
- Edit owned Gig
- Gig detail and management
- Applicants across Gigs
- Applicants for one Gig
- Applicant detail
- Client profile
- Edit profile

### Shared

- Notifications
- Account settings
- Unauthorized
- Forbidden
- Not found
- Service unavailable

## 12. Screen Guidance

### Landing Page

- Cream-to-pale-blue hero background.
- Marketing display headline at 64px desktop, 40px mobile.
- One cobalt primary CTA and one neutral secondary CTA.
- Product UI screenshots are the primary imagery.
- Explain the value separately for Clients and Freelancers.
- Use a restrained final CTA gradient only once near the page end.

Do not copy the reference brand's navigation labels, customer names, screenshots, or wording.

### Find Gigs

- Search is visually dominant.
- Display result count and active filters.
- Use a responsive list or grid of Gig cards.
- Preserve search state in the URL.
- Differentiate no Gigs available from no results matching filters.
- AI Match may appear only when sufficient profile data exists.

### Gig Detail

- Main column: title, description, deliverables, requirements, skills, timeline.
- Side summary: Client identity, budget, status, deadline, primary action.
- Freelancer primary action: Apply or View Application.
- Owner primary action: Manage Gig.
- Non-owner Client must not see owner-only controls.

### My Gigs

- Provide status tabs or filters.
- Show applicant counts and recent activity.
- Make Create Gig the primary action.
- Provide an overflow menu for edit, close, and cancel actions.

### Applicant Review

- Keep Gig context visible.
- Support status and AI Match filters.
- Allow side-by-side evidence review without making AI score the dominant column.
- Put the full Application, profile evidence, and AI explanation before the final Accept action.

### Profile

- Show profile completeness and specific missing sections.
- Separate public profile preview from edit mode.
- Auto-save only when clearly communicated; otherwise provide an explicit Save action.

## 13. Authorization and Ownership UX

UI visibility follows backend authorization but never replaces it.

### Client Permissions

A Client may:

- create a Gig;
- view and manage their own Gigs;
- edit, close, or cancel a Gig they own;
- review Applications submitted to their own Gig;
- shortlist, accept, or reject Applicants for their own Gig.

A Client may not manage another Client's Gig or Applicants.

### Freelancer Permissions

A Freelancer may:

- browse available Gigs;
- save a Gig;
- apply to an eligible open Gig;
- view and withdraw their own Application when permitted;
- manage their own profile and portfolio.

A Freelancer may not create or manage a Client Gig unless the product explicitly supports role switching.

### Authorization States

- Hide controls the user cannot legitimately use.
- If a user reaches a protected route directly, show a dedicated Forbidden state.
- If ownership changes or permission is revoked, refresh server state and remove stale actions.
- Never expose hidden application or applicant information in page source, prefetched payloads, or client-side state.

## 14. Interface States

Every data-driven screen must define:

- initial loading;
- background refreshing;
- empty result;
- filtered empty result;
- field validation error;
- API error;
- unauthorized;
- forbidden;
- not found;
- successful mutation;
- destructive confirmation;
- disabled action;
- pending action;
- offline or disconnected state when relevant.

### Loading

- Use skeletons matching the final layout for initial loading.
- Use inline progress for local mutations.
- Do not replace the entire page with a spinner during a row or button action.
- Disable duplicate submission while a mutation is pending.

### Empty States

An empty state includes:

- a clear explanation;
- the reason when known;
- one relevant next action;
- an illustration only when it improves comprehension.

Examples:

- No Gigs published: `Create your first Gig`.
- No matching results: `Clear filters`.
- No Applications: explain that submitted candidates will appear here.

### Errors

- Place field errors beside their fields.
- Place page-fetch errors in the affected content region with Retry.
- Preserve user input after recoverable failures.
- Translate backend errors into clear user-facing messages without hiding important meaning.
- Do not expose stack traces, internal IDs, or implementation details.

## 15. Responsive Behavior

### Breakpoints

- Mobile: below 640px
- Tablet: 640px–1023px
- Desktop: 1024px and above

### Mobile Rules

- Collapse desktop navigation into a drawer or focused bottom navigation.
- Render filters in a full-height drawer or bottom sheet.
- Stack Gig metadata in priority order.
- Convert Applicant tables into cards or intentional horizontal scrolling.
- Use full-width form controls.
- Keep primary actions reachable without covering content.
- Use at least 44px touch targets.
- Avoid relying on hover.
- Do not simply scale down the desktop layout.

### Desktop Rules

- Keep search and filter context visible.
- Use side panels for detail preview only when enough width remains for the main task.
- Keep line lengths readable even on wide screens.
- Do not stretch cards to fill width when doing so damages information hierarchy.

## 16. Accessibility

- Meet WCAG 2.2 AA for applicable interfaces.
- Provide visible `:focus-visible` treatment for every interactive element.
- Use semantic HTML before ARIA.
- Every input has a persistent programmatic label.
- Every icon-only button has an accessible name and tooltip where useful.
- Ensure full keyboard operation for navigation, filters, dialogs, menus, and tables.
- Restore focus after closing dialogs and drawers.
- Use correct heading order.
- Provide a skip-to-content link.
- Respect `prefers-reduced-motion`.
- Do not use color alone for status, AI Match, validation, or selection.
- Announce asynchronous results and form submission outcomes appropriately.
- Provide useful alt text for informative imagery and empty alt text for decorative imagery.

## 17. Motion

- Standard UI transition: 150–200ms.
- Drawer or dialog transition: 200–250ms.
- Use opacity and transform for motion.
- Avoid layout-shifting animation.
- Do not animate data values in ways that delay comprehension.
- Disable nonessential motion when reduced motion is requested.
- Hover cards may change border and shadow but must not jump or scale.

## 18. Imagery and Icons

- Prefer real product screenshots for marketing pages.
- Use restrained, monoline icons with consistent stroke width.
- Use avatars and portfolio evidence where identity or capability matters.
- Avoid generic office stock photography as the primary product visual.
- Avoid decorative 3D objects, glassmorphism, neon glows, and abstract AI brains.
- AI Match may use a small sparkle or wand symbol, but the icon must not overpower the explanation.

## 19. Content Guidelines

- Use direct, professional language.
- Prefer `Create Gig` over vague labels such as `Continue` when the action is known.
- Use `Submit Application` for the final Freelancer submission.
- Use `Accept Freelancer` for the Client's final selection action.
- State consequences before destructive or irreversible actions.
- Use human-readable dates and include absolute dates when deadlines matter.
- Format money with locale-aware currency formatting.
- Do not claim AI certainty.
- Do not use fake social proof, fake applicant counts, or fabricated company logos.

### Confirmation Copy

Accepting an applicant:

> Accept this Freelancer for the Gig? Only one Freelancer can be selected. Review the Application and Gig terms before confirming.

Rejecting an applicant:

> Reject this Application? The Freelancer will no longer be considered for this Gig.

Closing a Gig:

> Close this Gig? New Applications will no longer be accepted.

## 20. API and Data Integrity Rules

- Treat the backend contract or OpenAPI specification as the source of truth.
- Do not invent endpoints, fields, enum values, pagination shapes, or authorization behavior.
- Centralize API calls outside visual components.
- Represent server enums through typed mappings to user-facing labels.
- Keep query, filter, sort, and pagination state synchronized with the URL when applicable.
- Use server-confirmed state after mutations.
- Invalidate or refetch affected Gig and Application queries after selection decisions.
- Do not calculate an AI Match percentage on the frontend unless the contract explicitly requires it.
- Do not expose ownership controls based solely on a route parameter; use authenticated server data.

## 21. CSS Custom Properties

```css
:root {
  color-scheme: light;

  /* Foundation */
  --color-canvas: #faf9f7;
  --color-surface-subtle: #fbfaf7;
  --color-surface: #ffffff;
  --color-surface-accent: #f4f0ff;
  --color-text-primary: #121722;
  --color-text-secondary: #667085;
  --color-text-muted: #98a2b3;
  --color-border: #e7e7e5;
  --color-border-strong: #d0d5dd;
  --color-border-accent: #d6e4f1;

  /* Brand */
  --color-primary: #0068f9;
  --color-primary-hover: #024bb1;
  --color-primary-subtle: #eff6ff;
  --color-ai: #6736eb;
  --color-ai-subtle: #f4f0ff;

  /* Semantic */
  --color-success-surface: #ecfdf3;
  --color-success: #027a48;
  --color-success-border: #abefc6;
  --color-warning-surface: #fffaeb;
  --color-warning: #b54708;
  --color-warning-border: #fedf89;
  --color-error-surface: #fef3f2;
  --color-error: #b42318;
  --color-error-border: #fecdca;
  --color-info-surface: #eff8ff;
  --color-info: #175cd3;
  --color-info-border: #b2ddff;
  --color-neutral-surface: #f2f4f7;
  --color-neutral: #475467;
  --color-neutral-border: #e4e7ec;

  /* Typography */
  --font-sans: "Inter", ui-sans-serif, system-ui, -apple-system,
    BlinkMacSystemFont, "Segoe UI", sans-serif;
  --text-caption: 0.75rem;
  --text-metadata: 0.8125rem;
  --text-body-sm: 0.875rem;
  --text-body: 1rem;
  --text-card-title: 1.125rem;
  --text-section-title: 1.5rem;
  --text-page-title: 2rem;
  --text-marketing-heading: 3rem;
  --text-marketing-display: 4rem;

  /* Spacing */
  --spacing-4: 0.25rem;
  --spacing-8: 0.5rem;
  --spacing-12: 0.75rem;
  --spacing-16: 1rem;
  --spacing-20: 1.25rem;
  --spacing-24: 1.5rem;
  --spacing-32: 2rem;
  --spacing-40: 2.5rem;
  --spacing-48: 3rem;
  --spacing-64: 4rem;
  --spacing-80: 5rem;

  /* Shape */
  --radius-sm: 8px;
  --radius-control: 10px;
  --radius-card: 16px;
  --radius-marketing-cta: 48px;
  --radius-full: 9999px;

  /* Layout */
  --marketing-max-width: 1200px;
  --application-max-width: 1440px;
  --reading-max-width: 720px;

  /* Elevation */
  --shadow-subtle: 0 1px 1px rgba(0, 0, 0, 0.05),
    inset 0 0 0 0.5px rgba(0, 0, 0, 0.08);
  --shadow-dialog: 0 20px 48px rgba(18, 23, 34, 0.12);
}
```

## 22. Do and Don't

### Do

- Use cream as the main canvas and white for interactive surfaces.
- Use cobalt consistently for primary interactions.
- Keep authenticated screens denser than marketing screens.
- Show role, ownership, and resource status clearly.
- Show AI Match with reasons and limitations.
- Design loading, empty, error, and forbidden states with every feature.
- Preserve search and filter state in the URL.
- Use real API contract types and server-confirmed mutation results.
- Verify responsive behavior at mobile, tablet, and desktop widths.

### Don't

- Do not use 84px headlines inside the application dashboard.
- Do not make every application button pill-shaped.
- Do not use violet as an ordinary CTA or success color.
- Do not add heavy gradients to cards, forms, tables, or panels.
- Do not use heavy shadows, glows, glassmorphism, or excessive animation.
- Do not expose Client management controls to non-owners.
- Do not make AI Match the only basis for a decision.
- Do not fabricate endpoints, AI scores, users, metrics, or social proof.
- Do not silently discard form data after API failures.
- Do not copy the reference company's logo, content, customers, or screenshots.

## 23. Definition of Done

A screen is complete only when:

- its main user goal is achievable;
- role and ownership rules are represented correctly;
- loading, empty, error, success, and forbidden states are implemented where relevant;
- keyboard interaction and focus states work;
- mobile, tablet, and desktop layouts are verified;
- text and controls meet accessible contrast requirements;
- API usage matches the approved backend contract;
- no client-generated AI score or invented backend behavior is present;
- lint, type checking, tests, and production build pass;
- the rendered result follows this design system rather than merely matching its color palette.
