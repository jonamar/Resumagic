## Resumagic: turning a black‑box job hunt into a private, deterministic pipeline

Active development. This is the big‑picture story; deep dives live in PRDs and docs.

I approached the job hunt like a product problem. Using market research, testing, and a data‑driven mindset, I turned an opaque process into an efficient pipeline where AI accelerates the mechanics—and I, as a product leader, own narrative and judgment. The result is local‑first, fast, and predictable: a workflow designed to increase pre‑submit confidence and ATS pass‑through without sending sensitive data to third parties.

Core tenets
- Local‑first privacy
- Speed and deterministic baselines
- Subtraction over abstraction (boring, legible code)
- AI‑in‑the‑loop writing so human time goes to tone, narrative selection, and role‑fit nuance

### Architecture at a glance
Resumagic is intentionally simple and pragmatic. TypeScript orchestrates the pipeline and document generation; Python powers keyword analysis. There’s a single runtime path—compile → run from `dist/`—which keeps failures obvious and the system legible to both humans and AI. The polyglot split uses the right language for the right job (Python for IR/NLP; TS for CLI/orchestration and local LLM work), but the developer experience stays unified through clear, typed boundaries.

### Product development approach
- PRD‑driven development: 56 PRDs guided scope, quality gates, and sequencing (`app/prds/`). Small, measurable, and fast to validate.
- Agentic refactor (TypeScript): after early refactors added complexity without maintainability, I codified a subtraction playbook (`app/docs/agentic-refactoring-guide.md`). Wins: flatter services, explicit types at boundaries, faster agent onboarding, fewer failure modes.

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
What worked: PRDs kept scope tight; a ~10s local pipeline made iteration cheap; a compile‑only runtime killed flaky branches. What didn’t: wrapper abstractions added indirection without value—direct, typed imports were better. Early “flexible” designs slowed both agents and humans. The five tests (grep, obvious location, 15‑minute human, agent onboarding, rollback) became the operating system for change.

### Impact snapshot
Faster iteration (seconds, not minutes), deterministic outputs, and private evaluations increased confidence before applying. The keyword checklist and hiring board combined to produce clearer, better‑positioned applications—without sending data to third parties.

### Other jobs to be done
“Translate this role into my story” (narrative selection), “Pre‑mortem the resume against the posting” (risk surfacing), and “Generate recruiter‑friendly deltas” (change logs that explain improvements).

### Author’s lens
I operate as an executive‑level product leader and builder, and an emerging visionary in AI‑human collaboration. Here, AI accelerates the mechanical work so humans can own judgment, narrative, and taste. The system makes that split obvious—and fast.


