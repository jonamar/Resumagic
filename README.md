# Resumagic

Resumagic is a tool for generating ATS-friendly resumes and cover letters in DOCX format from JSON Resume files and Markdown cover letters.

## Project Overview

This tool converts JSON Resume files into clean, professional, ATS-friendly resumes and markdown files into matching cover letters, both in DOCX format. The focus is on creating documents that:

- Are easily parsed by Applicant Tracking Systems (ATS)
- Present your information in a clean, professional format
- Have consistent styling between resumes and cover letters
- Avoid common ATS parsing errors (like complex layouts or decorative elements)
- Support copy/paste friendly content creation for cover letters

## Project Structure

This project uses a two-repo structure to separate code from private data:

### Repository Structure

```
/resumagic/
├── app/                             # Public code repository (this repo)
│   ├── docx-template.js             # DOCX generation templates
│   ├── markdown-to-data.js          # Markdown parser and transformer
│   ├── generate-resume.js           # Resume and cover letter generation script
│   └── ... (other code files)
│
└── data/                            # Private data repository
    ├── input/                       # Resume and cover letter source files
    │   ├── resume.json              # Personal resume data
    │   ├── resume-cover-letter.md   # Cover letter for general applications
    │   ├── pointclick-resume.json   # Specialized resume for specific job
    │   ├── pointclick-cover-letter.md # Cover letter for specific job
    │   └── cover-letter-template.md # Template for creating new cover letters
    └── output/                      # Generated DOCX files
        ├── resume.docx              # Resume-only generation (legacy)
        ├── resume-resume.docx       # Resume (when generating both)
        ├── resume-cover-letter.docx # Cover letter (when generating both)
        ├── pointclick-resume.docx   # Specialized resume
        └── pointclick-cover-letter.docx # Specialized cover letter
```

This structure allows you to:
- Share the code publicly without exposing personal information
- Track changes to your resume and personal data in a separate private repository
- Keep the generation functionality and data separate with clear boundaries

## How to Use

### Prerequisites

- Node.js installed on your system
- Required NPM packages installed (run `npm install` to install them)

### Updating Your Resume

1. Edit the `../data/input/resume.json` file with your personal information
2. Make sure dates are in ISO format (YYYY-MM-DD)
3. Create job-specific versions by copying and customizing your resume.json (e.g., `pointclick-resume.json`)

### Creating Cover Letters

1. Copy the `../data/input/cover-letter-template.md` to create a new cover letter
2. Name it to match your resume file: `[resume-name]-cover-letter.md`
3. Update the YAML front matter with job-specific information:
   ```yaml
   ---
   jobTitle: "Senior Product Manager"
   company: "Tech Corp"
   hiringManager: "Sarah Johnson"
   date: "2024-01-15"
   customClosing: "Best regards"
   referenceSource: "LinkedIn job posting"
   ---
   ```
4. Write your cover letter content using markdown formatting:
   - Use `**bold text**` for emphasis
   - Use `*italic text*` for company names
   - Use `- bullet points` for lists
   - Separate paragraphs with blank lines

### Generating Documents

#### Generate Resume Only (Default)
```bash
node generate-resume.js [input-filename.json]
```

#### Generate Cover Letter Only
```bash
node generate-resume.js [input-filename.json] --cover-letter
```

#### Generate Both Resume and Cover Letter
```bash
node generate-resume.js [input-filename.json] --both
```

#### Auto-Generate (Resume + Cover Letter if markdown file exists)
```bash
node generate-resume.js [input-filename.json] --auto
```

#### Generate Combined Document (Cover Letter + Resume in single file)
```bash
node generate-resume.js [input-filename.json] --combined
```

### Examples

```bash
# Generate resume only (legacy behavior)
node generate-resume.js resume.json
# Output: ../data/output/resume.docx

# Generate both resume and cover letter
node generate-resume.js resume.json --both
# Output: ../data/output/resume-resume.docx
#         ../data/output/resume-cover-letter.docx

# Generate cover letter only
node generate-resume.js pointclick-resume.json --cover-letter
# Output: ../data/output/pointclick-cover-letter.docx

# Auto-detect and generate both if markdown file exists
node generate-resume.js pointclick-resume.json --auto
# Looks for: ../data/input/pointclick-cover-letter.md
# If found: generates both resume and cover letter
# If not found: generates resume only

# Generate combined document (cover letter + resume in single file)
node generate-resume.js relay.json --combined
# Output: ../data/output/relay-combined.docx
# Contains: Cover letter on page 1, resume starting on page 2
```

### Customizing Your Documents

To change how your resume and cover letters look:

1. Edit the `theme.js` file to modify:
   - Colors and fonts
   - Font sizes and spacing
   - Section titles and formatting
2. Edit the `docx-template.js` file for advanced layout changes
3. Run the generation script again to see your changes

## Features

### Resume Features
- **ATS-Friendly**: Uses standard fonts and proper document structure
- **Single-Column Layout**: Ensures proper parsing by ATS systems
- **Clean Typography**: Optimized for both screen and print
- **Proper Spacing**: Professional margins and section spacing
- **ISO Date Formatting**: Correctly handles dates in the standard format

### Cover Letter Features
- **Copy/Paste Friendly**: Markdown format handles line breaks naturally
- **YAML Front Matter**: Structured metadata for job-specific information
- **Consistent Styling**: Matches resume formatting exactly
- **Reuses Contact Info**: Automatically pulls your contact details from resume JSON
- **Markdown Formatting**: Support for bold, italic, and bullet points
- **Pipeline Reuse**: Inherits all ATS optimizations from resume system

### System Features
- **Dual Output**: Generate both resume and cover letter in one command
- **Auto-Detection**: Automatically finds and processes matching files
- **Backward Compatible**: Existing resume-only workflows unchanged
- **Professional Quality**: Same high-quality output for both documents

## Technical Details

The tool uses:
- **docx library** for DOCX generation with full formatting control
- **gray-matter** for parsing YAML front matter in markdown files
- **marked** for markdown to structured data conversion
- **JSON Resume schema** for resume data structure
- **Shared pipeline** for consistent styling and ATS optimization

## Tips for ATS Optimization

### General Tips
- Keep all dates in ISO format (YYYY-MM-DD)
- Use standard section names like "Experience," "Education," etc.
- Include keywords from job descriptions in your content
- Use standard fonts and avoid decorative elements
- Test your final DOCX files with ATS scanners if possible

### Cover Letter Tips
- Use the company name and job title from the job posting exactly
- Include 2-3 key achievements with specific metrics
- Keep paragraphs focused and scannable
- Use bullet points for lists of skills or accomplishments
- Customize the content for each application while keeping the same professional format
