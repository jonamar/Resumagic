## CLI Utility PRD: Dash Normalizer

### Problem
Inconsistent usage of dashes (en – and em —, sometimes with spaces) in application content leads to formatting drift and manual cleanup. We need a simple, safe way to standardize to em dashes with no surrounding spaces without touching legitimate hyphens in words (e.g., `women-of-color`).

### Goals
- Normalize all en/em dashes (with or without surrounding spaces) to a single em dash `—` with no spaces.
- Avoid modifying standard hyphens `-` used inside words or numeric ranges.
- Provide a fast, boring CLI experience that integrates with the existing app CLI.

### Non-Goals
- No runtime fallback paths or editing behavior in the document generation flow.
- No interactive prompts; fail fast with clear messages.

### Users / UX
- **Primary user**: author maintaining content in `/data/applications/*/inputs/*` and canonical docs.
- **DX**: single command, explicit include paths, dry-run default to preview changes, and an apply flag to write updates.

### Proposed CLI
- Command: `node dist/cli/normalize-dashes.js [--path <glob>] [--apply] [--ext <list>] [--include-em-only]`
  - `--path` (required): glob(s) for files, e.g., `data/applications/**/inputs/*.{md,json}`
  - `--apply` (optional): write changes to disk; omitted → dry run showing a unified diff summary + counts
  - `--ext` (optional): comma-separated extensions to include (default: `md,json,txt`)
  - `--include-em-only` (optional): if set, also normalize spaced em dashes to tight em dashes

### Core Logic (Regex Spec)
- Find pattern (with lookbehind support):
  - `(?<=\S)\s*[\u2013\u2014]\s*(?=\S)`
- Fallback (no lookbehind):
  - Find: `([^\s])\s*[\u2013\u2014]\s*([^\s])`
  - Replace: `$1—$2`
- Behavior:
  - Matches en or em dashes with/without surrounding spaces between non-space characters
  - Leaves standard hyphens `-` untouched (e.g., `women-of-color`)

### Scope
- Include: `.md`, `.json`, `.txt` in content directories under `/data/` and any docs under `/app/docs/`.
- Exclude: compiled output (`/app/dist`), archives (`**/test-archive/**`), binary files.

### Output
- Dry run: per-file counts (replacements, lines changed) and summary total.
- Apply: in-place edits; optional `--write-backup` could be added later if needed.

### Acceptance Criteria
- Running in dry run mode shows at least the same count as VSCode find for the same regex.
- Hyphenated words remain unchanged across a representative sample (unit test cases included).
- Spaced em dashes (e.g., `word — word`) become `word—word`.
- En dashes (e.g., `word–word` and `word – word`) become `word—word`.

### Tests
- Unit tests for regex transform cases:
  - `alpha – beta` → `alpha—beta`
  - `alpha–beta` → `alpha—beta`
  - `alpha — beta` → `alpha—beta`
  - `women-of-color` (unchanged)
  - `R&D—focused` (unchanged aside from spacing normalization if present)

### Risks / Mitigations
- Risk: Over-matching around punctuation. Mitigate with non-space boundaries and test cases.
- Risk: Editor encodings. Use UTF-8 only; validate on read.

### Rollout
- Add script under `app/cli/normalize-dashes.ts`, compile with `npx tsc`, run via `node dist/cli/normalize-dashes.js`.
- Optional npm script alias: `npm run normalize:dashes -- --path "data/**/inputs/*.{md,json}"`.

### Impact
- **UX**: Consistent typography and fewer manual edits.
- **DX**: One-command cleanup; reduces review noise and improves diffs.



