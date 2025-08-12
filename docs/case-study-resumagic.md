## Resumagic: turning a black‑box job hunt into a private, deterministic pipeline

Active development. Big‑picture story, exec‑readable.

One‑liner
- An exec‑level, privacy‑first workflow that simulates a hiring review board, optimizes for ATS, and lets AI handle mechanics while I own narrative and judgment.

Who this is for
- Early adopters: executive tech candidates who want a faster, more confident, private process.

Pull quote
- “Treat the job hunt like a product: make feedback loops fast, decisions explainable, and privacy non‑negotiable.”

Core product principles
- Human‑led, AI‑accelerated: automation for repetition; humans for taste and tradeoffs.
- Clarity with explainability: decisions are obvious; feedback points to specific edits and why.
- Privacy by default: sensitive materials stay local.
- Fast loops: small iterations, immediate feedback, measurable gains.


### A) Product lens

#### Features and value
1) ATS‑optimized resumes
- What it is: A document pipeline and content strategy tuned to how modern ATS systems parse, index, and filter.
- Why it matters: DOCX remains the most consistently legible for ATS. I researched product docs and recruiter workflows to avoid hidden deal‑breakers (fonts, tables, headers/footers, images, tracking).
- Result: Cleaner parsing, more consistent pass‑through, and fewer format‑caused misses.

2) Automated keyword extraction (so humans can be strategic)
- What it is: TF‑IDF scoring, semantic grouping, and resume‑injection checks that produce an actionable checklist.
- Why it matters: Let the system do repetitive scanning; spend human time on the story—what to emphasize, what to cut, how to align with the role.
- Result: Faster iterations with leverage, not busywork.

3) Simulated hiring review board
- What it is: Six calibrated personas (HR, Technical, Design, Finance, CEO, Team) reviewing your actual materials for a specific job.
- Why it matters: Hone based on realistic, multi‑angle feedback before it’s too late; reveal blind spots; get a credible gut‑check.
- How it runs: Fast mode for quick passes; quality mode with a beefier local model for the last 10% of insight. Calibrated via baselines and prompt/model tuning for constructive, non‑noisy variance.
- My lens: I’ve sat on 42 real hiring review boards (often as the hiring manager). The personas were crafted to mirror real dynamics—seniority, org perspective, and temperament.

#### The hiring review board (why this matters)
The core idea is simple and powerful: simulate how real decision‑makers would read your resume for a specific role—before you apply. I built six distinct personas (HR, Technical, Design, Finance, CEO, Team), each crafted to represent seniority, org position, and temperament. The goal wasn’t “AI magic”; it was pragmatic calibration for useful, constructive feedback.

How I made it reliable
- Baselines: Started with three “stock” personas to ensure a healthy spread of feedback. Then established a high‑quality external baseline (bleeding‑edge AI) for comparison.
- Tuning: Iteratively refined prompts and local model configs until scores landed within ~10% of the baseline, then adjusted temperature to produce realistic variance across reviews (not identical takes, not chaos).
- Outcomes: A balanced mix of strengths/risks surfaced quickly, making pre‑submit improvements obvious and actionable.

#### Impact snapshot
Faster iteration (seconds, not minutes), deterministic outputs, and private evaluations increased confidence before applying. The keyword checklist and hiring board combined to produce clearer, better‑positioned applications—without sending data to third parties.

#### Product development approach
- PRD‑driven development: 56 PRDs guided scope, quality gates, and sequencing (`app/prds/`). Small, measurable, and fast to validate.
- Agentic refactor (TypeScript): after early refactors added complexity without maintainability, I codified a subtraction playbook (`app/docs/agentic-refactoring-guide.md`). Wins: flatter services, explicit types at boundaries, faster agent onboarding, fewer failure modes.

### UX details that matter
- Vale prose linting (in dev): real‑time style checks produce clean `vale-report.md` in each application’s working folder.
- Keyword checklist: actionable, human‑readable priorities vs the job posting; drives quick, high‑impact edits.
- Hiring board review: fast mode for iteration, quality mode for depth—private by default and tuned for local hardware.

### Process and lessons learned
What worked: PRDs kept scope tight; a ~10s local pipeline made iteration cheap; a compile‑only runtime killed flaky branches. What didn’t: wrapper abstractions added indirection without value—direct, typed imports were better. Early “flexible” designs slowed both agents and humans. The five tests (grep, obvious location, 15‑minute human, agent onboarding, rollback) became the operating system for change.

### B) Tech lens (how it stays fast, private, reliable)
Technical tenets
- Single happy path: compile → run; fail fast if inputs are wrong.
- Pragmatic polyglot: Python for IR/NLP; TypeScript for orchestration.
- Subtraction over abstraction: fewer moving parts, more reliability.

Architecture at a glance
Resumagic is intentionally simple: TypeScript orchestrates the pipeline and document generation; Python powers keyword analysis. A single runtime path—compile → run from `dist/`—keeps failures obvious and the system legible to both humans and AI. Clear, typed boundaries unify the developer experience.


Tech footnote (for the curious)
- Python for IR/NLP and deterministic outputs; TypeScript for orchestration and local LLM integration. A single compile→run path reduces failure modes and speeds iteration. The tech is a means to a product end: better decisions, faster, in private.

Active development
- Near‑term: finish Vale report integration in the workflow.
- Medium‑term: UI atop the proven pipeline; persona libraries by industry/seniority; expanded keyword dictionaries and semantics.


