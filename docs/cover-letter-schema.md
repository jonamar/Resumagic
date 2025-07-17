# Cover Letter JSON Schema

## Overview
This document defines the extended JSON Resume schema that includes cover letter data alongside existing resume information. The schema maintains backward compatibility while adding cover letter generation capabilities.

## Schema Structure

### Complete Schema Example
```json
{
  "basics": {
    "name": "Jon Amar",
    "label": "Senior Product Leader",
    "email": "jonamar@gmail.com",
    "phone": "438-519-0921",
    "location": {
      "city": "Montréal",
      "region": "Québec",
      "country": "Canada"
    }
  },
  "work": [
    // ... existing work experience
  ],
  "education": [
    // ... existing education
  ],
  "skills": [
    // ... existing skills
  ],
  "coverLetter": {
    "content": "Dear Hiring Manager,

I am writing to express my strong interest in the **Senior Product Manager** position at Tech Corp. With over 10 years of product leadership experience and a proven track record of scaling platforms, I am excited about the opportunity to contribute to your team's continued success.

In my current role at *Wikimedia Germany*, I have successfully led platform strategy for Wikibase Suite, overseeing 104 institutional deployments and driving $20M CAD in ARR-equivalent value. My experience in scaling cross-functional teams and launching products that serve millions of users aligns perfectly with your requirements.

Thank you for considering my application. I look forward to discussing how my experience can contribute to your team's success.",
    "jobTitle": "Senior Product Manager",
    "company": "Tech Corp",
    "hiringManager": "Sarah Johnson",
    "referenceSource": "LinkedIn job posting",
    "date": "2024-01-15",
    "customClosing": "Best regards"
  }
}
```

## Cover Letter Schema Details

### Required Fields

#### `content` (string, required)
The main body text of the cover letter. Uses smart parsing to automatically convert line breaks into proper paragraph formatting. Supports basic markdown formatting (**bold**, *italic*) within the content.

**Smart Parser Rules:**
- Double line breaks (`\n\n`) automatically create new paragraphs
- Single line breaks (`\n`) create line breaks within paragraphs
- Markdown formatting preserved (`**bold**`, `*italic*`)
- Copy/paste friendly - paste from anywhere!

**Example:**
```json
"content": "Dear Hiring Manager,

I am writing to express my strong interest in the **Senior Product Manager** position at Tech Corp. With over 10 years of product leadership experience, I am excited about this opportunity.

Thank you for considering my application. I look forward to discussing how my experience can contribute to your team's success."
```

#### `jobTitle` (string, required)
The title of the position being applied for.

**Example:**
```json
"jobTitle": "Senior Product Manager"
```

#### `company` (string, required)
The name of the company or organization.

**Example:**
```json
"company": "Tech Corp"
```

### Optional Fields

#### `hiringManager` (string, optional)
The name of the hiring manager or contact person. If provided, will be used in the salutation.

**Example:**
```json
"hiringManager": "Sarah Johnson"
```

**Impact on output:**
- With hiringManager: "Dear Sarah Johnson,"
- Without: "Dear Hiring Manager,"

#### `referenceSource` (string, optional)
How you learned about the position. Can be displayed in the letter content or used for tracking.

**Example:**
```json
"referenceSource": "LinkedIn job posting"
```

#### `date` (string, optional)
The date for the cover letter. If not provided, will auto-generate current date.

**Format:** ISO date string (YYYY-MM-DD)

**Example:**
```json
"date": "2024-01-15"
```

#### `customClosing` (string, optional)
Custom closing phrase. Defaults to "Sincerely" if not provided.

**Example:**
```json
"customClosing": "Best regards"
```

**Common options:**
- "Sincerely" (default)
- "Best regards"
- "Kind regards"
- "Respectfully"

## Header/Footer Data Sources

The cover letter will automatically pull contact information from the existing `basics` section:

### From `basics` Section
- **Name**: `basics.name`
- **Email**: `basics.email`
- **Phone**: `basics.phone`
- **Location**: `basics.location.city`, `basics.location.region`, `basics.location.country`

### Generated Elements
- **Date**: `coverLetter.date` or auto-generated current date
- **Signature**: `basics.name` with space for handwritten signature

## Content Formatting

### Markdown Support
The content field supports basic markdown formatting:

```json
"content": "I have **10 years of experience** in product management, including *extensive work* with ***agile methodologies***."
```

### Paragraph Structure
Recommended structure for professional cover letters:

1. **Opening paragraph**: Greeting and position interest
2. **Body paragraph(s)**: Relevant experience and qualifications  
3. **Closing paragraph**: Call to action and thanks

```json
"content": "Dear Hiring Manager,

I am writing to express my strong interest in the [Job Title] position at [Company]. With over X years of experience in [relevant field], I am excited about the opportunity to contribute to your team.

In my current role at [Current Company], I have successfully [specific achievement that relates to the job]. My experience in [relevant skill/area] aligns perfectly with your requirements for [specific requirement from job posting].

Thank you for considering my application. I look forward to discussing how my experience can contribute to your team's success."
```

**Copy/Paste Workflow:**
1. Write or copy cover letter content from anywhere
2. Paste into the `content` field
3. Add double line breaks between paragraphs if needed
4. Run generation command
5. Get perfectly formatted DOCX output!

## Validation Rules

### Required Field Validation
- `content`: Must be non-empty string
- `jobTitle`: Must be non-empty string  
- `company`: Must be non-empty string

### Optional Field Validation
- `date`: Must be valid ISO date format (YYYY-MM-DD) if provided
- `hiringManager`: Must be non-empty string if provided
- `referenceSource`: Must be non-empty string if provided
- `customClosing`: Must be non-empty string if provided

### Content Guidelines
- **Minimum length**: 200 characters (roughly 2-3 paragraphs)
- **Maximum length**: 2000 characters (roughly 1 page)
- **Paragraph separation**: Use double line breaks (`\n\n`) between paragraphs
- **Formatting**: Smart parser handles automatic paragraph creation and spacing

## Migration from Existing Data

### Backward Compatibility
Existing resume JSON files will continue to work unchanged. The `coverLetter` section is completely optional.

### Adding Cover Letter Data
To add cover letter capability to existing files:

1. **Add the coverLetter section** to your JSON file
2. **Populate required fields** (content, jobTitle, company)
3. **Add optional fields** as needed
4. **Test generation** with `--cover-letter` flag

### Example Migration
```json
// Before (existing resume.json)
{
  "basics": { /* ... */ },
  "work": [ /* ... */ ]
}

// After (extended resume.json)
{
  "basics": { /* ... */ },
  "work": [ /* ... */ ],
  "coverLetter": {
    "content": "Dear Hiring Manager,

I am writing to express my interest in the Product Manager position at Example Corp. With my background in product leadership and proven track record of success...

Thank you for your consideration.",
    "jobTitle": "Product Manager",
    "company": "Example Corp"
  }
}
```

## File Naming Convention

### Input Files
- `relay.json` (extended with cover letter data)
- `pointclick-resume.json` (extended with cover letter data)
- `resume.json` (extended with cover letter data)

### Output Files
- **Resume Only**: `relay.docx` (legacy mode, no flags)
- **Cover Letter Only**: `relay-cover-letter.docx` (with `--cover-letter` flag)
- **Both Files**: `relay-resume.docx` + `relay-cover-letter.docx` (with `--both` or `--auto` flags)

## Error Handling

### Missing Required Fields
```json
{
  "error": "Missing required field: content",
  "field": "coverLetter.content",
  "message": "Cover letter content is required"
}
```

### Invalid Date Format
```json
{
  "error": "Invalid date format",
  "field": "coverLetter.date",
  "expected": "YYYY-MM-DD",
  "received": "01/15/2024"
}
```

### Missing Cover Letter Section
```json
{
  "error": "Cover letter section not found",
  "message": "Add 'coverLetter' section to JSON file or use resume generation instead"
}
```

---

*This schema provides a foundation for professional, ATS-friendly cover letter generation while maintaining full compatibility with existing resume data.* 