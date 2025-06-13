const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const resumeData = require('./resume-formatted.json');

// Define a simplified HTML template focused on avoiding page breaks
const generateHTML = (resume) => {
  const basics = resume.basics || {};
  const work = resume.work || [];
  const education = resume.education || [];
  const skills = resume.skills || [];
  
  return `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8">
      <title>${basics.name || 'Resume'}</title>
      <style>
        body {
          font-family: Arial, Helvetica, sans-serif;
          line-height: 1.5;
          color: #333;
          margin: 0;
          padding: 0;
          font-size: 11pt;
        }
        .container {
          max-width: 100%;
          margin: 0 auto;
          padding: 0;
        }
        h1, h2, h3, h4 {
          margin-top: 8px;
          margin-bottom: 4px;
          color: #000;
        }
        .header {
          margin-bottom: 10px;
        }
        .name {
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 0;
        }
        .contact {
          margin-bottom: 10px;
        }
        .section-title {
          margin-top: 12px;
          margin-bottom: 8px;
          font-size: 16px;
          border-bottom: 1px solid #ddd;
          padding-bottom: 3px;
        }
        .entry {
          margin-bottom: 10px;
        }
        .company, .institution {
          font-weight: bold;
        }
        .date {
          color: #666;
        }
        ul {
          padding-left: 20px;
          margin-top: 4px;
          margin-bottom: 4px;
        }
        li {
          margin-bottom: 2px;
        }
        a {
          color: #000;
          text-decoration: none;
        }
        .summary {
          margin-bottom: 10px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- HEADER -->
        <div class="header">
          <h1 class="name">${basics.name || ''}</h1>
          <div class="contact">
            ${basics.email ? `<span>${basics.email}</span> | ` : ''}
            ${basics.phone ? `<span>${basics.phone}</span> | ` : ''}
            ${basics.location ? `<span>${basics.location.city || ''}, ${basics.location.region || ''}</span>` : ''}
          </div>
          ${basics.profiles && basics.profiles.length > 0 ? 
            `<div class="profiles">
              ${basics.profiles.map(p => `<span>${p.network}: ${p.url || p.username}</span>`).join(' | ')}
            </div>` 
            : ''}
        </div>

        <!-- SUMMARY -->
        ${basics.summary ? 
          `<div class="section summary">
            <h2 class="section-title">Summary</h2>
            <p>${basics.summary}</p>
          </div>`
          : ''}

        <!-- WORK EXPERIENCE -->
        <div class="section work">
          <h2 class="section-title">Experience</h2>
          ${work.map(job => `
            <div class="entry">
              <div>
                <span class="company">${job.company || ''}</span>
                ${job.position ? ` - <span class="position">${job.position}</span>` : ''}
              </div>
              <div class="date">${formatDate(job.startDate)} - ${job.endDate ? formatDate(job.endDate) : 'Present'}</div>
              ${job.summary ? `<div>${job.summary}</div>` : ''}
              ${job.highlights && job.highlights.length > 0 ? 
                `<ul>
                  ${job.highlights.map(highlight => `<li>${highlight}</li>`).join('')}
                </ul>`
                : ''}
            </div>
          `).join('')}
        </div>

        <!-- SKILLS -->
        <div class="section skills">
          <h2 class="section-title">Skills</h2>
          ${skills.map(skill => `
            <div class="entry">
              <span class="skill-name">${skill.name || ''}</span>
              ${skill.keywords && skill.keywords.length > 0 ? 
                `: ${skill.keywords.join(', ')}`
                : ''}
            </div>
          `).join('')}
        </div>

        <!-- EDUCATION -->
        <div class="section education">
          <h2 class="section-title">Education</h2>
          ${education.map(edu => `
            <div class="entry">
              <div class="institution">${edu.institution || ''}</div>
              <div>${edu.area || ''} ${edu.studyType ? `- ${edu.studyType}` : ''}</div>
              <div class="date">${formatDate(edu.startDate)} - ${edu.endDate ? formatDate(edu.endDate) : 'Present'}</div>
            </div>
          `).join('')}
        </div>
      </div>
    </body>
  </html>
  `;
};

// Helper function to format dates
function formatDate(dateString) {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  } catch (e) {
    return dateString; // Return the original string if parsing fails
  }
}

// Main function
(async () => {
  const htmlContent = generateHTML(resumeData);
  
  // Write HTML to a temporary file
  const tempHtmlPath = path.join(__dirname, 'temp-direct.html');
  fs.writeFileSync(tempHtmlPath, htmlContent);
  
  console.log('Generated HTML template...');
  
  // Launch browser and convert to PDF
  console.log('Launching browser...');
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  // Load the HTML content
  await page.goto(`file://${tempHtmlPath}`, { waitUntil: 'networkidle0' });
  
  // Generate PDF with compact settings
  console.log('Generating PDF...');
  await page.pdf({
    path: path.join(__dirname, 'resume-direct.pdf'),
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
  fs.unlinkSync(tempHtmlPath); // Delete temporary HTML file
  
  console.log('PDF generated successfully: resume-direct.pdf');
})().catch(err => {
  console.error('Error generating PDF:', err);
  process.exit(1);
});
