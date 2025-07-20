# Resumagic Architecture Overview

## **Repository Structure**

Resumagic uses a **dual-repository design** for security and modularity:

```
/resumagic/
├── app/                    # Code repository (this repo)
│   ├── generate-resume.js     # Main Node.js entry point
│   ├── cli-parser.js          # Command-line processing
│   ├── path-resolver.js       # File system operations
│   ├── document-orchestrator.js # Generation coordination
│   ├── docx-template.js       # DOCX creation & formatting
│   ├── markdown-to-data.js    # Markdown parsing
│   ├── theme.js               # Styling configuration
│   ├── docs/                  # Documentation
│   └── services/
│       └── keyword-analysis/  # Python microservice
│           ├── kw_rank_modular.py  # Entry point
│           ├── kw_rank/           # Core analysis package
│           │   ├── core/          # Analysis algorithms
│           │   └── io/            # Data handling
│           ├── config/            # Configuration
│           └── tests/             # Test suite
│
└── data/                   # Private data repository (separate repo)
    ├── applications/          # Job application folders
    │   ├── template/         # Template for new applications
    │   ├── company-role-1/   # Example: nicejob-director-product
    │   ├── company-role-2/   # Example: relay-director-product
    │   └── ...
    └── templates/            # Reusable content templates
        └── tiles.json
```

### **Key Repository Design Principles**

- **Code/Data Separation**: Public code repository separate from private personal data
- **Security**: Personal information never mixed with shareable code
- **Modularity**: Each repository can be versioned and managed independently

## **Application Data Structure**

Each job application in `/data/applications/` follows this **required 3-tier structure**:

```
{company-role}/                 # Example: nicejob-director-product
├── inputs/                     # Source materials (required)
│   ├── resume.json            # Structured resume data
│   ├── cover-letter.md        # Markdown content + YAML front matter
│   └── keywords.json          # Keywords for analysis
├── working/                   # Analysis results (auto-generated)
│   ├── keyword_analysis.json  # Detailed analysis with scoring
│   ├── keyword-checklist.md   # Human-readable optimization guide
│   └── top5.json             # Top skills summary
└── outputs/                   # Final deliverables (auto-generated)
    ├── Jon-Amar-Resume-{Company}.docx
    ├── Jon-Amar-Cover-Letter-{Company}.docx
    └── Jon-Amar-Combined-{Company}.docx
```

### **How Applications Connect to the System**

1. **Path Resolution**: The Node.js service resolves paths from `/app/` to `/data/applications/{company-role}/`
2. **Template System**: New applications are created by copying `/data/applications/template/`
3. **File Processing**: Both services read from `inputs/`, write to `working/` and `outputs/`
4. **Naming Convention**: Application folders use `{company}-{role-level}-{function}` format

## **Service Architecture**

### **Node.js Document Service** (`/app/`)
- **Entry Point**: `generate-resume.js`
- **Responsibilities**: CLI parsing, file operations, DOCX generation, ATS optimization
- **Technology**: Node.js with `docx`, `gray-matter`, `marked` libraries

### **Python Analysis Service** (`/app/services/keyword-analysis/`)
- **Entry Point**: `kw_rank_modular.py` 
- **Responsibilities**: TF-IDF scoring, semantic clustering, knockout detection, resume injection analysis
- **Technology**: Python with `scikit-learn`, `sentence-transformers`

## **Integration Points**

### **CLI Interface**
```bash
# Navigate to app directory first
cd /path/to/resumagic/app

# Document generation (reads from ../data/applications/{company-role}/)
node generate-resume.js company-role [--resume|--cover-letter|--both|--combined]

# Keyword analysis (reads from ../data/applications/{company-role}/)
python services/keyword-analysis/kw_rank_modular.py company-role

# Create new application (in data repository)
cp -r ../data/applications/template ../data/applications/new-company-role
```

### **File System Contract**

**Input Files** (in `inputs/`):
- `resume.json`: Structured resume data with personal info, experience, skills
- `cover-letter.md`: Markdown content with YAML front matter for metadata
- `keywords.json`: Array of keywords to analyze and optimize for

**Output Files** (generated):
- **Documents** (in `outputs/`): Professional DOCX files ready for submission
- **Analysis** (in `working/`): Keyword analysis, optimization checklists, rankings

## **Data Flow**

### **Document Generation Pipeline**
1. **CLI Parsing**: Process command-line arguments and determine generation plan
2. **Path Resolution**: Resolve paths from app directory to data directory
3. **Data Loading**: Load JSON resume and parse Markdown cover letter
4. **DOCX Creation**: Generate professional documents with proper formatting
5. **ATS Optimization**: Remove compatibility mode, optimize for parsing systems

### **Keyword Analysis Pipeline**
1. **Input Loading**: Load keywords and resume data from application folder
2. **Categorization**: Separate knockouts ("MBA required") from skills ("product management")
3. **Scoring**: Apply TF-IDF + section weights + role-specific boosts
4. **Clustering**: Group similar keywords with semantic aliases
5. **Injection Analysis**: Identify optimization opportunities in existing resume
6. **Export**: Generate analysis files and human-readable checklists

## **Key Features**

- **ATS Optimization**: Removes Word compatibility mode, optimizes XML structure
- **Intelligent Categorization**: Distinguishes knockout requirements from gradual skills
- **Semantic Clustering**: Groups related keywords ("Product Manager" + "Product Lead")
- **Template System**: Consistent application setup from template folder
- **Dual-Language Design**: Each service uses optimal technology stack

## **For Integration Engineers**

### **Integration Model**
- **File-Based Communication**: Services communicate through standardized file formats
- **Predictable Structure**: All applications follow identical 3-tier folder model
- **Clear Boundaries**: Node.js handles documents, Python handles analysis
- **Template-Driven**: New applications inherit consistent structure

### **Adding New Services**
1. **Read from**: Existing files in `inputs/` and `working/` directories
2. **Write to**: Additional files in `working/` directory for intermediate results
3. **Follow conventions**: Use application folder structure and naming patterns
4. **CLI Integration**: Add new commands following existing CLI patterns

### **Path Resolution Example**
```javascript
// From app directory, services resolve to:
const applicationPath = '../data/applications/' + applicationName;
const inputsPath = applicationPath + '/inputs/';
const workingPath = applicationPath + '/working/';
const outputsPath = applicationPath + '/outputs/';
```

This architecture provides a clean, predictable foundation for integrating new services into the resume generation and optimization pipeline.