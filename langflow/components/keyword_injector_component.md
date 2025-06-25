# Resume Keyword Injector Component

**High-Level Summary:** A Langflow component that intelligently enhances resume JSON with job-relevant keywords using a dual-strategy approach: line-by-line pattern-based injection for high-priority keywords (5-10 terms) into highlights/descriptions, and automatic addition of low-priority keywords to the skills section for ATS optimization.

## Overview

The Resume Keyword Injector solves the critical ATS (Applicant Tracking System) challenge by strategically placing keywords from job postings into resume content. Instead of wholesale document rewrites that often fail, it uses targeted, rule-based injection for maximum reliability and natural integration.

## Key Features

### 🎯 **Dual-Strategy Approach**
- **High-Priority Keywords (5-10)**: Sophisticated line-by-line injection into work experience highlights
- **Low-Priority Keywords (20-50)**: Automatic addition to skills section for keyword density

### 🔧 **Pattern-Based Injection Rules**
- "Built X by" → "Built [keyword]-driven X by"
- "Led X team" → "Led X team leveraging [keyword]"
- "Drove X growth" → "Drove X growth in [keyword]"
- Smart technology/platform keyword appending

### 📊 **Intelligent Processing**
- Priority-based keyword sorting
- Usage tracking to avoid over-injection
- Section-wise modification limits
- Duplicate keyword detection
- Comprehensive modification logging

## Input Requirements

### 1. Resume JSON
Standard JSON Resume format with `work`, `education`, `skills` sections:
```json
{
  "work": [
    {
      "name": "Company Name",
      "position": "Role Title",
      "highlights": [
        "Built product vision and strategy...",
        "Led cross-functional team of 10..."
      ]
    }
  ],
  "skills": [
    {
      "name": "Product Leadership",
      "keywords": ["Strategy", "Roadmaps"]
    }
  ]
}
```

### 2. Keywords Data
Structured keyword data with priority and usage tracking:
```json
{
  "healthcare technology platform": [
    {
      "used exact match": 0,
      "used adjusted": 2,
      "priority": 8
    }
  ],
  "real-time patient insights": [
    {
      "used exact match": 0,
      "used adjusted": 0,
      "priority": 10
    }
  ]
}
```

## Configuration Options

| Parameter | Default | Description |
|-----------|---------|-------------|
| **High Priority Threshold** | 7 | Priority score minimum for line-by-line injection |
| **Max Modifications Per Section** | 2 | Limit changes per work/education entry |
| **Preserve Markdown Formatting** | true | Keep **bold** and *italic* formatting |
| **Create Additional Skills Section** | true | Add "Core Competencies" section for low-priority terms |

## Output Structure

```json
{
  "resume": { /* Enhanced resume JSON */ },
  "modification_log": {
    "high_priority_processed": 3,
    "low_priority_added": 12,
    "lines_modified": 3,
    "sections_affected": ["work", "skills"]
  },
  "high_priority_keywords": 5,
  "low_priority_keywords": 15
}
```

## Usage in Langflow Pipeline

### Typical Flow:
1. **Job Posting Input** → **Keyword Extractor** → **Keywords Data**
2. **Resume JSON Input** + **Keywords Data** → **Resume Keyword Injector** → **Enhanced Resume**
3. **Enhanced Resume** → **DOCX Generator** / **Output Handler**

### Integration Points:
- **Input**: Connects to keyword extraction components and resume loaders
- **Output**: Feeds into resume generators, experiment loggers, or file outputs
- **Parallel**: Can run alongside cover letter generation workflows

## Example Transformation

**Before:**
```
"Built product vision, strategy, and roadmap for open knowledge ecosystem"
```

**After (with "healthcare technology platform" keyword):**
```
"Built healthcare technology platform-driven product vision, strategy, and roadmap for open knowledge ecosystem"
```

## Best Practices

### 🎯 **Keyword Selection**
- Use 5-10 high-priority keywords for quality injection
- Reserve 20+ low-priority keywords for skills section
- Prioritize exact job posting terminology

### ⚙️ **Configuration Tips**
- Set `max_modifications_per_section=1` for conservative approach
- Use `high_priority_threshold=8` for stricter high-priority filtering
- Enable `preserve_formatting` to maintain visual impact

### 🔍 **Quality Control**
- Review `modification_log` for injection effectiveness
- Monitor `lines_modified` to ensure natural integration
- Check `sections_affected` for balanced distribution

## Error Handling

The component includes robust error handling for:
- Invalid JSON inputs
- Missing resume sections
- Malformed keyword data
- Pattern matching failures

Errors return descriptive messages for easy debugging in Langflow.

## Advanced Usage

### Custom Pattern Rules
The component's pattern-based injection can be extended by modifying the `_attempt_keyword_injection` method to include domain-specific patterns for your industry.

### Integration with LLM Components
For even more sophisticated injection, the component can be chained with LLM components that provide natural language refinement of the pattern-based injections.

## Performance Notes

- **Speed**: Processes typical resume + 50 keywords in <2 seconds
- **Memory**: Lightweight, minimal memory footprint
- **Reliability**: Pattern-based approach ensures consistent, predictable results

---

*This component is designed to work seamlessly with existing resume generation pipelines and can be easily integrated into automated job application workflows.* 