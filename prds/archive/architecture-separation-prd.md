# Architecture Separation PRD: Language & Service Boundaries

## Problem Statement

The current architecture mixes JavaScript (main application) with Python (keyword analysis) in a single directory structure, creating:

1. **Developer Confusion**: New developers can't easily understand technology boundaries
2. **Dependency Conflicts**: Different package managers (npm vs pip) in same space
3. **Deployment Complexity**: Mixed runtime requirements
4. **Maintenance Burden**: Different testing, linting, and CI/CD needs

## Recommended Architecture: Microservice + Clear Boundaries

### Option 1: Separate Service Directories (Recommended)
```
resumagic/
├── app/                          # Main Node.js application
│   ├── package.json
│   ├── generate-resume.js
│   ├── cli-parser.js
│   ├── docx-template.js
│   └── ... (all JS files)
├── services/
│   └── keyword-analysis/         # Python microservice
│       ├── requirements.txt
│       ├── pyproject.toml
│       ├── kw_rank/
│       │   ├── core/
│       │   ├── io/
│       │   └── main.py
│       ├── config/
│       │   └── constants.py
│       ├── tests/
│       └── README.md
├── data/                         # Data repository (existing)
└── docs/                         # Documentation
```

### Option 2: Language-Based Separation
```
resumagic/
├── js/                          # All JavaScript code
│   ├── app/
│   ├── package.json
│   └── ...
├── python/                      # All Python code  
│   ├── keyword-analysis/
│   ├── requirements.txt
│   └── ...
├── data/                        # Data repository
└── shared/                      # Shared configs, docs
```

### Option 3: Service-Based Monorepo
```
resumagic/
├── services/
│   ├── document-generator/      # Node.js service
│   │   ├── package.json
│   │   └── src/
│   └── keyword-analysis/        # Python service
│       ├── requirements.txt
│       └── src/
├── shared/
│   ├── types/
│   └── configs/
└── data/
```

## Recommended Implementation: Option 1

**Benefits:**
- Clear service boundaries
- Language-specific tooling in appropriate places
- Easy to understand for new developers
- Supports microservice evolution
- Each service can have its own CI/CD pipeline

**Migration Plan:**
1. Create `services/keyword-analysis/` directory
2. Move all Python code there
3. Update import paths and CLI integration
4. Add service-specific requirements.txt
5. Update documentation and README files
6. Create integration layer between JS app and Python service

## Integration Strategy

### CLI Integration (Current)
```bash
# From JS app, call Python service
node app/generate-resume.js -> calls -> python services/keyword-analysis/main.py
```

### Future API Integration
```bash
# Python service as HTTP API
POST /analyze-keywords
GET /health
```

## Benefits of This Approach

1. **Developer Onboarding**: Clear "this is JS, this is Python"
2. **Technology Independence**: Each service can evolve independently
3. **Testing**: Service-specific test suites
4. **Dependencies**: No package manager conflicts
5. **Deployment**: Can deploy services independently
6. **Scalability**: Can scale keyword analysis separately from document generation

## Implementation Timeline

- **Immediate**: Move Python code to `services/keyword-analysis/`
- **Short-term**: Add service-specific documentation and tooling
- **Medium-term**: Consider HTTP API for better service boundaries
- **Long-term**: Full microservice deployment if needed

This architecture follows industry best practices for polyglot applications and makes the codebase much more maintainable and understandable.