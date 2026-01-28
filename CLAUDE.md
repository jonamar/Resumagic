# CLAUDE.md

## Project Overview

**Resumagic** — Professional resume and cover letter generator using Node.js + Python microservices.

## Quick Commands

| Task | Command |
|------|---------|
| Generate resume | `node generate-resume.js company-role` |
| New application | `node generate-resume.js --new-app "Company" "Job Title"` |
| Run tests | `npm test` |

## Architecture

- **Node.js:** Document generation (DOCX), CLI, orchestration
- **Python:** Keyword analysis, TF-IDF scoring
- **Ollama:** Hiring evaluation (optional)

## Key Files

| I need to... | Read this |
|--------------|-----------|
| Full context | .windsurf.legacy.bak (old config) |
| Run tests | `npm test` |

## For Agents

- **Workflow guides:** `.windsurf/skills/` (health-check, refactoring, etc.)
- **Cross-platform:** `cat .windsurf/skills/<name>/SKILL.md`
