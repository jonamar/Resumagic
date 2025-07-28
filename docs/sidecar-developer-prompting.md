# Sidecar Developer Prompting: Learnings and Best Practices

A collection of insights and strategies for effectively collaborating with AI coding assistants in complex software projects.

## Table of Contents
- [Overview](#overview)
- [Key Principles](#key-principles)
- [Prompting Strategies](#prompting-strategies)
- [Common Pitfalls](#common-pitfalls)
- [Lessons Learned](#lessons-learned)
- [Best Practices](#best-practices)

## Overview

**Sidecar Developer Prompting** refers to the practice of using AI coding assistants as collaborative partners in software development, where the AI acts as a "sidecar" to the human developer - providing specialized assistance while the human maintains overall direction and decision-making.

This document captures learnings from real-world application of this approach during the ResumeMagic project's modularization and TypeScript migration phases.

## Key Principles

### 1. Balanced Boundaries
- **Clear scope definition**: Explicitly state what the AI should and shouldn't do
- **Contextual constraints**: Provide enough context without overwhelming
- **Focused tasks**: Break complex work into manageable, well-defined chunks

### 2. Progressive Complexity
- Start with simple, isolated tasks to test the AI's understanding
- Gradually increase complexity as patterns are established
- Use successful examples to inform future interactions

### 3. Validation-First Approach
- Always validate AI output before integration
- Maintain human oversight for architectural decisions
- Test incrementally rather than trusting large changes

## Prompting Strategies

### Environment-Aware Prompting
When working in mixed JavaScript/TypeScript environments:

**❌ Poor approach:**
```
Convert this file to TypeScript and make sure it works with the build system.
```

**✅ Better approach:**
```
Convert ONLY this JavaScript code to TypeScript syntax. 
Do NOT attempt to compile or test.
Provide ONLY the TypeScript code as output.
```

### Constraint-Driven Instructions
**Structure:**
1. **STOP statement**: Force attention and reset context
2. **Single clear objective**: One primary task
3. **Explicit boundaries**: What NOT to do
4. **Expected output format**: Exactly what you want back

**Example:**
```
STOP. Read this carefully before proceeding.

Your ONLY task: Convert the JavaScript code below to TypeScript. Nothing else.

DO NOT: Try to compile, look at other files, worry about build process
DO: Add type annotations, convert syntax, provide only TypeScript code

[code block]

Expected output: Just the TypeScript version. Nothing else.
```

### Context Isolation
- Provide necessary context without environmental confusion
- Include type hints separately from the main task
- Avoid references to complex project structures when possible

## Common Pitfalls

### 1. Over-Contextualization
**Problem:** Providing too much project context leads to scope creep and confusion.

**Example of problem:**
- Sharing entire file structures
- Explaining complex build processes
- Mentioning unrelated project details

**Solution:** Isolate the specific task and provide only essential context.

### 2. Ambiguous Scope
**Problem:** Vague instructions lead to AI making assumptions beyond intended scope.

**Example of problem:**
```
"Fix this TypeScript file and make sure it works"
```

**Solution:**
```
"Add proper TypeScript type annotations to this function. Do not modify the logic or imports."
```

### 3. Environmental Confusion
**Problem:** AI gets distracted by mixed environments (JS/TS, build errors, etc.).

**Solution:** Strip away environmental concerns and focus on pure code transformation.

## Lessons Learned

### From TypeScript Migration Test
- **Issue**: qwen3 model got confused by mixed JS/TS environment and existing build errors
- **Root cause**: Prompt included too much environmental context
- **Solution**: Simplified to pure code conversion task without environmental concerns
- **Result**: ✅ Clean TypeScript output that compiled successfully (minor type name fix needed)
- **Takeaway**: Isolate core transformation tasks from environmental complexity

### Success Pattern: "Just Give Me Code"
- **Approach**: Ultra-simplified prompt focusing only on code conversion
- **Result**: AI provided exactly what was requested - clean TypeScript code block
- **Validation**: Code compiled after minor type correction and maintained full functionality
- **Key insight**: Sometimes the simplest prompt works best

### From Modularization Success
- **Success factor**: Clear, bounded scope (single file → multiple focused modules)
- **Success factor**: Concrete deliverables (21 specific modules with defined purposes)
- **Success factor**: Incremental validation at each phase
- **Takeaway**: Large refactoring works when broken into clear, testable phases

## Best Practices

### 1. Task Decomposition
```
Instead of: "Migrate this codebase to TypeScript"
Use: "Convert this single utility function to TypeScript with proper types"
```

### 2. Clear Validation Criteria
Always specify:
- What success looks like
- How to validate the output
- What interfaces must be preserved

### 3. Progressive Trust Building
- Start with low-risk, isolated tasks
- Validate thoroughly before moving to more complex work
- Use successful patterns as templates for future tasks

### 4. Prompt Template Structure
```
# Task Definition
[Single, clear objective]

# Constraints
DO NOT: [Explicit boundaries]
DO: [Specific actions]

# Context
[Minimal, essential information only]

# Expected Output
[Exact format and content expected]

# Validation
[How to verify success]
```

### 5. Error Recovery Strategies
When AI gets confused:
1. **Reset context**: Start with "STOP" or similar attention-grabbing command
2. **Simplify scope**: Remove environmental complexity
3. **Provide examples**: Show exact input/output format desired
4. **Validate incrementally**: Test small pieces before larger integration

## Future Exploration Areas

### Advanced Patterns
- Multi-step workflows with validation checkpoints
- Template-driven code generation
- Pattern recognition and application across codebases

### Integration Strategies
- Combining AI assistance with traditional development workflows
- Maintaining code quality standards with AI contributions
- Documentation generation and maintenance

### Metrics and Measurement
- Success rates for different prompt styles
- Time savings vs. validation overhead
- Quality metrics for AI-assisted code

---

*This document is a living resource. Add new learnings and patterns as they emerge from real-world application.*