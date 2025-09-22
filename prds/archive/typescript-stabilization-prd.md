## PRD: TypeScript Stabilization for Core CLI Build/Run

### Summary
- Stabilize TypeScript compilation and runtime for the core CLI path without refactoring peripheral/archival code.

### Background & Problem
- TypeScript build on `main` fails due to strict settings and non-critical code paths, blocking efficient development and build/run validation.

### Goals
- Ensure a clean build/run path for the core CLI in TypeScript:
  - Successful `npm run build` for core paths.
  - Compiled CLI runs: `node dist/generate-resume.js`.

### Non-Goals
- Deep type perfection of peripheral services.
- Lint noise elimination across the repo.
- Converting test archives into typed code (archives remain excluded).

### Users & Use Cases
- As a developer, I want the TypeScript project to compile and the compiled CLI to run reliably for document generation, keyword analysis, and evaluation flows.

### Current Issues (TypeScript)
- Strict TS configuration surfaces many errors in peripheral areas not needed for core CLI run.
- ESM module resolution and import path consistency can block runtime if not standardized.

### Proposed Solution (TypeScript Only)
- tsconfig targeting:
  - Exclude archives from TypeScript checks/build: `**/test-archive/**` (and similar archival paths).
  - Keep strict settings for core CLI; relax only via excludes, not by downgrading global compiler options.
- Module resolution and runtime:
  - Standardize ESM imports for source so compiled JS in `dist/` runs cleanly.
  - Build and run flow:
    - `npm run build` → emits `dist/`
    - `node dist/generate-resume.js <app> [flags]`

### TypeScript Stabilization Plan (Core Only)
- tsconfig targeting:
  - Exclude archives from TypeScript checks/build: `**/test-archive/**` (and similar archival paths).
  - Keep strict settings for core CLI; relax only if necessary and only in non-critical paths.
- Module resolution and runtime:
  - Standardize ESM imports for source so compiled JS in `dist/` runs cleanly.
  - Build and run flow:
    - `npm run build` → emits `dist/`
    - `node dist/generate-resume.js <app> [flags]`

### Deliverables
- Updated TypeScript configuration to exclude archives.
- Minimal source adjustments (only if required) for ESM path consistency in core CLI.
- Verified compiled runtime for standard app flows (docs, evaluate, keywords).

### Acceptance Criteria
- `npm run build` completes successfully for the core CLI path.
- Compiled CLI commands succeed on a standard test application:
  - `node dist/generate-resume.js relay-director-of-product` (default documents)
  - `node dist/generate-resume.js relay-director-of-product --evaluate` (current behavior; no change to semantics)
  - `node dist/generate-resume.js relay-director-of-product --all`

### Out of Scope (now)
- Refactoring peripheral services for strict typing.
- Resolving all linter warnings/recommendations.

### Risks & Mitigations
- Risk: Broad TS fixes cause churn.
  - Mitigation: Exclude archives and only touch core files that block build/run.
- Risk: ESM path edge cases at runtime.
  - Mitigation: Test compiled `dist/` commands for standard app.

### Rollback Plan
- Revert the small planning and help-text edits.
- Remove/undo tsconfig exclude entries if necessary.

### Milestones
- M1: TS stabilization on `main` (tsconfig excludes + minimal fixes to ensure build/run).
- M2: Verification on standard app and smoke tests.

### Testing Plan
- Unit/smoke: Run local validation pipeline and smoke tests for CLI where applicable.
- E2E commands on a standard application:
  - Document generation (default and explicit flags)
  - Evaluation and keyword analysis basic smoke (no semantics change)

### Guiding Principles (Refactoring Guide)
- Subtract complexity; avoid new frameworks/abstractions.
- Keep changes small, predictable, and easily reversible.
- Ensure obvious edit points (planning function, help text, tsconfig excludes).

### Explicit Refactoring Guidelines To Follow
- Grep Test:
  - Searching for `tsconfig` and build paths should surface a single control point in `tsconfig.json`.
  - Imports for CLI entry points should be obvious and consistent (no scattered wrappers).
- Obvious Location Test:
  - Scope control only in `tsconfig.json` (excludes) and, if strictly required, minimal import path fixes in CLI entry points.
- 15-Minute Human Test:
  - The change must be explainable in one sentence: “Narrow TS scope via excludes; keep strict core; ensure compiled CLI runs.”
- Rollback Test:
  - Revert is limited to tsconfig exclude entries and any minimal path adjustments.
- Subtraction over addition:
  - No new abstractions, registries, factories, or configuration layers.
- One-File Rule:
  - Avoid net-new runtime code files; documentation only.
- Avoid Rabbit Holes:
  - Do not attempt repo-wide type perfection. Exclude archives (`**/test-archive/**`) and defer peripheral strict typing.

### Engineering Constraints
- Module strategy: Prefer build-then-run (compiled `dist/`) rather than `ts-node` for routine runs.
- Strictness: Keep `strict` in core; relax only via targeted excludes, not by downgrading global compiler options.
- Commit discipline: Atomic, scoped commits on `app/` repo; allow `--no-verify` temporarily per policy.

---

## Implementation Spec (Agent-Facing)

This section details the exact execution plan and edits required for the AI agent to implement.

### 1) File-by-File Edits

- `app/tsconfig.json`
  - Add excludes for archives to stabilize core TS build:
    - Add `**/test-archive/**` to `exclude` array (and similar archival paths if present).
  - Do NOT change global strict settings.

- CLI entry points (only if necessary to fix runtime):
  - Ensure ESM import paths remain consistent so compiled `dist/` runs (avoid source-only `.js` extension mismatches that break runtime).

### 2) Runtime Expectations (No Behavior Change)

- Preserve current CLI semantics; no functional changes intended.
- Ensure compiled `dist/` commands run consistently:
  - `node dist/generate-resume.js <app>`
  - `node dist/generate-resume.js <app> --evaluate`
  - `node dist/generate-resume.js <app> --all`

### 3) Acceptance Tests (Commands & Expected Results)

Assume standard app: `relay-director-of-product`.

- Build
  - `npm run build`
  - Expect: TypeScript compiles successfully for core scope; assets copied to `dist/`.

- Default documents
  - `node dist/generate-resume.js relay-director-of-product`
  - Expect: Resume + cover letter + combined DOCX in `data/applications/<app>/outputs/`.

- Evaluation
  - `node dist/generate-resume.js relay-director-of-product --evaluate`
  - Expect: Current semantics preserved; evaluation completes and outputs to `working/`.

  

- All-in-one
  - `node dist/generate-resume.js relay-director-of-product --all`
  - Expect: Documents + keyword analysis outputs + evaluation outputs.

### 4) Rollback Instructions

- Remove `**/test-archive/**` from `tsconfig.json` `exclude` if added.
- Revert any minimal path adjustments made for runtime if they introduce regressions.

### 5) Guardrails (from Refactoring Guide)

- Subtract complexity; no new abstractions or layers.
- Keep edits limited to the files above; avoid touching peripheral services.
- Grep test must pass:
  - Searching `tsconfig` / excludes / CLI entry imports should take an agent to the obvious locations changed.
- One-file rule: No net-new runtime code files; only this PRD is new documentation.
- Avoid rabbit holes: Do not attempt repo-wide TS perfection. Focus on build/run viability for the core CLI path.

### 6) Dev/CI Notes

- Commits may use `--no-verify` temporarily, per policy.
- Preferred dev loop: build once (`npm run build`), run compiled JS (`node dist/...`).

### 7) Tickets & To-Dos

- When kicking off implementation in a fresh chat, create structured to-dos using Cursor Agent planning and queueing per the docs, then execute sequentially.
  - Reference: [Cursor Agent Planning – Agent to-dos](https://docs.cursor.com/en/agent/planning#agent-to-dos)



