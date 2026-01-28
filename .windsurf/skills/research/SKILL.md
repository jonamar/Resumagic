---
name: research
description: Guardrails for high-signal research loops. Use when gathering information to support a decision - know when to stop and build a harness instead.
---

# Agentic Research Guide

Reusable guardrails for high-signal research loops with minimal drift, safe tooling practices, and decision-ready outputs.

⸻

## ⚡ Three Non-Negotiables

1. **Decision-first** — Start from the question the research must resolve, not "gather information"
2. **Know when to stop** — If a harness can prove it in 10 minutes, stop researching and start testing
3. **Privacy-first** — Strip PII/IP before sending to external tools; assume they're compromised

⸻

## ⚠️ Stop Researching If...

- **You can test your hypothesis with a harness in <10 minutes** → Build it instead
- **You're gathering "more context" without a specific decision gate** → You're procrastinating
- **You've found 3+ sources saying the same thing** → Confidence threshold met, move on

**When in doubt:** Switch to Operating Guide and build a harness. Testing beats researching.

⸻

## Core Principles

- **Stage realism:** Tailor examples to operating reality (team size, budget, ARR stage). Flag aspirational exemplars.
- **Evidence discipline:** Every claim links to a source (URL + access date + credibility note). Cross-verify critical facts.
- **Leverage per hour:** Time is the scarcest resource. Favor workflows that batch, template, or delegate well.

⸻

## 🔄 The Research Loop

1. **Clarify intent** – Restate the research question, decision gate, and deliverables before exploring.
2. **Audit existing knowledge** – Skim internal docs and prior findings. Only expand scope when you hit a gap.
3. **Map hypotheses** – List candidate explanations or strategies to evaluate.
4. **Plan tool usage** – Choose discovery vs verification tools up front.
5. **Collect evidence** – Gather data in focused bursts, logging sources and quick takeaways.
6. **Synthesize early** – Summarize findings after each burst; update confidence and open questions.
7. **Know when to stop** – If your hypothesis can be validated by running code, switch to the Operating Guide.
8. **Package outputs** – Deliver concise summaries, tables, and appendices.

⸻

## Tooling Playbook

| Goal | Preferred Tools | Notes |
|------|-----------------|-------|
| Landscape scan | `web_search`, FireCrawl | FireCrawl has weak privacy—never send PII |
| Fact verification | Browser MCP | Use for exact metrics, tables. Keep sessions short. |
| Video capture | `r.jina.ai` or transcript panels | Returns plain text for timestamps |
| Document capture | `curl` download → local parsing | Reference page numbers |

**Tool selection heuristics:**
- Start broad with search APIs; only open browser when you need page-level fidelity
- Prefer batch pulls over repeated remote calls
- Keep a running source log (tool, URL, date, credibility)

⸻

## Synthesis Patterns

- **Confidence scoring:** State priors, evidence, and remaining unknowns
- **Comparative tables:** Columns for evidence, resource needs, advantages, risks
- **Narrative capsules:** ≤5 sentences per option, highlighting applicability and disqualifiers
- **Experiment backlogs:** For uncertain paths, define hypothesis, signal, timeline, go/no-go

⸻

## Quality Checklist

- [ ] Decision or question restated at top of working notes
- [ ] Existing internal research reviewed before new searches
- [ ] Tool choices justified (discovery vs verification)
- [ ] Sources logged with URL + date + credibility tag
- [ ] Privacy guardrails respected (no PII/IP to external services)
- [ ] Interim syntheses captured (not just raw links)
- [ ] Final deliverables match project prompt structure

⸻

## Closing

Research is a means to decision, not an end in itself. The goal is to collapse uncertainty fast enough to act.

- If you're still researching after the decision is clear, you're procrastinating.
- If a harness could answer it faster, build the harness.
- More sources ≠ more confidence. Know when to stop.
