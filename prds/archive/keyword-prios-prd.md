Priority‑Score Automation – MVP PRD

1. Purpose / Problem Statement

Hiring‑facing documents (resumes & cover letters) must incorporate job‑specific keywords for ATS matching while preserving Jon’s voice and narrative. Manual prioritisation of 15+ keywords is slow and error‑prone. The goal is to automate priority scoring of keywords so Jon can focus on writing, not data wrangling.

2. Objectives
	1.	Rank a provided keyword list by importance for the target job post.
	2.	Explain why each keyword scored as it did (transparent signals).
	3.	Output a JSON file usable by downstream steps (guard + matcher).
	4.	Run locally in <2 s, zero external API calls.

3. Key Decisions (agreed)

Topic	Decision
Signals	Three only: TF‑IDF weight (0 – 1), Section‑Boost (0, 0.3, 0.6, 0.8, 1.0) and Manual Role Weight (1 / 0.6 / 0.3)
Weights	0.60 TF‑IDF • 0.25 Section‑Boost • 0.15 Role Weight
Keyword schema	Minimal: [ { "kw": "product management", "role": "core" }, { "kw": "strategic planning", "role": "important" }, { "kw": "collaborative leadership", "role": "culture" } ]
Job‑post format	Plain Markdown or TXT after stripping MD/HTML
Section‑Boost rules	Title/first 150 words = 1.0; Requirements/Qualifications sections = 0.8; Responsibilities/Role sections = 0.8; Company/Culture sections = 0.3
TF‑IDF impl	scikit‑learn TfidfVectorizer with fixed vocabulary (keywords), ngram_range=(1,3)
CLI name pattern	python kw_rank.py <keywords.json> <job.md> → kw_rank.json (saved in same directory as keywords.json)

4. MVP Scope
	•	Input parser
‑ accepts keywords.json and job.md|txt paths.
	•	Pre‑processing
‑ lowercase, strip MD, collapse whitespace.
	•	TF‑IDF scoring using agreed config.
	•	Section‑boost extractor applying regex‑based section capture.
	•	Manual role weight lookup.
	•	Final score calculation & sort.
	•	JSON output (ranked list with all sub‑scores + final_score).
	•	Unit test on the attached NiceJob post.

5. Out of Scope (MVP)
	•	Embedding‑based rarity or clustering.
	•	GUI or web service wrapper.
	•	Updating background IDF corpus.

6. User Stories (MVP)
	1.	As Jon I run kw-rank and receive a ranked JSON I can paste into ChatGPT or feed the guard script.
	2.	As a script I can import rank_keywords() and get structured results programmatically.

7. Functional Requirements

ID	Requirement
FR‑1	The tool shall process ≤ 200 keywords & a ≤ 25 kB posting in under 2 seconds on an M4 Mac Mini.
FR‑2	The tool shall output every keyword with sub‑scores tfidf, section, role, and score.
FR‑3	If a keyword is absent from the posting, tfidf = 0 and the final score reflects section=0.
FR‑4	CLI shall exit 1 with an error message if input files missing or invalid JSON.

8. Non‑Functional Requirements
	•	Transparency – code ≤ 100 LOC, no hidden heuristics.
	•	Portability – Python 3.11, only scikit‑learn and markdown‑it‑py.
	•	Determinism – same inputs → same outputs.

9. Data Contract

kw_rank.json = [
  {"kw":"product management","tfidf":0.92,"section":1.0,"role":1,"score":1.00},
  …
]

10. Algorithm Detail
	1.	TF‑IDF
vectorizer = TfidfVectorizer(vocabulary=kw_list, ngram_range=(1,3), stop_words="english")
	2.	Section‑Boost
Regex blocks using patterns:
TITLE = ^.*?(director|vp|vice president|head of|lead|manager).*$ (first line)
REQUIREMENTS = (what you.ll need|what we.re looking for|what you bring|requirements|qualifications|must have|experience|skills)
RESPONSIBILITIES = (what you.ll do|what you.ll be doing|responsibilities|role|opportunity|day to day)
COMPANY = (about|why join|benefits|culture|perks|our mission)
	3.	Role Weight  – constant map: core=1.0, important=0.6, culture=0.3
	4.	Score  = 0.6*tfidf + 0.25*section + 0.15*role.

11. CLI & API

# CLI
python kw_rank.py keywords.json job.md

# Error Handling
- Malformed keywords.json: Exit with error message and usage instructions
- Missing files: Exit with clear file path error
- Invalid JSON: Exit with JSON parsing error details
- Output: kw_rank.json saved in same directory as keywords.json

# Python API (Future)
from kw_rank import rank_keywords
rank_keywords(keywords, job_text) -> List[Dict]

12. Libraries / Dependencies
	•	scikit-learn >= 1.5
	•	markdown-it-py (strip MD)
	•	python-slugify (optional filename sanitising)

13. Risks / Mitigations

Risk	Mitigation
Section regex misses custom headings	Provide env var override or config YAML to add patterns
TF‑IDF skews if posting extremely short	Fallback: frequency count if len(job_text)<150
Keyword appears in plural/synonym	Up to Jon to include desired inflection in JSON.

14. Success Metrics
	•	Setup time < 30 min.
	•	Run time < 2 s.
	•	Jon subjective "useful ranking" ≥ 4/5 in first live test.

# Test Validation (NiceJob Test Case)
	•	All 57 keywords from keywords.json are processed
	•	High priority keywords (priority ≥ 7) score higher than low priority
	•	TF-IDF scores > 0 for keywords found in job posting
	•	Section boost applied correctly (title/requirements get higher scores)
	•	Final scores calculated properly using 0.6*tfidf + 0.25*section + 0.15*role formula
	•	Valid JSON output with all required fields (kw, tfidf, section, role, score)

15. Timeline (Effort: ~3 hrs total)

Hour	Task
1	Scaffold CLI, parse inputs, strip MD
2	Implement TF‑IDF, section boost, role weight, JSON out
3	Unit test on NiceJob posting, README, package into resumagic

16. Open Decisions
	1.	Confirm exact regex patterns for section headings – good as drafted?
	2.	Should plural/lemmatised variants be auto‑added to the vocab?
	3.	Where to store role‑weight defaults (settings.py or inline in keywords.json)?

⸻

Prepared in ChatGPT Canvas – 10 July 2025