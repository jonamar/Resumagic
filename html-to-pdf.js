const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

(async () => {
  // Check if the HTML file exists
  const htmlPath = path.join(__dirname, 'resume.html');
  if (!fs.existsSync(htmlPath)) {
    console.error('Resume HTML file not found!');
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
      body {
        font-family: Arial, Helvetica, sans-serif;
        line-height: 1.5;
        color: #000;
        margin: 0;
        padding: 20px;
      }
      h1, h2, h3, h4, h5, h6 {
        margin-top: 10px;
        margin-bottom: 10px;
        page-break-after: avoid;
      }
      section {
        margin-bottom: 15px;
        page-break-inside: avoid;
      }
      a {
        color: #000;
        text-decoration: none;
      }
      ul {
        padding-left: 20px;
      }
      li {
        margin-bottom: 5px;
      }
      .date {
        font-weight: normal;
      }
      /* Single column layout */
      .container {
        max-width: 100%;
        margin: 0;
        padding: 0;
      }
    `
  });

  // Generate PDF
  console.log('Generating PDF...');
  await page.pdf({
    path: path.join(__dirname, 'resume.pdf'),
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
  console.log('PDF generation complete! Your resume.pdf is ready.');
})().catch(err => {
  console.error('Error generating PDF:', err);
  process.exit(1);
});
