## PRD: Core TypeScript Stabilization (Complete) + Orthogonal Evaluation + Staged Service Typing

### Summary
Finalize TS migration benefits (useful types, clear code, predictable builds), make hiring evaluation fully orthogonal to document generation (evaluate-only flow), and re-enable service typing in small waves without over-engineering.

### Goals
- Keep core build green with strict TS and boring code.
- Add an orthogonal CLI path: `--evaluate-only` runs evaluation without document generation.
- Stage service typing re-enable:
  - Wave 1: Hiring Evaluation (runner, processor) – compile with strict.
  - Wave 2: Keyword Analysis – compile boundary with strict.

### Non-Goals
- New architectures or deep refactors. No future-proofing.
- Repo-wide lint perfection. Lint should be helpful, not performative.

### Implementation Plan
1) Orthogonal evaluation (CLI)
   - Add `--evaluate-only` flag.
   - Planning: when set, do not generate any DOCX; only run evaluation.
   - Keep `--evaluate` behavior as “docs + eval” unless explicitly overridden by `--evaluate-only`.
   - Update usage/help text.

2) Service typing waves (TS includes)
   - Keep `tsconfig.json` include narrowed to core and selected services only.
   - Wave 1: keep `services/hiring-evaluation/**` included. Add minimal DTOs only at boundaries if needed to keep green build.
   - Wave 2: re-include `services/keyword-analysis/**` and type inputs/outputs (Python interop remains boundary-typed).

3) CI/Lint
   - Run local pipeline `npm run ci:local` after each wave.
   - Address only top actionable lint findings; configs serve the team, not vice versa.

### Acceptance Criteria
- Core build remains green: `npm run build`.
- Evaluate-only: `node dist/generate-resume.js <app> --evaluate-only --fast` succeeds on an app with complete inputs.
- Evaluate (docs + eval): `node dist/generate-resume.js <app> --evaluate --fast` succeeds.
- Wave 1: Hiring Evaluation compiles within include scope; evaluation smokes pass (fast mode).
- Wave 2: Keyword Analysis compiles within include scope; `--all --fast` smokes pass on a complete app.

### Testing Plan
- For each change: build, then run compiled CLI smokes on complete apps (e.g., `test-validation`, `babylist-founding-pm`).
- Evaluate-only, Evaluate, and All-in-one flows.

### Guardrails (Agentic Refactoring Guide)
- Subtraction > addition. No new layers.
- Small, reversible edits. One obvious control point per concern (tsconfig, CLI flags, planning).
- Rollback: revert tsconfig include, remove new flag wiring if needed.

### Rollback Plan
- Remove `--evaluate-only` flag and planning branch.
- Revert tsconfig include changes for services.



