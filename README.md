# Resumagic

![License](https://img.shields.io/badge/license-MIT-green)
![Language](https://img.shields.io/badge/TypeScript-5.x-blue)
![Docs](https://img.shields.io/badge/docs-Architecture-blueviolet)
![Tests](https://img.shields.io/badge/tests-JS_%26_Python-brightgreen)

Professional resume and cover letter generator with intelligent keyword analysis for ATS optimization.

## ⚡ Quick Start (MVP)

```bash
# 1. Install dependencies
npm install
pip install -r services/keyword-analysis/requirements.txt

# 2. Scaffold private data repo (non-destructive)
scripts/setup-data.sh

# 3. Create new application folder (via compiled CLI)
node dist/generate-resume.js --new-app "Company" "Role"

# 4. Edit input files
# ../data/applications/company-role/inputs/resume.json
# ../data/applications/company-role/inputs/cover-letter.md  
# ../data/applications/company-role/inputs/keywords.json

# 5. Generate documents
node dist/generate-resume.js company-role

# 5. Integrated workflows (NEW!)
node dist/generate-resume.js company-role --evaluate       # Documents + hiring evaluation (quality mode)
node dist/generate-resume.js company-role --evaluate --fast # Documents + hiring evaluation (speed mode)
node dist/generate-resume.js company-role --all            # Complete workflow

# 5a. Advanced evaluation configuration (NEW!)
node dist/generate-resume.js company-role --evaluate --eval-model qwen3:0.6b --eval-parallel 8

# 6. Individual services
python services/keyword-analysis/kw_rank_modular.py company-role
node services/hiring-evaluation/evaluation-runner.js company-role
```

**Output**: Professional DOCX files + intelligent keyword optimization checklist

## What This Tool Does

**Document Generation**: Converts JSON Resume + Markdown → Professional DOCX files
**Keyword Analysis**: Analyzes job postings → Categorizes keywords → Optimization checklist
**Hiring Simulation**: 6-persona review board simulation with detailed evaluation reports
**ATS Optimization**: Ensures documents are easily parsed by applicant tracking systems
**Integrated Workflows**: End-to-end automation with `--evaluate` and `--all` flags

## Architecture Overview

**🔧 Clean Microservice Design**
- **Node.js**: Document generation (DOCX creation, markdown parsing)
- **Python**: Intelligent analysis (keyword scoring, semantic clustering)
- **Separation**: Each service uses optimal technology stack
- **Local CI/CD**: Fast 6-second validation pipeline with git hook integration
- **Testing**: 167 tests with Vitest (~2x faster than Jest) + Python testing with comprehensive coverage

## Project Structure

This project uses a two-repo structure to separate code from private data:

### Repository Structure

```
/resumagic/
├── app/                             # Public code repository (this repo)
│   ├── docs/                        # Documentation
│   │   └── cover-letter-schema.md   # Cover letter JSON schema
│   ├── services/                    # Microservices
│   │   ├── keyword-analysis/        # Python keyword analysis service
│   │   │   ├── kw_rank/             # Modular Python package
│   │   │   │   ├── core/            # Core analysis modules
│   │   │   │   └── io/              # Input/output modules
│   │   │   ├── config/              # Configuration management
│   │   │   ├── tests/               # Comprehensive test suite
│   │   │   ├── API.md               # API documentation
│   │   │   ├── SETUP.md             # Setup guide
│   │   │   └── kw_rank_modular.py   # Modern entry point
│   │   └── hiring-evaluation/       # Node.js hiring simulation service (split temperature optimized)
│   │       ├── personas/            # YAML persona configurations
│   │       ├── evaluation-runner.js # Main evaluation engine (dolphin3@0.7/phi3@0.3)
│   │       ├── evaluation-processor.js # Results processing and markdown generation
│   │       └── model-test-results/  # Comprehensive optimization study (42-153% improvement)
│   ├── generate-resume.js           # CLI entry (compiled from TypeScript)
│   ├── services/
│   │   └── document-generation/     # All document generation logic (moved from core/)
│   │       ├── document-builders/   # Resume/Cover letter/Combined builders
│   │       ├── sections/            # Resume and cover letter section builders
│   │       ├── formatting/          # Shared formatting utilities
│   │       ├── generation-planning.ts
│   │       ├── path-resolution.ts
│   │       ├── markdown-processing.ts
│   │       └── document-orchestration.ts
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
    │   │       ├── Resume-Relay.docx
    │   │       ├── Cover-Letter-Relay.docx
    │   │       └── Cover-Letter-and-Resume-Relay.docx
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
│   ├── top5.json
│   ├── evaluation-results.json      # Hiring simulation raw data
│   └── {candidate}-evaluation.md    # Hiring simulation summary
└── outputs/               # Generated deliverables (auto-generated)
    ├── Resume-{Company}.docx
    ├── Cover-Letter-{Company}.docx
    └── Cover-Letter-and-Resume-{Company}.docx
```

**Benefits:**
- **HR-Friendly**: Files named `Resume-Company.docx` for easy identification
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
- **TypeScript** (for compilation): `npm install -g typescript`
- **Python 3.8+** (for keyword analysis)
- **Ollama** (for hiring evaluation service)
  - Install: `curl -fsSL https://ollama.ai/install.sh | sh`
  - Models: `ollama pull dolphin3:latest` (quality) + `ollama pull phi3:mini` (speed)
- **Virtual environment recommended**

## TypeScript Migration Status

This project has been migrated from JavaScript to TypeScript for better type safety and development experience. You can:

**Option 1: Build and run (recommended for production):**
```bash
# Build TypeScript to JavaScript
npx tsc

# Run compiled JavaScript
node dist/generate-resume.js [options]
```

**Option 2: Direct TypeScript execution (development):**
```bash
# Run TypeScript directly with ts-node
npx ts-node generate-resume.ts [options]
```

All documentation examples use the JavaScript commands (`node generate-resume.js`) but you can substitute with TypeScript equivalents.

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

### Document Generation (compiled CLI)

```bash
# Generate all formats (recommended)
node dist/generate-resume.js company-role

# Generate specific formats
node dist/generate-resume.js company-role --cover-letter
node dist/generate-resume.js company-role --both
node dist/generate-resume.js company-role --combined

# Integrated workflows (NEW!)
node dist/generate-resume.js company-role --evaluate       # Documents + hiring evaluation (quality mode)
node dist/generate-resume.js company-role --evaluate --fast # Documents + hiring evaluation (speed mode)
node dist/generate-resume.js company-role --all            # Complete workflow: docs + analysis + evaluation

# Canonical outputs (NEW!)
# Read inputs from data/canonical/inputs and write DOCX to data/canonical/outputs
node dist/generate-resume.js --canonical-output
```

### Keyword Analysis

```bash
# Run analysis
python services/keyword-analysis/kw_rank_modular.py company-role

# Run tests
cd services/keyword-analysis && python run_tests.py --coverage
```

### Hiring Simulation

```bash
# Two-tier optimization: Quality vs Speed (Split Temperature Configuration)
# Quality mode (default): dolphin3:latest @ temp 0.7 - 188s, excellent differentiation (range 3-5)
node dist/generate-resume.js company-role --evaluate

# Speed mode: phi3:mini @ temp 0.3 - 148s, good differentiation (range 5+, 76% improvement)
node dist/generate-resume.js company-role --evaluate --fast

# Direct service calls (if needed)
node services/hiring-evaluation/evaluation-runner.js company-role "John Smith"
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
    ├── Resume-Company.docx
    ├── Cover-Letter-Company.docx
    └── Cover-Letter-and-Resume-Company.docx
```

## Troubleshooting

### Common Issues

**Command not found**: Ensure you're in the correct directory and dependencies are installed
**Python import errors**: Check virtual environment activation and requirements.txt
**File not found**: Verify application folder structure and input files exist
**DOCX generation fails**: Check resume.json format and required fields

### Testing & CI/CD

**Local CI/CD Pipeline** (Fast, Simple, Agentic-Compatible)
```bash
# Full validation pipeline (~6 seconds)
../scripts/ci/local-pipeline.sh

# Individual test suites
npm test                    # JavaScript tests with Vitest (167 tests, ~2x faster)
npm run test:python        # Python tests (28 tests)
npm run lint               # ESLint validation

# Quick validation options
../scripts/ci/local-pipeline.sh --lint-only    # Lint only
../scripts/ci/local-pipeline.sh --skip-tests   # Skip tests
```

**Git Integration**
```bash
# Pre-commit hook runs automatically (lint validation)
git commit -m "your changes"

# Skip validation if needed
SKIP_CI=true git commit -m "skip validation"
git commit --no-verify -m "skip validation"
git commit -m "changes [skip ci]"  # Skip via commit message
```

**Manual Testing**
```bash
# Test document generation
node dist/generate-resume.js relay-director-of-product

# Test keyword analysis
python services/keyword-analysis/kw_rank_modular.py relay-director-of-product
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

### New Application (Happy Path)
Use the compiled CLI to create new applications:

```bash
node dist/generate-resume.js --new-app "Company" "Role"
# Example
node dist/generate-resume.js --new-app "Stocksy" "Product Director"
```
