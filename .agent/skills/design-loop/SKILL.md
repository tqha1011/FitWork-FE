---

name: design-loop
description: Builds and iteratively critiques a visual deliverable against a specific real-world reference and design system. Use when the user invokes "$design-loop" or asks to run a design or critic loop against a reference.
----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

# Design Loop

Build a visual deliverable through four ordered phases:

1. Interview
2. Preflight
3. Teardown
4. Build and critic loop

Do not skip phases. Do not modify or build the deliverable during Phases 1–3.

Store working artifacts in:

```text
.design-loop/
├── bar.md
└── progress.md
```

## Phase 1: Interview

Ask exactly these three questions together, then stop and wait for the user's response:

1. What are you building, and how large or long should it be?
2. What existing real-world example does this brilliantly? Provide a specific page, URL, file, video, or document that can be opened. If nothing comes to mind, say `skip`.
3. What files should be used as inputs? Examples include a design system, brand document, script, existing draft, API specification, or repository.

If the user gives a vague reference such as “Apple’s website” or “a good SaaS design,” ask once for the exact page, URL, or file, then stop and wait.

Do not accept a vague reference silently. A critic cannot make a reliable comparison without a concrete bar.

If the user answers `skip` to question 2:

1. Propose three concrete candidate references.
2. Explain in one line why each is relevant.
3. Ask the user to choose one.
4. Stop and wait.

If the user does not choose after being asked, select the most demanding applicable reference and clearly disclose the selection.

## Phase 2: Preflight

Perform preflight checks before modifying the deliverable.

### Reference access

Fetch and inspect the selected reference immediately.

For websites:

* Open the exact referenced page.
* Capture relevant desktop and mobile screenshots.
* Capture important interaction states when accessible.

For videos or animation:

* Inspect the source.
* Produce or capture a representative filmstrip of frames.

For documents:

* Read the source.
* Render the relevant pages to images or PDF previews.

If the reference is inaccessible, blocked, missing, or cannot be rendered reliably, stop and ask the user for another reference.

Do not substitute an imagined version of the reference.

### Output rendering

Confirm that the resulting deliverable can be rendered and inspected:

* Websites: running preview and screenshots at relevant viewports.
* Animation or video: rendered output and a representative frame sequence.
* Documents: PDF or page-image render.
* Other visual artifacts: an appropriate viewable render.

If the output cannot be rendered, identify the Craft critic as blocked and stop.

### Tools

Identify any generation or inspection tools required by the goal, including:

* image generation;
* video generation;
* voice generation;
* browser rendering;
* document rendering;
* application runtime;
* API or backend runtime.

Confirm that required tools are available before proceeding.

Do not claim a tool is available without checking.

### Input files

Verify every file identified by the user.

Determine the design-system source using this order:

1. Use `design-system.md` when present.
2. Otherwise, use the supplied design or brand specification.
3. Otherwise, ask whether to derive a design system from the reference.

If no design-system source exists, the System critic is blocked. Stop and wait for the user's decision.

For API-backed applications, determine the API contract source using this order:

1. OpenAPI or Swagger specification.
2. Backend controllers, DTOs, schemas, and enums.
3. An explicitly approved mock contract.

Do not invent endpoints, request fields, response fields, enums, authentication behavior, or error formats.

If API compatibility is part of the goal and no contract source is available, identify the Brief critic as partially blocked and stop.

### Preflight report

Report preflight results in one concise block containing:

* what is working;
* what is missing;
* the selected reference;
* the selected design-system source;
* the selected API contract source, when relevant;
* how the result will be rendered;
* which critic would be blind or blocked by any missing input;
* whether the loop is ready to begin.

Never continue with a critic that cannot inspect the evidence required for its verdict.

## Phase 3: Teardown

Study the selected reference and identify five to seven visible mechanisms that make it effective.

Write the mechanisms to `.design-loop/bar.md`.

Describe mechanisms, not impressions or adjectives.

Unusable observations:

* “It feels premium.”
* “The design is modern.”
* “The spacing looks good.”

Useful mechanisms:

* “The headline is approximately five times the body-text size.”
* “Only three type sizes appear above the fold.”
* “One accent color appears at most twice per screen.”
* “Primary motion resolves in a consistent direction.”
* “Whitespace occupies at least 40% of the first viewport.”
* “The primary action is the only filled button above the fold.”

Every mechanism must be something the Craft critic can verify by inspecting rendered output.

Extract principles rather than copying protected branded assets, proprietary wording, or distinctive compositions unless the user supplied them or explicitly authorized their use.

After writing `.design-loop/bar.md`:

1. Show its complete contents to the user.
2. Explain any mechanism that required interpretation.
3. Ask for approval.
4. Stop and wait.

Do not begin building until the user approves the bar.

## Phase 4: Build and Critic Loop

### Divide the work

Split the goal into the smallest pieces that can be built, rendered, and judged independently.

Use three or four pieces by default. Use more only when the user requests it or when fewer pieces would prevent meaningful independent evaluation.

Examples for a website might include:

* global shell and navigation;
* primary landing or dashboard view;
* core workflow;
* responsive and system states.

Record the pieces in `.design-loop/progress.md` before implementation begins.

### Builder

Assign each piece to a builder with the minimum context required:

* approved goal and scope;
* relevant user inputs;
* approved design-system source;
* API contract source when applicable;
* relevant section of `.design-loop/bar.md`;
* current largest gaps from the previous round.

The builder may inspect and modify implementation code.

The builder must render the result before submitting the piece for criticism.

The builder must not judge or approve its own work.

### Independent critics

After a piece has been rendered, run three independent critics with fresh context.

Each critic must:

* receive only the evidence required for its role;
* have no access to the builder’s reasoning;
* avoid relying on another critic’s verdict;
* return a binary `PASS` or `FAIL`;
* name exactly one largest actionable gap when returning `FAIL`.

Do not reuse a critic conversation from a previous round. Start each critic with fresh context on every round.

#### Brief critic

Provide the Brief critic with:

* the approved user goal;
* scope and acceptance criteria;
* the rendered output;
* access to observable application behavior when relevant.

The Brief critic determines whether the piece accomplishes its intended job.

It must ignore visual taste except where visual clarity prevents the goal from being achieved.

For interactive work, it must inspect behavior from the user's perspective rather than reading implementation code.

For API-backed interfaces, it must exercise relevant observable flows against the running API or explicitly approved mock contract, including applicable:

* request and response behavior;
* authentication and authorization;
* loading states;
* empty states;
* validation states;
* error states;
* pagination or filtering behavior.

The Brief critic must not inspect source code or the builder’s reasoning.

#### System critic

Provide the System critic with:

* the approved design-system source;
* the rendered output at relevant viewports and states.

The System critic checks objective adherence to the design system, including applicable:

* typography;
* color tokens;
* spacing;
* grid and alignment;
* component usage;
* responsive rules;
* interaction states;
* accessibility-visible states.

The System critic must not inspect source code, `.design-loop/bar.md`, the reference, or the builder’s reasoning.

#### Craft critic

Provide the Craft critic with:

* `.design-loop/bar.md`;
* rendered output from the reference;
* rendered output from the current piece.

Present the two outputs side by side when possible.

Remove product labels or other identifying commentary from the comparison when doing so does not alter the work itself.

The Craft critic must:

1. compare visible results without implementation context;
2. determine which output better satisfies the approved mechanisms;
3. return `PASS` only when ours is at least as effective for the approved goal;
4. otherwise return `FAIL`;
5. identify the single largest visible gap.

The Craft critic must not inspect source code, design-system instructions, builder reasoning, or other critics’ verdicts.

### Verdict rules

A piece is complete only when all three critics return `PASS` in the same round.

Do not use numeric scores.

Do not average verdicts.

Do not override a failed verdict with majority approval.

Do not claim that critics “agree ours wins.” The actual completion condition is:

* Brief critic: `PASS`
* System critic: `PASS`
* Craft critic: `PASS`

When a critic fails:

1. Select the most consequential actionable gap.
2. Send that gap to the builder.
3. Rebuild the piece.
4. Render the updated result.
5. Start three new fresh-context critics.
6. Record the new round and verdicts.

If multiple critics fail, prioritize the gap that most directly blocks the stated goal. If equally important, prioritize in this order:

1. Brief
2. System
3. Craft

Do not send a large list of minor criticism to the builder in one round.

### Progress tracking

Maintain `.design-loop/progress.md` throughout the loop.

Use this structure:

```md
# Design Loop Progress

## Summary

- Goal:
- Reference:
- Design-system source:
- API contract source:
- Render method:
- Started:
- Current piece:

## Pieces

| Piece | Status | Current round | Brief | System | Craft |
|---|---|---:|---|---|---|
| Example | In progress | 1 | PASS | FAIL | FAIL |

## Gap History

### Piece: Example

#### Round 1

- Brief: PASS
- System: FAIL — largest gap:
- Craft: FAIL — largest gap:
- Gap returned to builder:
- Result:

## Blockers

- None
```

Update the file after every builder submission and critic round.

Valid piece statuses are:

* `Not started`
* `Building`
* `Critiquing`
* `Blocked`
* `Passed`

### Stopping conditions

There is no predetermined maximum round count.

Pause the loop and ask the user for direction when:

* the same primary gap remains after two attempted fixes;
* critics produce directly contradictory requirements;
* the reference or a required tool becomes unavailable;
* a critic loses access to required evidence;
* fixing the gap requires changing approved scope or architecture;
* progress requires credentials, destructive actions, external publication, or new authorization;
* the user-defined checkpoint is reached;
* further improvement would require copying protected material instead of applying general mechanisms.

Never hide a blocker or mark a blocked critic as passed.

The user may stop the loop at any time.

## Cost and progress reporting

Do not estimate or invent token usage.

Report only observable progress:

* completed pieces;
* total pieces;
* round count per piece;
* current critic verdicts;
* current blocker or largest gap.

If the user sets a round, time, or cost ceiling, treat it as a checkpoint.

Pause and ask for permission before proceeding beyond that checkpoint.

Explain plainly that an open-ended critic loop continues until all critics pass, a blocker is reached, or the user stops it.

## Completion

The design loop is complete only when:

* every planned piece has passed all three critics;
* the complete deliverable has been rendered;
* the integrated result still satisfies the approved goal;
* the final progress file contains the final verdicts;
* required project validation commands succeed.

For code-based projects, run the repository’s applicable validation commands, such as:

* lint;
* type checking;
* tests;
* production build.

For API-backed projects, verify that generated or handwritten client types remain consistent with the approved API contract.

Do not claim successful completion when validation commands fail.

At completion, report:

* what was built;
* which pieces passed;
* total rounds for each piece;
* validation commands and results;
* any remaining limitations.
