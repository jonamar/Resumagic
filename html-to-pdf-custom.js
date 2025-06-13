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

  // Add simplified ATS-friendly CSS with minimal page break controls
  await page.addStyleTag({
    content: `
      /* Basic styling for ATS compatibility */
      body {
        font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif;
        font-size: 11pt;
        line-height: 1.5;
        color: #000;
        margin: 0;
        padding: 0;
      }

      /* Improve section spacing */
      section, .section {
        margin-bottom: 12px;
      }

      /* Reduce header spacing */
      h1, h2, h3, h4, h5, h6 {
        margin-top: 6px;
        margin-bottom: 4px;
      }
      
      /* Condense summary and work sections */
      .summary {
        margin-bottom: 10px;
      }
      
      /* Reduce margins for better space usage */
      hr {
        margin: 8px 0;
      }
      
      /* Optimize list spacing */
      ul {
        margin-top: 2px;
        margin-bottom: 2px;
        padding-left: 20px;
      }
      
      li {
        margin-bottom: 2px;
      }

      /* Simplify links */
      a {
        color: #000;
        text-decoration: none;
      }
      
      /* Hide icons for cleaner ATS parsing */
      .icon, .fa, .fab, .fas {
        display: none !important;
      }
      
      /* Ensure single column layout */
      #resume, .container, .wrapper, .main {
        width: 100% !important;
        max-width: 100% !important;
      }
    `
  });

  // Manipulate the DOM to condense content
  await page.evaluate(() => {
    // Remove unnecessary spacing elements
    document.querySelectorAll('br').forEach(br => {
      if (!br.nextSibling || br.nextSibling.nodeName === 'BR') {
        br.remove();
      }
    });
    
    // Add class to help identify and compact the content
    document.body.classList.add('compact-resume');
  });

  // Generate PDF with condensed margins
  console.log('Generating PDF...');
  await page.pdf({
    path: path.join(__dirname, 'resume-custom.pdf'),
    format: 'A4',
    printBackground: true,
    margin: {
      top: '0.3in',  // Reduced top margin
      right: '0.4in',
      bottom: '0.3in',  // Reduced bottom margin
      left: '0.4in'
    },
    displayHeaderFooter: false
  });

  // Clean up and exit
  await browser.close();
  console.log('PDF generation complete! Your resume-custom.pdf is ready.');
})().catch(err => {
  console.error('Error generating PDF:', err);
  process.exit(1);
});
