# Job JSON Resolver PRD

## Executive Summary

Build a **CLI-first job posting resolution service** that converts ATS job URLs into clean, structured JSON data for seamless integration with existing resume generation workflows. This service eliminates manual job posting extraction while maintaining the 80/20 approach - focus on stable API-based ATS platforms with graceful fallback to manual copy-paste.

## Product Vision & Goals

### Core Product Values
- **CLI-Native Integration**: Seamless fit with existing `generate-resume.js` workflow
- **80/20 Value Optimization**: Target stable API-based ATS platforms for maximum ROI
- **Graceful Degradation**: Clear fallback instructions when auto-resolution fails
- **Workflow Acceleration**: Auto-populate job data for keyword analysis and document generation

### Target User Experience
**Primary Users**: Users creating new resume applications
**Secondary Users**: AI agents orchestrating job application workflows

**Key Experience Goals**:
- **One-Command Application Creation**: `--new-app-from-url` creates complete application structure
- **Auto-populated Data**: Job posting, company info, and metadata ready for analysis
- **Seamless Integration**: Works with existing `--evaluate`, `--all` workflow flags
- **Clear Error Messaging**: Helpful guidance when manual intervention needed

## Problem Statement

### Current Pain Points
- **Manual Job Posting Extraction**: Users must manually copy-paste job descriptions into `job-posting.md`
- **Inconsistent Data Format**: Manual extraction leads to inconsistent job posting structure
- **Missed Integration Opportunities**: Job URL contains metadata (company, role, apply link) not captured
- **Workflow Friction**: Manual step interrupts otherwise automated application creation

### Impact on User Workflows
- **Time Overhead**: 5-10 minutes per application for manual extraction and formatting
- **Data Quality Issues**: Inconsistent job posting format affects keyword analysis quality
- **Missed Metadata**: Company info, posting dates, apply URLs not systematically captured
- **Cognitive Load**: Context switching between browser, text editor, and CLI

## Solution Overview

**CLI-First Job Resolution**: Extend existing `generate-resume.js` CLI with URL-based application creation that auto-resolves job postings from major ATS platforms.

### Architectural Philosophy
- **Service Integration**: New microservice following existing `services/` architecture patterns
- **CLI Extension**: Natural extension of existing `--new-app` functionality
- **API-First Approach**: Prioritize stable JSON endpoints over HTML scraping
- **Graceful Fallback**: Clear error messages with manual alternatives when resolution fails

## Technical Architecture

### Service Structure
```
app/services/job-resolver/
├── resolver.js                 # Main orchestrator and URL classification
├── adapters/
│   ├── base-adapter.js         # Common adapter interface and utilities
│   ├── lever-adapter.js        # Lever API integration (jobs.lever.co)
│   ├── greenhouse-adapter.js   # Greenhouse API integration (boards.greenhouse.io)
│   ├── workable-adapter.js     # Workable widget API integration
│   ├── recruitee-adapter.js    # Recruitee careers API integration
│   ├── smartrecruiters-adapter.js # SmartRecruiters API integration
│   └── ashby-adapter.js        # Ashby GraphQL/REST integration
├── config/
│   ├── ats-patterns.json       # URL pattern matching and API endpoints
│   └── timeout-config.json     # Per-platform timeout and retry settings
├── utils/
│   ├── url-classifier.js       # Hostname/path-based ATS detection
│   ├── response-normalizer.js  # Convert ATS responses to standard schema
│   └── error-formatter.js      # User-friendly error messages
└── __tests__/
    ├── integration/            # Real API integration tests
    ├── adapters/              # Adapter-specific test suites
    └── fixtures/              # Test URLs and expected responses
```

### CLI Integration
```bash
# Enhanced application creation workflow
node generate-resume.js --new-app-from-url "https://jobs.lever.co/company/posting-id"

# Optional flags for enhanced workflows
node generate-resume.js --new-app-from-url <url> --auto-analyze    # Auto-run keyword analysis
node generate-resume.js --new-app-from-url <url> --all            # Complete workflow
node generate-resume.js --new-app-from-url <url> --preview        # Open generated files

# Update existing application with new job posting
node generate-resume.js application-name --update-job-posting <url>
```

### Service Wrapper Integration
```javascript
// app/services/wrappers/job-resolver-wrapper.js
class JobResolverWrapper extends BaseServiceWrapper {
  async execute(input) {
    const { url, timeout = 10000 } = input;
    
    try {
      const resolver = new JobResolver();
      const result = await resolver.resolve(url, { timeout });
      
      return this.createSuccessResponse(result, {
        platform: result.source.platform,
        method: result.source.method,
        timingMs: result.source.timingMs
      });
    } catch (error) {
      return this.createErrorResponse(error);
    }
  }
}
```

## Normalized Data Schema

### Standard Response Format
```javascript
{
  "title": "Senior Product Manager",
  "company": "Example Corp",
  "locations": ["San Francisco, CA", "Remote"],
  "remote": true,
  "posted_at": "2024-01-15T00:00:00Z",        // ISO8601 if available
  "job_id": "lever-abc123",                   // platform-specific identifier
  "apply_url": "https://jobs.lever.co/company/abc123/apply",
  "description_html": "<p>Job description...</p>",
  "source": {
    "platform": "lever",                      // lever|greenhouse|workable|recruitee|smartrecruiters|ashby
    "method": "api",                         // api|browser-intercept|json-ld
    "input_url": "https://jobs.lever.co/company/abc123",
    "resolved_url": "https://api.lever.co/v0/postings/company/abc123?mode=json",
    "timingMs": 1847
  },
  "metadata": {
    "extracted_keywords": ["product management", "strategy", "analytics"],
    "salary_range": "$150k - $200k",         // if available
    "employment_type": "full-time",          // if available
    "department": "Product"                  // if available
  }
}
```

## Implementation Scope

### Phase 1: MVP (Weeks 1-2)
**Target Platforms:**
- ✅ **Lever** (`jobs.lever.co/*`) - Stable public API, excellent documentation
- ✅ **Greenhouse** (`boards.greenhouse.io/*`) - Well-documented job board API

**Deliverables:**
- CLI integration with `--new-app-from-url` flag
- Service wrapper following existing architecture patterns
- Two adapter implementations with comprehensive error handling
- Integration tests with real API endpoints

**Success Criteria:**
- ≥95% success rate on Lever and Greenhouse job URLs
- <3 second average resolution time
- Seamless integration with existing application creation workflow
- Clear error messages for unsupported platforms

### Phase 2: Expansion (Weeks 3-4)
**Additional Platforms:**
- ✅ **Workable** (`apply.workable.com/*`) - Widget API integration
- ✅ **Recruitee** (`*.recruitee.com/*`) - Careers site API
- ✅ **SmartRecruiters** (`careers.smartrecruiters.com/*`) - Public postings API
- ✅ **Ashby** (`jobs.ashbyhq.com/*`) - GraphQL/JSON endpoint discovery

**Enhanced Features:**
- Automatic keyword extraction integration
- Enhanced metadata extraction (salary, department, etc.)
- Bulk URL processing capabilities

### Phase 3: Advanced Resolution (Weeks 5-6)
**Complex Platforms:**
- ⚠️ **Workday** (`*.myworkdayjobs.com/*`) - Browser automation with Playwright
- 🔄 **LinkedIn/Indeed Redirect Following** - Extract actual ATS URLs via "Apply" button

**Advanced Features:**
- Browser automation for JavaScript-heavy sites
- Intelligent redirect following for job board aggregators
- Enhanced error recovery and retry logic

### Explicitly Out of Scope
- ❌ **Content scraping from LinkedIn/Indeed** - Violation of ToS
- ❌ **Taleo and legacy ATS platforms** - Poor ROI, high maintenance
- ❌ **Authentication flows** - Focus on public job postings only
- ❌ **Bulk crawling/spidering** - Single URL resolution only

## ATS Integration Recipes

### Lever Integration
```javascript
// Human URL: https://jobs.lever.co/company/posting-id
// API: GET https://api.lever.co/v0/postings/company/posting-id?mode=json

class LeverAdapter extends BaseAdapter {
  async resolve(url) {
    const { company, postingId } = this.parseUrl(url);
    const apiUrl = `https://api.lever.co/v0/postings/${company}/${postingId}?mode=json`;
    
    const response = await fetch(apiUrl);
    const data = await response.json();
    
    return this.normalize({
      title: data.text,
      description: data.description,
      locations: data.locations.map(l => l.name),
      createdAt: data.createdAt,
      applyUrl: data.applyUrl
    });
  }
}
```

### Greenhouse Integration
```javascript
// Human URL: https://boards.greenhouse.io/company/jobs/job-id
// API: GET https://boards-api.greenhouse.io/v1/boards/company/jobs?content=true

class GreenhouseAdapter extends BaseAdapter {
  async resolve(url) {
    const { company, jobId } = this.parseUrl(url);
    const apiUrl = `https://boards-api.greenhouse.io/v1/boards/${company}/jobs?content=true`;
    
    const response = await fetch(apiUrl);
    const { jobs } = await response.json();
    const job = jobs.find(j => j.id.toString() === jobId);
    
    if (!job) throw new Error(`Job ${jobId} not found`);
    
    return this.normalize({
      title: job.title,
      description: job.content,
      locations: job.location?.name ? [job.location.name] : [],
      departments: job.departments?.map(d => d.name) || []
    });
  }
}
```

## Error Handling & User Experience

### Error Classification
```javascript
// Comprehensive error handling with actionable messages
const ERROR_TYPES = {
  UNRECOGNIZED_PLATFORM: {
    code: 'UNRECOGNIZED_PLATFORM',
    message: 'This job site is not yet supported.',
    action: 'Please paste the job URL from: Lever, Greenhouse, Workable, Recruitee, SmartRecruiters, or Ashby'
  },
  JOB_NOT_FOUND: {
    code: 'JOB_NOT_FOUND', 
    message: 'Job posting not found or no longer available.',
    action: 'Please verify the URL is correct and the job is still posted'
  },
  NETWORK_TIMEOUT: {
    code: 'NETWORK_TIMEOUT',
    message: 'Request timed out while fetching job data.',
    action: 'Please try again or paste the job description manually'
  },
  RATE_LIMITED: {
    code: 'RATE_LIMITED',
    message: 'Too many requests to this platform.',
    action: 'Please wait a moment before trying again'
  }
};
```

### User-Friendly CLI Output
```bash
$ node generate-resume.js --new-app-from-url "https://unknown-ats.com/job/123"

❌ Job Resolution Failed
   Platform: unknown-ats.com (not supported)
   
   Supported platforms:
   • Lever (jobs.lever.co)
   • Greenhouse (boards.greenhouse.io) 
   • Workable (apply.workable.com)
   • Recruitee (*.recruitee.com)
   
   Next steps:
   1. Check if the job is posted on a supported platform
   2. Or use: node generate-resume.js --new-app "company" "role"
   3. Then manually edit inputs/job-posting.md

$ echo $?
1  # Non-zero exit code for scripting
```

## Integration with Existing Workflows

### Enhanced Application Creation
```javascript
// Extended generate-resume.js CLI integration
if (args.newAppFromUrl) {
  const jobResolver = getServiceWrapper('job-resolver');
  
  try {
    const jobData = await jobResolver.execute({ url: args.newAppFromUrl });
    
    // Create application with resolved data
    const applicationName = generateApplicationName(jobData.company, jobData.title);
    await createNewApplication(applicationName, {
      jobPosting: jobData.description_html,
      company: jobData.company,
      title: jobData.title,
      applyUrl: jobData.apply_url,
      metadata: jobData.metadata
    });
    
    console.log(`✅ Created application: ${applicationName}`);
    console.log(`   Company: ${jobData.company}`);
    console.log(`   Role: ${jobData.title}`);
    console.log(`   Apply URL: ${jobData.apply_url}`);
    
    // Auto-run keyword analysis if requested
    if (args.autoAnalyze) {
      await runKeywordAnalysis(applicationName);
      console.log(`✅ Keyword analysis completed`);
    }
    
  } catch (error) {
    console.error(`❌ Job resolution failed: ${error.message}`);
    console.error(`   Use manual creation: node generate-resume.js --new-app "company" "role"`);
    process.exit(1);
  }
}
```

### Service Registry Integration
```javascript
// Add to app/services/wrappers/service-registry.js
const SERVICE_REGISTRY = {
  'document-generation': () => import('./document-generation-wrapper.js'),
  'keyword-analysis': () => import('./keyword-analysis-wrapper.js'),
  'hiring-evaluation': () => import('./hiring-evaluation-wrapper.js'),
  'vale-linting': () => import('./vale-linting-wrapper.js'),
  'job-resolver': () => import('./job-resolver-wrapper.js'),  // NEW
};
```

## Success Criteria & Validation

### Functional Requirements
- ✅ **Platform Coverage**: ≥95% success rate on 6 target ATS platforms
- ✅ **Performance**: <3s average resolution time for API-based platforms
- ✅ **CLI Integration**: Seamless `--new-app-from-url` workflow
- ✅ **Error Handling**: Clear, actionable error messages for all failure modes
- ✅ **Data Quality**: Structured job data ready for keyword analysis

### Integration Requirements
- ✅ **Workflow Compatibility**: Works with all existing CLI flags (`--evaluate`, `--all`, `--preview`)
- ✅ **Service Architecture**: Follows established service wrapper patterns
- ✅ **Testing Integration**: Comprehensive test suite with real API validation
- ✅ **Documentation**: Clear usage examples and troubleshooting guide

### Quality Gates
- ✅ **Backwards Compatibility**: All existing workflows continue to function
- ✅ **Performance Baseline**: No regression in application creation time
- ✅ **Error Recovery**: Graceful fallback to manual workflow when needed
- ✅ **Maintainability**: Clean, testable code following existing patterns

## Risk Assessment & Mitigation

### Technical Risks
- **API Changes**: ATS platforms may modify their public APIs
  - *Mitigation*: Comprehensive test suite with real API validation, graceful degradation
- **Rate Limiting**: Platforms may implement stricter rate limiting
  - *Mitigation*: Respect rate limits, implement exponential backoff, clear error messages
- **Authentication Requirements**: Platforms may require authentication for API access
  - *Mitigation*: Monitor for auth changes, fallback to manual workflow

### User Experience Risks
- **False Expectations**: Users may expect 100% success rate across all platforms
  - *Mitigation*: Clear documentation of supported platforms, helpful error messages
- **Workflow Disruption**: Failed resolution may interrupt application creation flow
  - *Mitigation*: Graceful fallback to existing manual workflow with clear guidance

### Mitigation Strategies
- **Incremental Implementation**: Start with most stable platforms (Lever, Greenhouse)
- **Comprehensive Testing**: Real API integration tests with failure scenario coverage
- **Clear Communication**: Transparent about supported platforms and limitations
- **Graceful Degradation**: Always provide manual alternative when auto-resolution fails

## Timeline & Development Plan

### Week 1: Foundation & MVP Platforms
- **Day 1-2**: Service architecture setup, base adapter implementation
- **Day 3-4**: Lever adapter development and testing
- **Day 5-7**: Greenhouse adapter development and CLI integration

### Week 2: Integration & Validation
- **Day 1-3**: Service wrapper implementation and registry integration
- **Day 4-5**: Comprehensive error handling and user experience polish
- **Day 6-7**: Integration testing and documentation

### Week 3: Platform Expansion
- **Day 1-2**: Workable adapter implementation
- **Day 3-4**: Recruitee and SmartRecruiters adapters
- **Day 5-7**: Ashby adapter and platform validation

### Week 4: Advanced Features
- **Day 1-3**: Enhanced metadata extraction and keyword integration
- **Day 4-5**: Performance optimization and caching
- **Day 6-7**: Documentation and usage examples

## Future Considerations

### Potential Extensions
- **Browser Automation**: Playwright integration for JavaScript-heavy platforms
- **Metadata Enhancement**: Salary parsing, benefits extraction, company info
- **Bulk Processing**: Multi-URL processing for batch application creation
- **Platform Expansion**: Additional ATS platforms based on user demand

### Architectural Evolution
- **Caching Layer**: Redis/file-based caching for frequently accessed job postings
- **Queue System**: Background processing for slow platforms (Workday)
- **API Gateway**: External API exposure if needed for browser extensions
- **Monitoring**: Platform availability and success rate tracking

## Conclusion

The Job JSON Resolver provides immediate value by eliminating manual job posting extraction while fitting seamlessly into existing workflows. The CLI-first approach avoids unnecessary complexity while the service architecture enables future expansion. Focus on stable API-based platforms ensures high success rates with clear fallback patterns for edge cases.

**Key Insight**: This service transforms job URLs from external links into structured data that powers the entire resume generation pipeline - from keyword analysis to document creation to hiring evaluation.