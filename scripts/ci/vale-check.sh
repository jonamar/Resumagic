#!/bin/bash

# Vale Resume Style Checking
# Runs Vale prose linting on resume files with advisory warnings

# Don't use set -e for advisory warnings - we want to continue even if there are issues
set +e

echo "🔍 Running Vale style checks..."

# Get absolute paths
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
VALE_DIR="$SCRIPT_DIR/../../services/vale-linting"

# Change to Vale directory for configuration
cd "$VALE_DIR"

# Find all resume and cover letter files in applications 
SEARCH_PATH="$PROJECT_ROOT/data/applications"
echo "🔍 Looking for resume and cover letter files in: $SEARCH_PATH"

if [ ! -d "$SEARCH_PATH" ]; then
    echo "⚠️  Applications directory not found: $SEARCH_PATH"
    exit 0
fi

RESUME_FILES=$(find "$SEARCH_PATH" -name "resume.json" 2>/dev/null)
COVER_LETTER_FILES=$(find "$SEARCH_PATH" -name "cover-letter.md" 2>/dev/null)
ALL_FILES="$RESUME_FILES $COVER_LETTER_FILES"

if [ -z "$ALL_FILES" ]; then
    echo "⚠️  No files found to check"
    exit 0
fi

RESUME_COUNT=$(echo "$RESUME_FILES" | wc -l | tr -d ' ')
COVER_COUNT=$(echo "$COVER_LETTER_FILES" | wc -l | tr -d ' ')
echo "📁 Found $RESUME_COUNT resume files and $COVER_COUNT cover letter files to check"

TOTAL_ISSUES=0

for file in $ALL_FILES; do
    echo "Checking: $file"
    
    # Run Vale and capture output
    if output=$(vale "$file" 2>&1); then
        echo "✅ No style issues found"
    else
        echo "$output"
        # Count warnings (advisory level - don't fail build)
        warning_count=$(echo "$output" | grep -c "warning" || true)
        TOTAL_ISSUES=$((TOTAL_ISSUES + warning_count))
    fi
    echo ""
done

echo "📊 Vale Summary: $TOTAL_ISSUES total style warnings found"
if [ $TOTAL_ISSUES -gt 0 ]; then
    echo "💡 These are advisory warnings - build continues"
fi

# Always exit 0 for advisory warnings (don't fail CI)
exit 0