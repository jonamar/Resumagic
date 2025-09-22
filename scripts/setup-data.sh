#!/usr/bin/env bash
set -euo pipefail

# Non-destructive scaffolding for the sibling data repo
# Creates ../data with minimal structure and safe placeholder content if missing

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
DATA_DIR="$ROOT_DIR/../data"

echo "📁 Ensuring data directory structure at: $DATA_DIR"
mkdir -p "$DATA_DIR/applications/template/inputs" \
         "$DATA_DIR/applications/template/outputs" \
         "$DATA_DIR/applications/template/working" \
         "$DATA_DIR/canonical/inputs" \
         "$DATA_DIR/canonical/outputs" \
         "$DATA_DIR/canonical/working"

# Safe placeholder resume.json
if [ ! -f "$DATA_DIR/canonical/inputs/resume.json" ]; then
  cat > "$DATA_DIR/canonical/inputs/resume.json" <<'JSON'
{
  "basics": {
    "name": "Candidate Name",
    "label": "Role or Title",
    "email": "candidate@example.com",
    "phone": "(555) 555-5555",
    "pronouns": "",
    "location": { "city": "", "region": "", "country": "" }
  },
  "work": [],
  "education": [],
  "skills": []
}
JSON
  echo "✅ Wrote placeholder canonical resume.json"
fi

# Template cover-letter.md
if [ ! -f "$DATA_DIR/applications/template/inputs/cover-letter.md" ]; then
  cat > "$DATA_DIR/applications/template/inputs/cover-letter.md" <<'MD'
---
pronouns: ""
---

Dear Hiring Manager,

This is a starter cover letter. Replace with your content.

Sincerely,
Candidate Name
MD
  echo "✅ Wrote template cover-letter.md"
fi

# Template keywords.json
if [ ! -f "$DATA_DIR/applications/template/inputs/keywords.json" ]; then
  echo "[]" > "$DATA_DIR/applications/template/inputs/keywords.json"
  echo "✅ Wrote template keywords.json"
fi

# README note to keep data private
if [ ! -f "$DATA_DIR/README.md" ]; then
  cat > "$DATA_DIR/README.md" <<'MD'
# Resumagic Data Repository (Private)

This directory is intended to be a separate, private git repository that stores your personal resume/cover letter data and generated outputs. Do not publish this repo.

Structure:

- applications/<app>/inputs/{resume.json, cover-letter.md, keywords.json}
- applications/<app>/working/
- applications/<app>/outputs/

To create a new application: copy `applications/template` to your app name.
MD
  echo "✅ Wrote data README"
fi

echo "🎉 Data scaffolding complete."

