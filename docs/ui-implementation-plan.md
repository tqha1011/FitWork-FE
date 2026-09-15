# UI implementation plan

## Scope and sources

Build FitWork, a navigable freelance marketplace using React, TypeScript, Vite,
React Router, Tailwind, Lucide, and local mock state. `PROMPT.md` overrides legacy
Job terminology and API requirements in `DESIGN.md`. No backend or real auth.

## Route map and screen inventory

| Area | Routes | Screens |
| --- | --- | --- |
| Public | `/`, `/jobs`, `/jobs/:jobId`, `/freelancers/:freelancerId`, `/clients/:clientId` | Landing, filtered discovery, Job details, public profiles |
| Authentication | `/auth/sign-in`, `/auth/sign-up`, `/auth/select-role`, `/auth/forgot-password`, `/auth/reset-password` | Local sign-in, registration, explicit role choice, password recovery and reset |
| Freelancer | `/freelancer/dashboard`, `/freelancer/saved-jobs`, `/jobs/:jobId/apply`, `/freelancer/applications`, `/freelancer/applications/:applicationId`, `/freelancer/profile`, `/freelancer/profile/edit` | Overview, saved list, application form/list/detail, profile/editor |
| Client | `/client/dashboard`, `/client/jobs`, `/client/jobs/new`, `/client/jobs/:jobId/edit`, `/client/jobs/:jobId/manage`, `/client/applicants`, `/client/jobs/:jobId/applicants`, `/client/jobs/:jobId/applicants/:applicationId`, `/client/profile`, `/client/profile/edit` | Overview, owned Jobs, grouped editor, management, applicant list/detail, profile/editor |
| Shared | `/notifications`, `/settings`, `/unauthorized`, `/forbidden`, `*` | Notification inbox, settings, authorization and missing-resource states |

## Reusable components

PublicHeader, AppShell, RoleNavigation, PageHeader, Button, Field, Select,
Checkbox, Card, StatusBadge, SkillChip, Avatar, JobCard, SearchInput,
JobFilters, ActiveFilterChips, Pagination, ConfirmDialog, Drawer, Tabs,
LoadingSkeleton, EmptyState, ErrorState, DataBoundary, AiMatchSummary,
ProfileCompleteness, ApplicantTable, ApplicationForm, JobForm, toast feedback.

## Mock-data model

Typed User/Role, ClientProfile, FreelancerProfile, Experience, PortfolioItem,
Job/JobStatus, Application/ApplicationStatus, AiMatch, Notification, PreviewState.
Seed varied fictional Jobs and all application statuses. Central React context
holds role, saved IDs, profiles, Jobs, applications, notifications, and settings.
Persist only fictional demo state in session storage. Credentials are never stored.
Mutations validate current role, ownership, Job eligibility, and duplicate actions.
Accepting an application fills the Job and rejects remaining pending applications.

## Navigation and previews

Guest: Find Jobs, how it works, sign in, get started. Freelancer: overview,
Find Jobs, Saved Jobs, My Applications, profile. Client: overview, My Jobs,
Applicants, Create Job, profile. Both roles: notifications and settings.
Development-only controls switch role/ownership and loading, empty, error,
AI, and access states; these controls are omitted from production builds.

## Implementation phases

1. Foundations, public shell, landing, discovery, Job detail, responsive navigation.
2. Freelancer applications, authentication UI, profiles and editors.
3. Client Jobs and applicant review/decision workflows.
4. Shared screens, integrated interactions, responsive/accessibility review.

Each phase is rendered before independent brief, system, and craft criticism.
Run Prettier, ESLint, TypeScript/build, route and interaction browser checks at
375, 768, 1280, and 1440 pixels. Record evidence in `.design-loop/`.
