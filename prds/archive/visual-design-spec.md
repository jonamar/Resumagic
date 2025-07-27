# Resume HTML Style Spec (v0.3)

A concise, implementation‑ready guide for an AI agent to generate an **accessible, ATS‑friendly senior‑leadership résumé** in pure HTML.

---

## 1 · Typography (pixel units only)

| Résumé element                                            | CSS selector   | Size (px) | Style / notes                                      |
| --------------------------------------------------------- | -------------- | --------- | -------------------------------------------------- |
| **Name / main header**                                    | `.resume-name` | **22 px** | `font-weight:700; text-transform:capitalize;`      |
| **Section headings**                                      | `h2`           | **16 px** | `font-weight:600; letter-spacing:0.5px;`           |
| **Body text & bullets**                                   | `p, li`        | **10 px** | `line-height:1.25;`                                |
| **Meta text** (contact line, dates, locations, footnotes) | `.meta`        | **10 px** | secondary color `var(--clr-dim)`; same font-family |

**Primary font (sans‑serif, ATS‑friendly)**

* `Arial, sans-serif;`
  Universal availability, clear glyph distinctions: **1 vs l**, **0 vs O**, maximum ATS compatibility.

## 2 · Color & Contrast

| Purpose                   | Token           | Hex       | WCAG Contrast (on #FFF) |
| ------------------------- | --------------- | --------- | ----------------------- |
| Headings                  | `--clr-heading` | `#000000` | 21.0 : 1                |
| Body text & bullets       | `--clr-text`    | `#222222` | 15.3 : 1                |
| *Lightest* secondary text | `--clr-dim`     | `#555555` | 7.3 : 1                 |
| Background                | `--clr-bg`      | `#FFFFFF` | –                       |

## 3 · Layout Guidelines

1. **Page margins:** 0.5 inch on all sides (previously 1 inch).
2. **Max content width:** 750 px (prints cleanly on A4/Letter at 100 %).
3. **Single‑column flow;** avoid tables, columns, or floats—prevents reading‑order issues in ATSs.
4. Semantic landmarks: `<header>`, `<main>`, `<section>` with logical heading order (`<h1>` for name, `<h2>` for top‑level sections).

## 4 · Accessibility Best Practices

* Maintain ≥ 4.5 : 1 contrast for all text (`#222` / `#555` on white pass WCAG AA).
* Keep line‑height ≥ 1.15 for body; provide generous white space between sections.
* **Do not embed text in images**; ensure every character is selectable and in the DOM.
* Test at 200 % browser zoom to verify no clipping or pixelation.
* Test at 200 % browser zoom to verify no clipping or pixelation.

## 5 · ATS Parsing Best Practices

1. Use plain text — no text boxes, columns, or absolute-positioned blocks.
2. Standard section titles (`EXPERIENCE`, `EDUCATION`, `SKILLS`, `PROJECTS`) for higher parser recall.
3. Dates in `MMM-YYYY - MMM-YYYY` format (e.g., `Jan-2022 - Jun-2025`).
4. Export final document as **PDF/A-1a** (embedded fonts, tagged structure) to preserve Unicode text and heading tags.
5. Avoid graphics or icons critical to meaning; all info must exist as text.


**Deliverable expectation for AI agent:** generate an HTML résumé honoring the above pixel-based typographic scale, color tokens, semantic structure, and export guidance. No departures without explicit instruction.
