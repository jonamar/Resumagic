const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const Handlebars = require('handlebars');

// Get the resume data
const resumeData = require('../data/input/resume.json');

// Set up output file paths
const outputHtmlPath = path.join(__dirname, '../data/output', 'resume-generated.html');
const outputPdfPath = path.join(__dirname, '../data/output', 'resume-generated.pdf');

// Register Handlebars helpers
Handlebars.registerHelper('formatDate', function(dateString) {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  } catch (e) {
    return dateString; // Return the original string if parsing fails
  }
});

Handlebars.registerHelper('join', function(array) {
  return array ? array.join(', ') : '';
});

// Main function
(async () => {
  try {
    // Read the template file
    console.log('Reading template file...');
    const templatePath = path.join(__dirname, 'template', 'custom-template.html');
    const templateSource = fs.readFileSync(templatePath, 'utf8');
    
    // Compile the template
    console.log('Compiling template...');
    const template = Handlebars.compile(templateSource);
    
    // Process the template with resume data to generate HTML
    console.log('Generating HTML from template...');
    const html = template(resumeData);
    
    // Write the HTML to a file (permanent output)
    fs.writeFileSync(outputHtmlPath, html);
    console.log(`HTML resume generated and saved to: ${outputHtmlPath}`);
    
    // Convert HTML to PDF
    console.log('Launching browser for PDF conversion...');
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    
    // Load the HTML file we just created
    await page.goto(`file://${outputHtmlPath}`, { waitUntil: 'networkidle0' });
    
    // Generate PDF
    console.log('Generating PDF...');
    await page.pdf({
      path: outputPdfPath,
      format: 'A4',
      printBackground: true,
      margin: {
        top: '0.3in',
        right: '0.4in',
        bottom: '0.3in',
        left: '0.4in'
      },
      displayHeaderFooter: false
    });
    
    // Clean up
    await browser.close();
    
    console.log(`PDF generated successfully: ${outputPdfPath}`);
    console.log('Both HTML and PDF files have been created and preserved for inspection and editing.');
  } catch (error) {
    console.error('Error generating resume:', error);
    process.exit(1);
  }
})();
