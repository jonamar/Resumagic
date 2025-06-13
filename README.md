# Resumagic

Resumagic is a tool for generating ATS-friendly resumes in both HTML and PDF formats from a JSON Resume file.

## Project Overview

This tool converts a standard JSON Resume format into a clean, professional, ATS-friendly resume in both HTML and PDF formats. The focus is on creating resumes that:

- Are easily parsed by Applicant Tracking Systems (ATS)
- Present your information in a clean, professional format
- Have consistent styling across output formats
- Avoid common ATS parsing errors (like complex layouts or decorative elements)

## Project Structure

The project is organized into three main directories:

- **`input/`**: Contains your resume data in JSON format
- **`template/`**: Contains the HTML template used to generate your resume
- **`output/`**: Contains the generated HTML and PDF versions of your resume

## How to Use

### Prerequisites

- Node.js installed on your system
- Required NPM packages installed (run `npm install` to install them)

### Updating Your Resume

1. Edit the `input/resume.json` file with your personal information
2. Make sure dates are in ISO format (YYYY-MM-DD)
3. Run the generation script

### Generating Your Resume

To generate both HTML and PDF versions of your resume:

```bash
node generate-resume.js
```

This will:
1. Read your resume data from `input/resume.json`
2. Apply the HTML template from `template/custom-template.html`
3. Generate an HTML resume at `output/resume-generated.html`
4. Convert that HTML to a PDF at `output/resume-generated.pdf`

### Customizing Your Resume

To change how your resume looks:

1. Edit the `template/custom-template.html` file
   - Modify the HTML structure to change the layout
   - Change the CSS styles in the `<style>` section
2. Run the generation script again to see your changes

## Features

- **ATS-Friendly**: Uses semantic HTML and standard fonts
- **Single-Column Layout**: Ensures proper parsing by ATS systems
- **Clean Typography**: Optimized for both screen and print
- **Proper Page Breaks**: Avoids awkward splits between sections
- **ISO Date Formatting**: Correctly handles dates in the standard format

## Technical Details

The tool uses:
- Handlebars for templating
- Puppeteer for HTML-to-PDF conversion
- The JSON Resume schema for data structure

## Tips for ATS Optimization

- Keep all dates in ISO format (YYYY-MM-DD)
- Use standard section names like "Experience," "Education," etc.
- Include keywords from job descriptions in your resume content
- Use standard fonts and avoid decorative elements
- Test your final PDF with ATS scanners if possible
