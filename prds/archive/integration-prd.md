# PRD: Complete Hiring-Evaluation Integration into Resumagic

## **Objective**
Complete the integration of the hiring-evaluation service into resumagic's architecture and CLI workflow to enable candidates to simulate hiring review boards before submitting applications.

## **Purpose & Vision**
This integration enhances resumagic's candidate-focused mission by adding **pre-submission validation**. Candidates can now:
- **Simulate a hiring review board** with 6 different personas (HR, Engineering, Design, Finance, CEO, Team)
- **Identify weaknesses** in their application materials before submission
- **Optimize their positioning** based on multi-perspective feedback
- **Build confidence** by seeing how hiring managers would evaluate them

This is **NOT** a hiring tool for organizations—it's an **application optimization tool** for candidates.

## **Current State**
✅ **Files Successfully Copied**: The hiring-evaluation service has been copied to `/Users/jonamar/Documents/resumagic/app/services/hiring-evaluation/` with all components:
- `evaluation-runner.js` - Main evaluation engine
- `evaluation-processor.js` - Results processing and markdown generation
- `generate-prompt.js` - YAML-based prompt generation
- `keyword-extractor.js` - Keyword analysis integration
- `personas/` - 6 persona YAML configurations (hr, technical, design, finance, ceo, team)

✅ **Data Structure Aligned**: Service expects resumagic's 3-tier folder structure:
```
data/applications/{company-role}/
├── inputs/resume.json, job-posting.md
├── working/keyword_analysis.json → evaluation-results.json  
└── outputs/{candidate}-evaluation.md
```

## **Integration Tasks**

### **Task 1: Verify Service Functionality** 
Test the copied service works in resumagic environment:
```bash
cd /Users/jonamar/Documents/resumagic/app
node services/hiring-evaluation/evaluation-runner.js elovate-director-product-management
```

**Expected Output:**
- Reads from `../data/applications/elovate-director-product-management/inputs/`
- Generates `evaluation-results.json` in `working/`
- Creates `jon-amar-evaluation.md` in `outputs/`
- HR scores ~9/10 (context window fix working)

### **Task 2: CLI Integration**
Add hiring-evaluation to resumagic's main CLI interface by updating the appropriate CLI file (likely `generate-resume.js` or creating a new entry point).

**CLI Pattern to Follow:**
```bash
# Document generation
node generate-resume.js company-role [--resume|--cover-letter|--both|--combined]

# Keyword analysis  
python services/keyword-analysis/kw_rank_modular.py company-role

# NEW: Simulate hiring review board
node services/hiring-evaluation/evaluation-runner.js company-role
```

### **Task 3: Documentation Update**
Update resumagic's architecture documentation to include the hiring-evaluation service:

**Add to Architecture Overview:**
```markdown
### **Hiring Evaluation Service** (`/app/services/hiring-evaluation/`)
- **Entry Point**: `evaluation-runner.js`
- **Responsibilities**: Multi-persona candidate evaluation simulation, structured feedback, application optimization insights
- **Technology**: Node.js with Ollama integration, YAML-based prompt configuration
- **Purpose**: Enable candidates to simulate hiring review boards before application submission
```

## **Candidate Workflow Integration**

### **Complete Application Optimization Flow**
1. **Create Application**: Copy template folder for new company-role
2. **Analyze Keywords**: `python services/keyword-analysis/kw_rank_modular.py company-role`
3. **Generate Documents**: `node generate-resume.js company-role --combined`
4. **🆕 Simulate Review Board**: `node services/hiring-evaluation/evaluation-runner.js company-role`
5. **Iterate**: Refine resume based on evaluation feedback and repeat

### **Value Proposition for Candidates**
- **Risk Mitigation**: Identify weak spots before submission
- **Confidence Building**: See strong scores across multiple personas
- **Strategic Positioning**: Understand how different stakeholders view your profile
- **Competitive Edge**: Optimize for 8.5+ scores across all evaluation dimensions

## **Technical Requirements**

### **Dependencies**
- **Ollama**: Service requires Ollama server running locally with `dolphin3:latest` model
- **Context Window**: Configured for 12K tokens (`num_ctx: 12288`) to handle 22K+ character prompts
- **No Additional npm packages**: Uses existing Node.js built-ins

### **File Integration Points**
- **Reads**: `inputs/resume.json`, `inputs/job-posting.md`, `working/keyword_analysis.json`
- **Writes**: `working/evaluation-results.json`, `outputs/{candidate}-evaluation.md`
- **External**: Ollama API calls to localhost:11434

### **Error Handling**
- Service includes 5-minute timeout for complex evaluations
- Graceful JSON parsing with detailed error messages
- Path resolution validation

## **Validation Criteria**

### **Success Metrics**
1. ✅ Service runs without errors from resumagic/app directory
2. ✅ Uses existing elovate-director-product-management data correctly  
3. ✅ Generates evaluation with consistent high scores (8.5-9.0 range)
4. ✅ Files appear in correct working/ and outputs/ directories
5. ✅ CLI integration follows resumagic patterns

### **Quality Checks**
- **HR Comprehension**: Verifies candidate has "8-10 years progressive experience"
- **Consistent Scoring**: All personas score similarly (low variance)
- **File Structure**: Outputs match resumagic's naming conventions
- **No Legacy Dependencies**: Confirm no references to old application-materials structure

## **Integration Notes**

### **Path Resolution**
Service uses relative paths from `app/services/hiring-evaluation/`:
```javascript
// Resolves to: resumagic/data/applications/{applicationName}/
const applicationPath = path.join(this.baseDir, '..', '..', '..', 'data', 'applications', this.applicationName);
```

### **CLI Arguments**
```bash
node services/hiring-evaluation/evaluation-runner.js [applicationName] [candidateName]
# applicationName: defaults to 'elovate-director-product-management'  
# candidateName: auto-extracted from resume.json if not provided
```

### **Output Integration**
- Markdown report follows resumagic's professional formatting
- JSON results compatible with potential future analytics
- Structured data enables integration with other resumagic services

## **Candidate Experience Enhancement**

### **Before This Integration**
- Generate optimized resume and cover letter
- Analyze keywords for ATS optimization
- Submit application hoping for the best

### **After This Integration**
- Generate optimized resume and cover letter
- Analyze keywords for ATS optimization
- **🆕 Simulate 6-person hiring review board**
- **🆕 Receive detailed feedback from HR, Engineering, Design, Finance, CEO, and Team perspectives**
- **🆕 Iterate on application materials based on multi-stakeholder insights**
- Submit application with confidence and strategic positioning

## **Next Steps**
1. Test and validate current integration
2. Add CLI commands to resumagic's interface
3. Update documentation
4. Consider workflow automation (e.g., auto-run after keyword analysis)

This integration strengthens resumagic's core mission: **empowering candidates with data-driven application optimization tools** that provide competitive advantages in today's hiring landscape.