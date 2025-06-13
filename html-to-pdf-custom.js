const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

(async () => {
  // Check if the HTML file exists
  const htmlPath = path.join(__dirname, 'resume-custom.html');
  if (!fs.existsSync(htmlPath)) {
    console.error('Custom resume HTML file not found!');
    process.exit(1);
  }

  // Launch a headless browser
  console.log('Launching browser...');
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  // Load the HTML file
  console.log('Loading HTML file...');
  await page.goto(`file://${htmlPath}`, {
    waitUntil: 'networkidle0'
  });

  // Add extra ATS-friendly CSS to ensure clean formatting
  await page.addStyleTag({
    content: `
      /* Additional ATS optimization for PDF output */
      @page {
        margin: 0.5in;
      }
      body {
        font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif;
        font-size: 11pt;
        line-height: 1.5;
        color: #000;
      }
      /* Ensure proper spacing for ATS parsing */
      section {
        margin-bottom: 10px;
        page-break-inside: avoid;
      }
      /* Simplify links to plain text for ATS */
      a {
        color: #000;
        text-decoration: none;
      }
      /* Enhanced list formatting */
      ul {
        margin-top: 5px;
        padding-left: 20px;
      }
      li {
        margin-bottom: 3px;
      }
      /* Remove any decorative elements that could confuse ATS */
      .icon, .fa, .fab, .fas {
        display: none !important;
      }
      /* Ensure dates are properly separated in work entries */
      .date {
        font-weight: normal;
        white-space: nowrap;
      }
      h3, h4, h5, h6 {
        margin-top: 8px;
        margin-bottom: 5px;
      }
      /* Single column layout enforcement */
      .container, .wrapper, .main {
        width: 100% !important;
        max-width: 100% !important;
      }
    `
  });

  // Generate PDF
  console.log('Generating PDF...');
  await page.pdf({
    path: path.join(__dirname, 'resume-custom.pdf'),
    format: 'A4',
    printBackground: true,
    margin: {
      top: '0.4in',
      right: '0.4in',
      bottom: '0.4in',
      left: '0.4in'
    }
  });

  // Clean up and exit
  await browser.close();
  console.log('PDF generation complete! Your resume-custom.pdf is ready.');
})().catch(err => {
  console.error('Error generating PDF:', err);
  process.exit(1);
});
