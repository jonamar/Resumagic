## PRD: Orthogonal CLI Evaluation Flag and TypeScript Stabilization

### Summary
- Decouple the `--evaluate` flag from document generation so evaluation runs independently unless users explicitly request document outputs.
- Stabilize TypeScript compilation and runtime for the core CLI path without refactoring peripheral/archival code.

### Background & Problem
- Current behavior binds `--evaluate` to document generation, causing unintended DOCX creation when a user only wants hiring evaluation.
- TypeScript build on `main` fails due to strict settings and non-critical code paths, blocking efficient development and build/run validation.

### Goals
- Make CLI features composable and orthogonal:
  - `--evaluate` triggers hiring evaluation only.
  - Document generation only occurs when document flags are used or when `--all` is specified.
- Ensure a clean build/run path for the core CLI in TypeScript:
  - Successful `npm run build` for core paths.
  - Compiled CLI runs: `node dist/generate-resume.js`.

### Non-Goals
- Deep type perfection of peripheral services.
- Lint noise elimination across the repo.
- Converting test archives into typed code (archives remain excluded).

### Users & Use Cases
- As a developer, I want to run hiring evaluation on existing resume data without regenerating DOCX files.
- As a user, I want to combine features when I choose (e.g., `--resume --evaluate`) and run the full workflow with `--all`.

### Current Behavior (Coupling Evidence)
The planning logic currently couples `--evaluate` with document generation:

```62:75:app/core/generation-planning.ts
// Handle --evaluate flag (documents + hiring evaluation)
else if (flags.evaluate) {
  if (hasMarkdownFile) {
    generateResume = true;
    generateCoverLetter = true;
    generateCombinedDoc = true;
  } else {
    generateResume = true;
  }
  runHiringEvaluation = true;
  behaviorDescription = hasMarkdownFile ?
    'Document generation + hiring evaluation' :
    'Resume generation + hiring evaluation';
}
```

Document orchestration is always invoked before evaluation:

```225:235:app/cli/command-handler.ts
// Execute document generation
const _generatedFiles = await orchestrateGeneration(generationPlan, paths, resumeData, flags.preview);

// Execute additional services if requested
if (generationPlan.runHiringEvaluation) {
  if (flags.all) {
    await runKeywordAnalysis(applicationName);
  }
  await runHiringEvaluation(applicationName, resumeData, flags.fast, flags.evalModel, flags.evalParallel, flags.evalTemperature);
}
```

### Proposed Solution
- Orthogonalize feature flags:
  - `--evaluate` sets only `runHiringEvaluation = true`.
  - Document flags control document generation (`--resume`, `--cover-letter`, `--combined`, `--both`, `--auto`).
  - `--all` intentionally composes: documents + keyword analysis + evaluation.
- Keep orchestration call order as-is; do not special-case to skip orchestration when no doc flags are set (simple and predictable flow).
- Update CLI help text to clearly state the new semantics and how to compose flags.

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
- Updated planning logic to orthogonalize `--evaluate`.
- Updated CLI help text.
- Updated TypeScript configuration to exclude archives.
- Verified compiled runtime for standard app flows (docs, evaluate, keywords).

### Acceptance Criteria
- Running `node dist/generate-resume.js <application> --evaluate` performs evaluation only (no DOCX files generated) unless document flags are also provided.
- `--all` continues to run documents + keyword analysis + evaluation.
- `npm run build` completes successfully for the core CLI path.
- Compiled CLI commands succeed on a standard test application:
  - `node dist/generate-resume.js relay-director-of-product` (default documents)
  - `node dist/generate-resume.js relay-director-of-product --evaluate` (evaluation only)
  - `node dist/generate-resume.js relay-director-of-product --resume --evaluate` (docs + evaluation via composition)

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
- M1: PR updating planning logic and CLI help text (feature branch).
- M2: TS stabilization on `main` (tsconfig excludes + minimal fixes to ensure build/run).
- M3: Verification on standard app and smoke tests.
- M4: Merge feature branch into `main`.

### Testing Plan
- Unit/smoke: Run local validation pipeline and smoke tests for CLI where applicable.
- E2E commands on a standard application:
  - Document generation (default and explicit flags)
  - Evaluation-only
  - Composed flags (docs + evaluation)
  - Keyword analysis one-off

### Guiding Principles (Refactoring Guide)
- Subtract complexity; avoid new frameworks/abstractions.
- Keep changes small, predictable, and easily reversible.
- Ensure obvious edit points (planning function, help text, tsconfig excludes).

### Explicit Refactoring Guidelines To Follow
- Grep Test:
  - Searching for `evaluate` should surface a single obvious control point in `core/generation-planning.ts` and not scattered wrappers.
  - Document help/flags live in `theme.ts` and are the single source of truth for user-facing semantics.
- Obvious Location Test:
  - Behavioral changes only in `core/generation-planning.ts` (flag → plan) and `theme.ts` (help text).
  - TypeScript scope control only in `tsconfig.json` (excludes) and, if strictly required, minimal import path fixes in CLI entry points.
- 15-Minute Human Test:
  - The change must be explainable in one sentence: “`--evaluate` runs evaluation only; docs are opt-in via flags or `--all`.”
- Rollback Test:
  - Revert is limited to: revert the small edit in `core/generation-planning.ts` and the help text line in `theme.ts`; remove tsconfig excludes if added.
- Subtraction over addition:
  - No new abstractions, registries, factories, or configuration layers.
  - No new subcommands at this time; flags remain composable and orthogonal.
- One-File Rule:
  - Net-new code should be avoided. The PRD itself is the only new file; code edits touch existing files only.
- Avoid Rabbit Holes:
  - Do not attempt repo-wide type perfection. Exclude archives (`**/test-archive/**`) and defer peripheral strict typing.
  - Do not optimize away a zero-files-created message by skipping orchestration; keep flow simple and predictable.

### Engineering Constraints
- Module strategy: Prefer build-then-run (compiled `dist/`) rather than `ts-node` for routine runs.
- Strictness: Keep `strict` in core; relax only via targeted excludes, not by downgrading global compiler options.
- Commit discipline: Atomic, scoped commits on `app/` repo; allow `--no-verify` temporarily per policy.

---

## Implementation Spec (Agent-Facing)

This section details the exact execution plan and edits required for the AI agent to implement.

### 1) File-by-File Edits

- `app/core/generation-planning.ts`
  - In `determineGenerationPlan(flags, hasMarkdownFile)`, modify the `flags.evaluate` branch to be orthogonal:
    - Set `runHiringEvaluation = true` only.
    - Do NOT set any of: `generateResume`, `generateCoverLetter`, `generateCombinedDoc`.
    - Set `behaviorDescription = 'Hiring evaluation only mode'`.
  - No other logic changes.

- `app/theme.ts`
  - Update `messages.usage.flagDescriptions` for `--evaluate` to:
    - `Run hiring evaluation only (compose with document flags or use --all for full pipeline)`.
  - Ensure flags listing includes `--evaluate`, `--all`, and existing document flags.

- `app/tsconfig.json`
  - Add excludes for archives to stabilize core TS build:
    - Add `**/test-archive/**` to `exclude` array.
  - Do NOT change global strict settings.

- `app/cli/command-handler.ts`
  - No change to control flow: continue to call `orchestrateGeneration(...)` regardless of which doc flags are set. This keeps flow predictable; we accept a possible "0 files created" summary.

### 2) Final CLI Semantics

- Default (no flags):
  - If `cover-letter.md` exists → generate resume, cover letter, and combined.
  - Else → generate resume only.

- `--evaluate`:
  - Runs hiring evaluation only. No documents generated.

- Document flags (individually or combined):
  - `--resume` → resume only
  - `--cover-letter` → cover letter only (requires markdown)
  - `--combined` → combined doc only (requires markdown)
  - `--both` → resume + cover letter
  - `--auto` → resume + cover letter if markdown exists, else resume only

- Compositions:
  - Any doc flag(s) + `--evaluate` → generate requested docs, then run evaluation.

- `--all`:
  - Documents + keyword analysis + hiring evaluation (unchanged).

- Evaluation advanced flags (unchanged behavior, for completeness):
  - `--fast` (speed mode)
  - `--eval-model <name>` (if runner supports `.setModel()`)
  - `--eval-parallel <n>` (sets `OLLAMA_NUM_PARALLEL`)
  - `--eval-temperature <t>` (if runner supports `.setTemperature()`)

### 3) Acceptance Tests (Commands & Expected Results)

Assume standard app: `relay-director-of-product`.

- Build
  - `npm run build`
  - Expect: TypeScript compiles successfully for core scope; assets copied to `dist/`.

- Default documents
  - `node dist/generate-resume.js relay-director-of-product`
  - Expect: Resume + cover letter + combined DOCX in `data/applications/<app>/outputs/`.

- Evaluation-only
  - `node dist/generate-resume.js relay-director-of-product --evaluate`
  - Expect: No new DOCX files created; evaluation output saved to `data/applications/<app>/working/` (e.g., `evaluation-results.json` and summary markdown).

- Composed (docs + evaluation)
  - `node dist/generate-resume.js relay-director-of-product --resume --evaluate`
  - Expect: Resume DOCX created; evaluation output saved to `working/`.

- All-in-one
  - `node dist/generate-resume.js relay-director-of-product --all`
  - Expect: Documents + keyword analysis outputs + evaluation outputs.

### 4) Rollback Instructions

- Revert `app/core/generation-planning.ts` change in the `flags.evaluate` branch to prior logic that enabled document generation.
- Revert `app/theme.ts` help text line for `--evaluate` to its prior description.
- Remove `**/test-archive/**` from `tsconfig.json` `exclude` if added.

### 5) Guardrails (from Refactoring Guide)

- Subtract complexity; no new abstractions or layers.
- Keep edits limited to the files above; avoid touching peripheral services.
- Grep test must pass:
  - Searching `--evaluate` and `evaluate` should take an agent to `generation-planning.ts` and `theme.ts` as the primary control points.
- One-file rule: No net-new runtime code files; only this PRD is new documentation.
- Avoid rabbit holes: Do not attempt repo-wide TS perfection. Focus on build/run viability for the core CLI path.

### 6) Dev/CI Notes

- Commits may use `--no-verify` temporarily, per policy.
- Preferred dev loop: build once (`npm run build`), run compiled JS (`node dist/...`).

### 7) Tickets & To-Dos

- When kicking off implementation in a fresh chat, create structured to-dos using Cursor Agent planning and queueing per the docs, then execute sequentially.
  - Reference: [Cursor Agent Planning – Agent to-dos](https://docs.cursor.com/en/agent/planning#agent-to-dos)



