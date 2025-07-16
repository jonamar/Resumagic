# Resumagic

Resumagic is a comprehensive tool for generating ATS-friendly resumes and cover letters in DOCX format from JSON Resume files and Markdown cover letters, with intelligent keyword analysis.

## Architecture Overview

This application follows a clean microservice architecture with language-specific boundaries:

```
app/
├── 📄 Node.js Application (Document Generation)
│   ├── generate-resume.js       # Main entry point
│   ├── cli-parser.js           # Command line argument parsing
│   ├── path-resolver.js        # File path resolution
│   ├── document-orchestrator.js # Document generation coordination
│   ├── docx-template.js        # DOCX document creation
│   ├── markdown-to-data.js     # Markdown parsing
│   └── theme.js                # Styling and configuration
│
└── 🐍 Python Services (Analysis & Intelligence)
    └── services/keyword-analysis/   # Keyword analysis microservice
        ├── kw_rank/                 # Modular Python package
        │   ├── core/                # Core analysis modules
        │   ├── io/                  # Input/Output modules
        │   └── main.py              # Service orchestration
        ├── config/                  # Configuration management
        ├── kw_rank_modular.py      # Modern entry point
        └── requirements.txt         # Python dependencies
```

## Recent Improvements (2024)

### ✨ Clean Architecture & Language Separation
- **Clear Service Boundaries**: Node.js handles document generation, Python handles analysis
- **Technology Focused**: Each service uses the most appropriate technology stack
- **Independent Development**: Services can evolve separately
- **No Mixed Dependencies**: Separate package managers and tooling

### 🎯 Node.js Application Improvements  
- **Modular Architecture**: Clean separation of concerns across focused modules
- **Eliminated 300+ lines of duplicated code** through generic section generation
- **Centralized configuration** in `theme.js` with comprehensive spacing constants
- **Enhanced error handling** with user-friendly messages
- **Better testability** through modular design

### 🔧 Python Service Architecture
- **Comprehensive Refactoring**: Transformed 1,248-line monolith into clean modular architecture
- **Single Responsibility**: Each module has one clear purpose (<300 lines each)
- **Configuration Management**: All constants centralized with proper validation
- **Advanced Features**: Semantic clustering, knockout detection, resume injection points

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
    ├── applications/                # NEW: Application-specific folders
    │   ├── relay-director-of-product/
    │   │   ├── inputs/
    │   │   │   ├── resume.json      # Job-specific resume data
    │   │   │   └── cover-letter.md  # Job-specific cover letter
    │   │   └── outputs/
    │   │       ├── Jon-Amar-Resume-Relay.docx
    │   │       ├── Jon-Amar-Cover-Letter-Relay.docx
    │   │       └── Jon-Amar-Cover-Letter-and-Resume-Relay.docx
    │   │
    │   ├── openai-product-manager/
    │   │   ├── inputs/
    │   │   │   ├── resume.json
    │   │   │   └── cover-letter.md
    │   │   └── outputs/
    │   │       └── ... (HR-friendly named files)
    │   │
    │   └── template/                # Template for new applications
    │       ├── inputs/
    │       │   ├── resume.json      # Template resume
    │       │   └── cover-letter.md  # Template cover letter
    │       └── README.md            # Usage instructions
    │
    ├── input/                       # LEGACY: Original flat structure
    │   ├── resume.json              # Personal resume data
    │   ├── resume-cover-letter.md   # Cover letter for general applications
    │   ├── pointclick-resume.json   # Specialized resume for specific job
    │   └── ... (other legacy files)
    │
    └── output/                      # LEGACY: Original output folder
        ├── resume.docx              # Resume-only generation (legacy)
        ├── resume-resume.docx       # Resume (when generating both)
        └── ... (other legacy files)
```

This structure allows you to:
- Share the code publicly without exposing personal information
- Track changes to your resume and personal data in a separate private repository
- Keep the generation functionality and data separate with clear boundaries

## New vs Legacy Structure

### New Application Folder Structure (Recommended)

**Benefits:**
- **HR-Friendly**: Files named `Jon-Amar-Resume-Company.docx` for easy identification
- **Organized**: Each application has its own folder with inputs and outputs
- **Professional**: Clean file naming that looks professional to HR departments
- **Scalable**: Easy to manage many applications without file name conflicts
- **Template-Based**: Quick setup for new applications using template folder

**Best For:**
- New job applications
- Professional submissions to HR departments
- Managing multiple applications simultaneously
- Long-term organization and tracking
- Maximum flexibility (default generates all formats so you can grab what you need)

### Legacy File Structure (Still Supported)

**Benefits:**
- **Backward Compatible**: Existing workflows continue to work
- **Simple**: Direct file-based approach
- **Quick**: No folder setup required

**Best For:**
- Existing workflows that you don't want to change
- Quick one-off resume generation
- Testing and development

## How to Use

### Prerequisites

- Node.js installed on your system
- Required NPM packages installed (run `npm install` to install them)
- Python 3.11+ and virtual environment for keyword ranking tool
- Python dependencies: `pip install -r requirements.txt`

## Intelligent Keyword Analysis Tool

Resumagic includes a Python-based keyword analysis tool that analyzes job postings, ranks keywords by importance using TF-IDF scoring, and intelligently categorizes them into knockout requirements vs. skills for optimal resume targeting.

### Setup

```bash
# Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### Usage

#### Basic Usage
```bash
python kw_rank.py keywords.json job_posting.md
```

#### Enhanced Top-N Selection
```bash
python kw_rank.py keywords.json job_posting.md --top 5
```

#### Available Options
- `--drop-buzz`: Drop buzzwords entirely instead of penalizing (default: penalize)
- `--cluster-thresh 0.25`: Clustering threshold for alias detection (default: 0.25)
- `--top 5`: Number of top keywords to output (default: 5)
- `--summary`: Show dual analysis with knockout requirements and top skills breakdown

#### Output Files
- `keyword_analysis.json`: Canonical keyword data with knockout requirements, ranked skills, scoring, and aliases
- `keyword-checklist.md`: Manual checklist for keyword injection during resume optimization

### Enhanced Features

#### 1. Buzzword Dampening
Generic PM buzzwords are automatically detected and penalized (0.7x score) or dropped entirely:
- vision, strategy, roadmap, delivery, execution, discovery, innovation
- data-driven, metrics, scalable, alignment, stakeholders, collaboration
- agile, prioritization, user-centric, outcomes, cross-functional, etc.

#### 2. Alias Clustering
Similar keywords are clustered using semantic embeddings (SentenceTransformer):
- "leading Product Managers" clusters with "managing Product Managers"
- "home services industry" clusters with "home service businesses"
- "b2b" clusters with "b2b2c"

#### 3. Median-Based Trimming
Keywords below 1.2x median score are filtered out, ensuring only high-signal terms remain.

#### 4. Top-N Selection
Clean shortlist of the highest-scoring canonical keywords with their aliases.

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

#### New Application Folder Structure (Recommended)

For new applications, use the application folder structure for better organization:

```bash
# Create a new application from template
cp -r data/applications/template data/applications/company-role-name

# Generate all three formats (DEFAULT - when both resume and cover letter content are available)
node generate-resume.js company-role-name
# Output: data/applications/company-role-name/outputs/Jon-Amar-Resume-Company.docx
#         data/applications/company-role-name/outputs/Jon-Amar-Cover-Letter-Company.docx
#         data/applications/company-role-name/outputs/Jon-Amar-Cover-Letter-and-Resume-Company.docx

# Generate specific formats only
node generate-resume.js company-role-name --cover-letter
# Output: data/applications/company-role-name/outputs/Jon-Amar-Cover-Letter-Company.docx

node generate-resume.js company-role-name --both
# Output: data/applications/company-role-name/outputs/Jon-Amar-Resume-Company.docx
#         data/applications/company-role-name/outputs/Jon-Amar-Cover-Letter-Company.docx

node generate-resume.js company-role-name --cover-letter-and-resume
# Output: data/applications/company-role-name/outputs/Jon-Amar-Cover-Letter-and-Resume-Company.docx

# Auto-generate (resume + cover letter if markdown file exists)
node generate-resume.js company-role-name --auto
```

#### Legacy File Structure (Still Supported)

For backward compatibility, the old file-based structure still works:

```bash
# Generate resume only (legacy behavior)
node generate-resume.js [input-filename.json]
# Output: ../data/output/filename.docx

# Generate cover letter only
node generate-resume.js [input-filename.json] --cover-letter
# Output: ../data/output/filename-cover-letter.docx

# Generate both resume and cover letter
node generate-resume.js [input-filename.json] --both
# Output: ../data/output/filename-resume.docx
#         ../data/output/filename-cover-letter.docx

# Generate combined document
node generate-resume.js [input-filename.json] --cover-letter-and-resume
# Output: ../data/output/filename-cover-letter-and-resume.docx

# Auto-generate
node generate-resume.js [input-filename.json] --auto
```

### Examples

#### New Application Folder Examples

```bash
# Create application for Relay Director of Product role
cp -r data/applications/template data/applications/relay-director-of-product

# Edit the input files:
# - data/applications/relay-director-of-product/inputs/resume.json
# - data/applications/relay-director-of-product/inputs/cover-letter.md

# Generate all three formats (DEFAULT behavior)
node generate-resume.js relay-director-of-product
# Output: data/applications/relay-director-of-product/outputs/Jon-Amar-Resume-Relay.docx
#         data/applications/relay-director-of-product/outputs/Jon-Amar-Cover-Letter-Relay.docx
#         data/applications/relay-director-of-product/outputs/Jon-Amar-Cover-Letter-and-Resume-Relay.docx

# Now you have all three formats ready for any submission scenario!
# - Use Jon-Amar-Resume-Relay.docx for resume-only applications
# - Use Jon-Amar-Cover-Letter-Relay.docx for cover letter-only requests
# - Use Jon-Amar-Cover-Letter-and-Resume-Relay.docx for complete application packages
```

#### Legacy Structure Examples

```bash
# Generate resume only (legacy behavior)
node generate-resume.js resume.json
# Output: ../data/output/resume.docx

# Generate both resume and cover letter
node generate-resume.js resume.json --both
# Output: ../data/output/resume-resume.docx
#         ../data/output/resume-cover-letter.docx

# Generate combined document
node generate-resume.js relay.json --cover-letter-and-resume
# Output: ../data/output/relay-cover-letter-and-resume.docx
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
- **HR-Friendly Naming**: Files named for easy identification (Jon-Amar-Resume-Company.docx)
- **Organized Structure**: Application-specific folders keep everything organized
- **Template System**: Easy setup for new applications using template folder

## Technical Details

### Architecture Overview

The application follows a modular architecture with clear separation of concerns:

```
app/
├── generate-resume.js           # Main entry point (73 lines)
├── cli-parser.js               # CLI argument parsing and validation
├── path-resolver.js            # File path resolution and validation
├── document-orchestrator.js    # Document generation coordination
├── docx-template.js            # DOCX formatting and layout
├── markdown-to-data.js         # Markdown parsing and processing
└── theme.js                   # Centralized configuration and styling
```

### Key Components

- **CLI Parser**: Handles all command-line argument processing, flag detection, and generation plan determination
- **Path Resolver**: Manages file system operations, path validation, and company name extraction
- **Document Orchestrator**: Coordinates resume and cover letter generation, manages file operations
- **DOCX Template**: Provides document formatting using generic section generation functions
- **Theme Configuration**: Centralized styling with precise spacing control (all values in twips)

### Code Architecture Benefits

- **Maintainability**: Each module has a single responsibility
- **Testability**: Isolated functions can be tested independently
- **Scalability**: Easy to add new features without affecting existing code
- **Configuration Management**: All styling and spacing centralized in one place
- **Error Handling**: User-friendly error messages with clear guidance

The tool uses:
- **docx library** for DOCX generation with full formatting control
- **gray-matter** for parsing YAML front matter in markdown files
- **marked** for markdown to structured data conversion
- **JSON Resume schema** for resume data structure
- **Shared pipeline** for consistent styling and ATS optimization
- **Modular architecture** for maintainable and testable code

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
