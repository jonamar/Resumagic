## Resumagic: an agent-friendly, polyglot resume engine that improves callbacks

Active development. This is the big-picture story; deep dives are linked from PRDs and docs.

### Why this exists
- Job hunting is a black box: strong resume, few callbacks. Research into modern ATS workflows revealed harsh filtering and keyword gating; off‑the‑shelf tools were weak (and risky for privacy).
- Job to be done: increase pre‑submit confidence and ATS pass‑through while keeping sensitive data local.
- Core tenets: local‑first privacy, speed, deterministic baselines, boring code. Plus: an AI‑in‑the‑loop writing workflow so I can spend human time on tone, narrative selection, and role‑fit nuance.

### Architecture at a glance (polyglot, by design)
- TypeScript app orchestrates document generation and services; Python powers keyword analysis. One runtime path: compile → run from `dist/`.
- Polyglot rationale: Python for IR/NLP strengths and proven libraries; Node/TS for CLI, orchestration, and local LLM integration.
- I’m a product builder first; many architectural refinements came from trial, tight feedback with LLMs, and applying best practices that proved their worth here.

### Product development approach
- PRD‑driven development: 56 PRDs guided scope, quality gates, and sequencing (`app/prds/`). Small, measurable, and fast to validate.
- Agentic refactor (TypeScript): from failed refactors that added complexity to a “subtraction over abstraction” playbook (`app/docs/agentic-refactoring-guide.md`). Outcomes: flatter services, explicit types at boundaries, faster agent onboarding, fewer failure modes.

### Technical features (high‑level highlights)
- Document pipeline: JSON Resume → compiled TS → ATS‑optimized DOCX; one happy path, fast failure on missing inputs.
- Keyword intelligence: TF‑IDF ranking, semantic grouping, and resume injection checks surface what to add, remove, or reframe.
- Hiring board simulation: six‑persona evaluation with tuned local models; split quality vs speed modes for cost/privacy/performance.
- Polyglot integration: deterministic Python outputs consumed by typed TS orchestrators keeps interfaces clear and reliable.

### UX details that matter
- Vale prose linting (in dev): real‑time style checks produce clean `vale-report.md` in each application’s working folder.
- Keyword checklist: actionable, human‑readable priorities vs the job posting; drives quick, high‑impact edits.
- Hiring board review: fast mode for iteration, quality mode for depth—private by default and tuned for local hardware.

### Process and lessons learned
- What worked: PRDs kept scope tight; a 10s local pipeline made iteration cheap; compile‑only runtime killed flaky branches.
- What didn’t: service wrappers added indirection without value—replaced with direct, typed imports. Early “flexible” designs slowed agents and humans.
- Keep: the five tests—grep, obvious location, 15‑minute human, agent onboarding, rollback.

### Impact snapshot
- Faster iteration (seconds, not minutes), deterministic outputs, and private evaluations increased confidence before applying.
- The keyword checklist and hiring board combined to produce clearer, better‑positioned applications—without sending data to third parties.

### Other jobs to be done
- “Translate this role into my story” (narrative selection), “Pre‑mortem the resume against the posting” (risk surfacing), and “Generate recruiter‑friendly deltas” (change logs that explain improvements).

### Author’s lens
- I operate as an executive‑level product leader and builder. This project reflects an emerging vision for AI‑human collaboration: AI accelerates the mechanical work; humans own judgment, narrative, and taste. The system is engineered to make that split obvious—and fast.


