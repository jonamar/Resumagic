# Resumagic

Professional resume and cover letter generator with intelligent keyword analysis for ATS optimization.

## ⚡ Quick Start

```bash
# 1. Install dependencies
npm install
pip install -r services/keyword-analysis/requirements.txt

# 2. Create new application
cp -r ../data/applications/template ../data/applications/company-role

# 3. Edit input files
# ../data/applications/company-role/inputs/resume.json
# ../data/applications/company-role/inputs/cover-letter.md  
# ../data/applications/company-role/inputs/keywords.json

# 4. Generate documents
node generate-resume.js company-role

# 5. Run keyword analysis
python services/keyword-analysis/kw_rank_modular.py company-role
```

**Output**: Professional DOCX files + intelligent keyword optimization checklist

## What This Tool Does

**Document Generation**: Converts JSON Resume + Markdown → Professional DOCX files
**Keyword Analysis**: Analyzes job postings → Categorizes keywords → Optimization checklist
**ATS Optimization**: Ensures documents are easily parsed by applicant tracking systems

## Architecture Overview

**🔧 Clean Microservice Design**
- **Node.js**: Document generation (DOCX creation, markdown parsing)
- **Python**: Intelligent analysis (keyword scoring, semantic clustering)
- **Separation**: Each service uses optimal technology stack
- **Testing**: 85%+ coverage with comprehensive test suites

## Project Structure

This project uses a two-repo structure to separate code from private data:

### Repository Structure

```
/resumagic/
├── app/                             # Public code repository (this repo)
│   ├── docs/                        # Documentation
│   │   └── cover-letter-schema.md   # Cover letter JSON schema
│   ├── services/                    # Microservices
│   │   └── keyword-analysis/        # Python keyword analysis service
│   │       ├── kw_rank/             # Modular Python package
│   │       │   ├── core/            # Core analysis modules
│   │       │   └── io/              # Input/output modules
│   │       ├── config/              # Configuration management
│   │       ├── tests/               # Comprehensive test suite
│   │       ├── API.md               # API documentation
│   │       ├── SETUP.md             # Setup guide
│   │       └── kw_rank_modular.py   # Modern entry point
│   ├── generate-resume.js           # Resume/cover letter generation
│   ├── docx-template.js             # DOCX generation templates
│   ├── markdown-to-data.js          # Markdown parser and transformer
│   └── ... (other core files)
│
└── data/                            # Private data repository
    ├── applications/                # Application-specific folders
    │   ├── relay-director-of-product/
    │   │   ├── inputs/
    │   │   │   ├── resume.json      # Job-specific resume data
    │   │   │   ├── cover-letter.md  # Job-specific cover letter
    │   │   │   └── keywords.json    # Keywords for analysis
    │   │   ├── working/             # Process utilities & analysis
    │   │   │   ├── keyword_analysis.json
    │   │   │   ├── keyword-checklist.md
    │   │   │   └── top5.json
    │   │   └── outputs/
    │   │       ├── Jon-Amar-Resume-Relay.docx
    │   │       ├── Jon-Amar-Cover-Letter-Relay.docx
    │   │       └── Jon-Amar-Cover-Letter-and-Resume-Relay.docx
    │   │
    │   └── template/                # Template for new applications
    │       ├── inputs/
    │       │   ├── resume.json      # Template resume
    │       │   ├── cover-letter.md  # Template cover letter
    │       │   └── keywords.json    # Template keywords
    │       └── README.md            # Usage instructions
    │
    └── templates/                   # Reusable content templates
        └── tiles.json               # Content tiles for resume generation
```

This structure allows you to:
- Share the code publicly without exposing personal information
- Track changes to your resume and personal data in a separate private repository
- Keep the generation functionality and data separate with clear boundaries

## Application Folder Structure

**Required Structure:**
Each application must follow this 3-tier folder structure:

```
{company-role}/
├── inputs/                 # Source materials (required)
│   ├── resume.json        # Structured resume data
│   ├── cover-letter.md    # Markdown cover letter content
│   └── keywords.json      # Keywords for analysis
├── working/               # Process utilities (auto-generated)
│   ├── keyword_analysis.json
│   ├── keyword-checklist.md
│   └── top5.json
└── outputs/               # Generated deliverables (auto-generated)
    ├── Jon-Amar-Resume-{Company}.docx
    ├── Jon-Amar-Cover-Letter-{Company}.docx
    └── Jon-Amar-Combined-{Company}.docx
```

**Benefits:**
- **HR-Friendly**: Files named `Jon-Amar-Resume-Company.docx` for easy identification
- **Organized**: Each application has its own folder with inputs and outputs
- **Professional**: Clean file naming that looks professional to HR departments
- **Scalable**: Easy to manage many applications without file name conflicts
- **Template-Based**: Quick setup for new applications using template folder

**Best For:**
- All job applications and workflows
- Professional submissions to HR departments
- Managing multiple applications simultaneously
- Long-term organization and tracking
- Integration with other tools and services

## Prerequisites

- **Node.js** (for document generation)
- **Python 3.8+** (for keyword analysis)
- **Virtual environment recommended**

## Core Features

### 📄 Document Generation
- **Resume + Cover Letter**: Generate both from structured data
- **ATS-Friendly**: Optimized for applicant tracking systems
- **Professional Styling**: Clean, consistent formatting
- **Multiple Formats**: Separate files or combined document

### 🧠 Intelligent Keyword Analysis
- **Smart Categorization**: Separates knockout requirements from skills
- **TF-IDF Scoring**: Prioritizes keywords by job posting frequency
- **Semantic Clustering**: Groups similar keywords with aliases
- **Resume Injection**: Analyzes existing content for optimization points

### 🔧 Advanced Features
- **Buzzword Detection**: Penalizes generic terms, boosts authentic vocabulary
- **Alias Clustering**: "Product Manager" + "Product Lead" → one optimized term
- **Comprehensive Testing**: 85%+ test coverage with unit + integration tests
- **Modular Architecture**: Clean separation of concerns

## Usage Examples

### Document Generation

```bash
# Generate all formats (recommended)
node generate-resume.js company-role

# Generate specific formats
node generate-resume.js company-role --cover-letter
node generate-resume.js company-role --both
node generate-resume.js company-role --combined
```

### Keyword Analysis

```bash
# Run analysis
python services/keyword-analysis/kw_rank_modular.py company-role

# Run tests
cd services/keyword-analysis && python run_tests.py --coverage
```

### File Structure

```
company-role/
├── inputs/
│   ├── resume.json          # Your resume data
│   ├── cover-letter.md      # Cover letter content
│   └── keywords.json        # Keywords to analyze
├── working/
│   ├── keyword_analysis.json    # Detailed analysis
│   ├── keyword-checklist.md     # Optimization checklist
│   └── top5.json               # Top skills
└── outputs/
    ├── Jon-Amar-Resume-Company.docx
    ├── Jon-Amar-Cover-Letter-Company.docx
    └── Jon-Amar-Combined-Company.docx
```

## Troubleshooting

### Common Issues

**Command not found**: Ensure you're in the correct directory and dependencies are installed
**Python import errors**: Check virtual environment activation and requirements.txt
**File not found**: Verify application folder structure and input files exist
**DOCX generation fails**: Check resume.json format and required fields

### Testing

```bash
# Test document generation
node generate-resume.js relay-director-of-product

# Test keyword analysis
python services/keyword-analysis/kw_rank_modular.py relay-director-of-product

# Run full test suite
cd services/keyword-analysis && python run_tests.py --coverage
```

### Documentation

- **Architecture Overview**: `docs/architecture-overview.md` - Complete system architecture and integration guide
- **API Reference**: `services/keyword-analysis/API.md`
- **Setup Guide**: `services/keyword-analysis/SETUP.md`
- **Cover Letter Schema**: `docs/cover-letter-schema.md`

## Technical Architecture

See `docs/architecture-overview.md` for complete system architecture, service boundaries, and integration guidance.

---

## Appendix

### ATS Optimization Tips
- Use ISO date format (YYYY-MM-DD)
- Include job posting keywords naturally
- Use standard section names ("Experience", "Education")
- Avoid decorative elements and complex layouts
- Test final DOCX files with ATS scanners

### Customization
- **Styling**: Edit `theme.js` for colors, fonts, spacing
- **Layout**: Modify `docx-template.js` for advanced changes
- **Configuration**: Update `services/keyword-analysis/config/constants.py`

### Template System
Use the template folder to quickly create new applications: `cp -r ../data/applications/template ../data/applications/new-company-role`
