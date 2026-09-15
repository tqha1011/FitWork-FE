Build the complete frontend UI for this freelance marketplace.

## Goal

Create every screen and interaction required for a polished, production-quality freelance marketplace UI.

This task is UI-only:

* Do not integrate a backend.
* Do not create real API calls.
* Do not implement real authentication.
* Do not generate an API client.
* Do not inspect or modify a backend repository.
* Use typed mock data and local UI state.
* The application must still feel fully navigable and interactive.

## Domain terminology override

Use `Job` consistently throughout the application.

A Job is a freelance opportunity created by a Client.

Use:

* Job
* Jobs
* Job Card
* Job Detail
* Create Job
* Edit Job
* My Jobs
* Saved Jobs
* Job Applicants
* Job Status

Do not use `Gig`, `Gigs`, `Project Posting`, or `Job Gig`.

`Job` overrides any remaining `Gig` terminology inside `DESIGN.md`.

Other domain terms:

* Client: user who creates and manages Jobs.
* Freelancer: user who discovers Jobs and submits Applications.
* Application: a Freelancer's submission to a Job.
* Applicant: a Freelancer who submitted an Application.
* AI Match: an advisory explanation of how well a Freelancer matches a Job.

## Required context

Before writing code, read completely:

1. `AGENTS.md` and applicable nested `AGENTS.md`.
2. `DESIGN.md`.
3. `package.json`.
4. Existing source structure, routes, components, styles, and assets.

Use `DESIGN.md` as the source of truth for:

* colors;
* typography;
* spacing;
* radius;
* shadows;
* layout;
* responsive behavior;
* accessibility;
* visual hierarchy.

Preserve existing project conventions and unrelated user changes.

## Technology constraints

* Use the existing React, Vite, and TypeScript setup.
* Use the existing router and styling solution.
* Reuse installed dependencies before adding new ones.
* Keep components typed and reusable.
* Do not install a heavy UI framework that conflicts with `DESIGN.md`.
* Do not build unnecessary backend-oriented abstractions.
* Mock data must be isolated from presentation components.
* Avoid broad `any` types.

## First step

Inspect the repository and create a short implementation plan containing:

* route map;
* screen inventory;
* reusable component inventory;
* mock-data model;
* Client and Freelancer navigation;
* implementation phases.

Save it as:

```text
docs/ui-implementation-plan.md
```

Then implement the complete UI without waiting for additional confirmation unless a required file is missing.

## Required routes and screens

### Public

* `/` — Landing page
* `/jobs` — Browse and search Jobs
* `/jobs/:jobId` — Public Job detail
* `/freelancers/:freelancerId` — Freelancer public profile
* `/clients/:clientId` — Client public profile

### Authentication UI

* `/auth/sign-in` — Sign in
* `/auth/sign-up` — Sign up
* `/auth/select-role` — Select Client or Freelancer role
* `/auth/forgot-password` — Forgot password
* `/auth/reset-password` — Reset password

These are visual flows only. Successful submission should navigate to an appropriate mock dashboard.

### Freelancer

* `/freelancer/dashboard` — Freelancer overview
* `/freelancer/saved-jobs` — Saved Jobs
* `/jobs/:jobId/apply` — Submit Application
* `/freelancer/applications` — My Applications
* `/freelancer/applications/:applicationId` — Application detail
* `/freelancer/profile` — Own profile
* `/freelancer/profile/edit` — Edit profile and portfolio

### Client

* `/client/dashboard` — Client overview
* `/client/jobs` — My Jobs
* `/client/jobs/new` — Create Job
* `/client/jobs/:jobId/edit` — Edit Job
* `/client/jobs/:jobId/manage` — Manage Job
* `/client/applicants` — Applicants across Jobs
* `/client/jobs/:jobId/applicants` — Applicants for one Job
* `/client/jobs/:jobId/applicants/:applicationId` — Applicant detail
* `/client/profile` — Own Client profile
* `/client/profile/edit` — Edit Client profile

### Shared and system

* `/notifications` — Notifications
* `/settings` — Account settings
* `/unauthorized` — Sign-in required
* `/forbidden` — Insufficient role or ownership
* `*` — Not found

Adapt exact route organization only when required by the existing router.

## Application preview controls

Because authentication is not connected, provide a development-only role preview control.

It must allow switching between:

* Guest
* Freelancer
* Client
* Client viewing an owned Job
* Client viewing another Client's Job

Use the selected preview role to demonstrate:

* role-specific navigation;
* owner-only controls;
* Freelancer Application actions;
* Client applicant-management actions;
* unauthorized and forbidden states.

Keep this preview mechanism isolated so it can be removed when real authentication is added.

Do not show it as a normal production feature.

## Mock data

Create typed mock data for:

* users;
* Clients;
* Freelancers;
* profiles;
* skills;
* portfolio items;
* Jobs;
* saved Jobs;
* Applications;
* AI Match explanations;
* notifications.

Include enough varied data to demonstrate:

* open and closed Jobs;
* draft and filled Jobs;
* different budgets;
* different skills;
* complete and incomplete profiles;
* strong, potential, and limited AI matches;
* submitted, reviewing, shortlisted, accepted, rejected, and withdrawn Applications;
* Jobs with no Applications;
* filtered empty results.

Use realistic fictional content.

Do not use lorem ipsum.

Do not use real company logos, fake testimonials, or fake platform success metrics.

## Design foundations

Create reusable visual foundations before feature screens:

* design tokens from `DESIGN.md`;
* typography;
* page containers;
* public navigation;
* authenticated application shell;
* Freelancer navigation;
* Client navigation;
* buttons;
* inputs;
* selects;
* text areas;
* checkboxes;
* badges;
* skill chips;
* cards;
* menus;
* dialogs;
* drawers;
* tabs;
* pagination;
* skeletons;
* empty states;
* error states;
* toast feedback.

Use:

* cream page canvas;
* white interactive surfaces;
* cobalt primary actions;
* violet only for AI Match;
* semantic colors for statuses;
* 10px dashboard controls;
* 16px cards and dialogs;
* pill shapes for badges, chips, filters, and marketing CTAs only.

Do not apply landing-page typography to dashboard screens.

## Core feature components

Create and reuse components equivalent to:

* `AppShell`
* `PublicHeader`
* `RoleNavigation`
* `PageHeader`
* `JobCard`
* `JobStatusBadge`
* `ApplicationStatusBadge`
* `SkillChip`
* `SearchInput`
* `JobFilters`
* `ActiveFilterChips`
* `Pagination`
* `JobForm`
* `ApplicationForm`
* `ApplicantCard`
* `ApplicantTable`
* `ApplicantDetail`
* `AiMatchSummary`
* `ProfileSummary`
* `ProfileCompleteness`
* `NotificationItem`
* `LoadingSkeleton`
* `EmptyState`
* `ErrorState`
* `ConfirmDialog`
* `ForbiddenState`

Adapt filenames to existing project conventions.

## Public experience

### Landing page

Build a complete landing page with:

* public navigation;
* clear headline;
* supporting copy;
* primary CTA for finding Jobs;
* secondary CTA for posting a Job;
* separate Client and Freelancer value sections;
* product UI preview;
* workflow explanation;
* restrained final CTA section;
* footer.

Use the marketing typography and restrained cream-to-blue gradient from `DESIGN.md`.

Do not copy Dock's content, logos, customer names, screenshots, or layout verbatim.

### Browse Jobs

Include:

* prominent keyword search;
* category filter;
* skill filter;
* budget range;
* experience level;
* work arrangement;
* posted date;
* sort order;
* active filter chips;
* result count;
* responsive Job list or grid;
* pagination;
* loading skeleton;
* empty state;
* filtered empty state;
* mock error state.

Search and filter interactions must work locally.

Represent filter state in the URL when the existing router supports query parameters.

### Job detail

Include:

* title;
* Client identity;
* verification state;
* Job status;
* description;
* deliverables;
* required skills;
* experience level;
* work arrangement;
* budget;
* timeline;
* Application deadline;
* saved state;
* Apply action for Freelancers;
* Manage Job action for the owning Client;
* no owner controls for other Clients.

## Freelancer experience

Build:

* dashboard summary;
* recommended Jobs;
* recent Application updates;
* saved Jobs;
* Job search;
* Job detail;
* Application form;
* My Applications;
* Application detail;
* profile;
* profile editor;
* skills editor;
* experience editor;
* portfolio editor;
* profile-completeness UI.

Application submission is a local interaction.

After mock submission:

* show a success state;
* add the Application to local mock state;
* navigate to its detail screen;
* prevent duplicate submission for the same Job.

Withdrawing an Application must show a confirmation dialog and update local state.

## Client experience

Build:

* Client dashboard;
* My Jobs;
* Create Job;
* Edit Job;
* Manage Job;
* Applicants across Jobs;
* Applicants for one Job;
* Applicant detail;
* Client profile;
* Client profile editor.

The Job form should be organized into:

1. Overview
2. Scope and requirements
3. Skills and experience
4. Budget and timeline
5. Review and publish

Support local draft and publish interactions.

Only the mock owner of a Job may see:

* Edit Job
* Manage Applicants
* Close Job
* Cancel Job
* Shortlist Applicant
* Accept Freelancer
* Reject Application

## Applicant decision flow

The Applicant detail screen must show:

* Freelancer identity;
* professional title;
* proposed rate;
* estimated duration;
* cover letter;
* relevant skills;
* work experience;
* portfolio evidence;
* Application status;
* AI Match explanation;
* decision actions.

Before accepting a Freelancer, show a confirmation dialog that:

* identifies the Freelancer;
* identifies the Job;
* explains that only one Freelancer may be selected;
* prevents duplicate confirmation while the mock action is pending.

After confirmation:

* mark the selected Application as Accepted;
* mark the Job as Filled;
* update other pending Applications consistently;
* show success feedback.

This behavior is local mock state only.

## AI Match UI

AI Match must include:

* Strong, Potential, or Limited Match label;
* mock percentage;
* matching skills;
* missing or weak requirements;
* concise explanation;
* calculating skeleton;
* unavailable state;
* stale state;
* retry interaction;
* required disclaimer from `DESIGN.md`.

Use violet only for AI-specific emphasis.

AI Match must not visually dominate the Freelancer's actual experience, portfolio, cover letter, or proposed rate.

Clearly indicate that mock scores are demonstration data.

## Required UI states

Every major data-driven screen must support visual demonstrations of:

* loading;
* populated;
* empty;
* filtered empty;
* validation error;
* generic error;
* unauthorized;
* forbidden;
* not found;
* successful action;
* pending action;
* disabled action;
* destructive confirmation.

Provide a development-only method to preview these states where appropriate.

Do not create separate production routes for every state unless that improves the existing architecture.

## Animation and interaction

Add polished, restrained animation.

Recommended motion:

* page content entrance with subtle opacity and vertical movement;
* staggered Job-card entrance;
* smooth filter-chip addition and removal;
* animated mobile navigation drawer;
* dialog and sheet entrance/exit;
* tab indicator transition;
* button press feedback;
* skeleton shimmer;
* saved Job icon transition;
* status-change transition;
* subtle AI Match reveal;
* toast entrance and exit;
* accordion and expandable-section transitions.

Motion rules:

* standard UI transitions: 150–200ms;
* dialog and drawer transitions: 200–250ms;
* use opacity and transform where possible;
* avoid layout-shifting animations;
* do not animate every element;
* do not use large bouncing effects;
* do not scale cards on hover;
* respect `prefers-reduced-motion`;
* keep interactions responsive while animation is running.

Use the existing animation library if one is already installed.

If no animation library exists, prefer CSS transitions and keyframes. Add a dependency only when it materially improves maintainability.

## Responsive requirements

Verify at:

* 375px mobile;
* 768px tablet;
* 1280px desktop;
* 1440px desktop.

On mobile:

* collapse desktop navigation;
* use a drawer or bottom sheet for filters;
* stack Job metadata by priority;
* convert Applicant tables to cards or intentional horizontal scrolling;
* use full-width form controls where appropriate;
* maintain at least 44px touch targets;
* prevent horizontal overflow;
* do not depend on hover.

Do not simply scale down the desktop layout.

## Accessibility

Implement:

* semantic HTML;
* correct heading hierarchy;
* visible focus states;
* keyboard navigation;
* accessible icon buttons;
* associated form labels and errors;
* focus management for dialogs;
* reduced-motion support;
* status text in addition to color;
* accessible contrast;
* useful alternative text;
* appropriate live announcements for local asynchronous interactions.

## Visual restrictions

Avoid:

* generic admin-dashboard styling;
* excessive nested cards;
* heavy shadows;
* glassmorphism;
* neon effects;
* random gradients;
* oversized dashboard headings;
* pill-shaped dashboard buttons everywhere;
* violet ordinary CTAs;
* decorative AI brain illustrations;
* meaningless charts;
* copied Dock branding.

The result must look like one coherent product rather than a collection of unrelated templates.

## Visual review

After each major feature group:

1. Run the application.
2. Open every implemented route.
3. Inspect desktop and mobile layouts.
4. Exercise primary interactions.
5. Inspect important UI states.
6. Fix overflow, spacing, hierarchy, contrast, and animation problems.

Run `$web-design-guidelines` against the relevant UI files when that skill is available.

Fix applicable findings before completion.

## Validation

Before completion, run the repository's available commands for:

* formatting;
* lint;
* TypeScript checking;
* tests;
* production build.

Fix errors introduced by this work.

Do not disable lint rules, weaken TypeScript, delete tests, or hide build failures.

## Completion report

Report:

1. Screens and routes implemented.
2. Reusable components created.
3. Mock-data and local-state behavior.
4. Role and ownership previews.
5. Animations added.
6. Responsive widths verified.
7. Accessibility review results.
8. Validation commands and outcomes.
9. Remaining limitations.

The task is complete only when all screens are connected through working navigation, major interactions work with local mock state, responsive layouts are verified, and the production build succeeds.
