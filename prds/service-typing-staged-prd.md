## PRD: Staged Service Typing & Re‑Enablement (Post-TS Stabilization)

### Summary
Make the current “broken-but-obvious” boundary explicit: core CLI builds and runs; services are temporarily excluded from TypeScript checks. Reintroduce service typing incrementally with light contracts to avoid rabbit holes.

### Background
To stabilize the TypeScript build and compiled CLI, we excluded `services/**` and `scripts/**`. This preserves runtime (dist) behavior while preventing peripheral type churn from blocking core development.

### Goals
- Re-enable TypeScript checks for services in small, safe steps
- Define minimal type contracts per service entry (inputs/outputs, thrown errors)
- Keep changes boring and obvious; avoid refactors unrelated to contracts

### Non-Goals
- Perfect typing across all services
- Architectural rewrites or new frameworks

### Scope (Wave-by-Wave)
1) Hiring Evaluation (runner, processor)
- Add narrow DTOs for function boundaries only (arguments/returns)
- Convert implicit `any` hotspots; replace broad indexing with typed maps
- Keep internal logic intact; no behavior change

2) Keyword Analysis / Extraction
- Define input file path types and return shapes
- Avoid deep typing of Python interop; model only call boundary

3) Vale Linting
- Type process manager status structs and reporter inputs/outputs

### Guardrails (from Agentic Refactoring Guide)
- Grep test: One obvious place to find each service’s contract
- 15-minute human test: Each wave’s change explainable in one sentence
- Rollback: Revert to prior exclude and remove the added contract types
- Subtraction over addition: No new layers; only typed boundaries

### Deliverables
- Incremental PRs per wave with: contracts.ts, narrow edits, updated tsconfig includes
- CI remains green after each wave

### Acceptance Criteria
- Core still builds and runs compiled CLI
- Service under the current wave compiles with strict on
- No runtime behavior changes; tests/smokes pass

### Milestones
- M1: Hiring Evaluation compiled with strict
- M2: Keyword Analysis compiled with strict
- M3: Vale Linting compiled with strict

### Rollback
- Restore `tsconfig.json` excludes for the service
- Remove the service’s contract file and imports

### Notes for Developers
- Keep PRs small. If typing spreads, stop and split.
- Prefer precise types at boundaries, `unknown` internally, and narrow with guards.


