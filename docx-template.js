/**
 * DOCX resume template generator
 * Converts JSON resume data to DOCX format
 * Based on styling from visual-design-spec.md
 */

const { Document, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, 
        TableRow, TableCell, BorderStyle, WidthType, TableLayoutType, 
        UnderlineType, TableBorders, SectionType, PageBreak } = require('docx');
const theme = require('./theme');

/**
 * Creates a DOCX document from resume JSON data
 * @param {Object} resumeData - Resume data in JSON Resume format
 * @param {Object} options - Additional options for resume generation
 * @returns {Document} DOCX document
 */
function createResumeDocx(resumeData, options = {}) {
  // Document sections
  const children = [
    ...createHeader(resumeData.basics),
    ...createSummary(resumeData.basics),
    ...createExperience(resumeData.work),
    ...createSkills(resumeData.skills),
    ...createEducation(resumeData.education),
  ];

  // Add projects section if present
  if (resumeData.projects && resumeData.projects.length > 0) {
    children.push(...createProjects(resumeData.projects));
  }

  // Create the document with styles and the theme's margin settings
  const doc = new Document({
    styles: {
      paragraphStyles: [
        {
          id: "applicantName",
          name: "Applicant Name",
          basedOn: "Normal",
          next: "Normal",
          run: {
            size: theme.fontSize.name * 2, // Convert to half-points
            font: "Arial",
            bold: true,
          },
          paragraph: {
            spacing: {
              after: 240, // 12pt
            },
          },
        },
      ],
      defaultRunProperties: {
        font: "Arial", // Set Arial as the default font for all runs
      },
    },
    sections: [{
      properties: {
        page: {
          margin: theme.margins.document,
        },
      },
      children: children
    }]
  });

  return doc;
}

/**
 * Creates the header section with name, contact info, and profiles
 * @param {Object} basics - Basic information
 * @returns {Array} Array of paragraphs for the header section
 */
function createHeader(basics) {
  const paragraphs = [];

  // Add name
  paragraphs.push(
    new Paragraph({
      text: basics.name,
      heading: HeadingLevel.HEADING_1,
      style: "applicantName",
      alignment: AlignmentType.LEFT,
      spacing: {
        after: 240, // 12pt
      },
      thematicBreak: false
    })
  );

  // Create contact information
  const contactParts = [];
  if (basics.email) contactParts.push(basics.email);
  if (basics.phone) contactParts.push(basics.phone);
  if (basics.location) {
    let locationText = basics.location.city;
    if (basics.location.region) locationText += `, ${basics.location.region}`;
    contactParts.push(locationText);
  }

  // Add contact info line
  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: contactParts.join(' | '),
          size: theme.fontSize.meta * 2, // Convert to half-points
          color: theme.colors.dimText,
          font: theme.fonts.primary
        })
      ],
      spacing: {
        after: 100 // 5pt
      }
    })
  );

  // Add profiles if any
  if (basics.profiles && basics.profiles.length > 0) {
    const profileParts = basics.profiles.map(profile => 
      `${profile.network}: ${profile.url}`
    );
    
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: profileParts.join(' | '),
            size: theme.fontSize.meta * 2, // Convert to half-points
            color: theme.colors.dimText,
            font: theme.fonts.primary
          })
        ],
        spacing: {
          after: 240 // 12pt
        }
      })
    );
  }

  return paragraphs;
}

/**
 * Creates the summary section
 * @param {Object} basics - Basic information containing summary
 * @returns {Array} Array of paragraphs for the summary section
 */
function createSummary(basics) {
  const paragraphs = [];

  if (!basics.summary) return paragraphs;

  // Add section heading
  paragraphs.push(
    createSectionHeading('Summary')
  );

  // Add summary text
  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: basics.summary,
          size: theme.fontSize.body * 2, // Convert to half-points
          font: theme.fonts.primary
        })
      ],
      spacing: {
        after: 240 // 12pt
      }
    })
  );

  return paragraphs;
}

/**
 * Creates the experience section
 * @param {Array} work - Array of work experiences
 * @returns {Array} Array of paragraphs for the experience section
 */
function createExperience(work) {
  const paragraphs = [];

  // Add section heading
  paragraphs.push(
    createSectionHeading(theme.ats.sectionTitles.experience)
  );

  // Add each work entry
  work.forEach(job => {
    // Position title
    if (job.position) {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: job.position,
              size: theme.fontSize.body * 2, // Convert to half-points
              font: theme.fonts.primary,
              bold: true
            })
          ],
          spacing: {
            after: 60 // 3pt
          }
        })
      );
    }

    // Company name
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: job.name,
            size: theme.fontSize.body * 2, // Convert to half-points
            font: theme.fonts.primary,
            bold: true
          })
        ],
        spacing: {
          after: 60 // 3pt
        }
      })
    );

    // Date and location
    const dateParts = [];
    dateParts.push(`${formatDate(job.startDate)} - ${job.endDate ? formatDate(job.endDate) : 'Present'}`);
    if (job.location) dateParts.push(job.location);

    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: dateParts.join(' · '),
            size: theme.fontSize.meta * 2, // Convert to half-points
            font: theme.fonts.primary,
            color: theme.colors.dimText
          })
        ],
        spacing: {
          after: 160, // 8pt
          before: 80  // 4pt
        }
      })
    );

    // Summary if present
    if (job.summary) {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: job.summary,
              size: theme.fontSize.body * 2, // Convert to half-points
              font: theme.fonts.primary
            })
          ],
          spacing: {
            after: 160 // 8pt
          }
        })
      );
    }

    // Highlights as bullet points
    if (job.highlights && job.highlights.length > 0) {
      job.highlights.forEach(highlight => {
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: highlight,
                size: theme.fontSize.body * 2, // Convert to half-points
                font: theme.fonts.primary
              })
            ],
            bullet: {
              level: 0
            },
            spacing: {
              after: 120 // 6pt
            }
          })
        );
      });
    }

    // Add some space after each job entry
    paragraphs.push(
      new Paragraph({
        text: "",
        spacing: {
          after: 240 // 12pt
        }
      })
    );
  });

  return paragraphs;
}

/**
 * Creates the skills section
 * @param {Array} skills - Array of skill categories
 * @returns {Array} Array of paragraphs for the skills section
 */
function createSkills(skills) {
  const paragraphs = [];

  // Add section heading
  paragraphs.push(
    createSectionHeading(theme.ats.sectionTitles.skills)
  );

  // Add each skill category
  skills.forEach(skill => {
    // Skill name
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: skill.name,
            size: theme.fontSize.body * 2, // Convert to half-points
            font: theme.fonts.primary,
            bold: true
          })
        ],
        spacing: {
          after: 60 // 3pt
        }
      })
    );

    // Keywords if present
    if (skill.keywords && skill.keywords.length > 0) {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: skill.keywords.join(', '),
              size: theme.fontSize.meta * 2, // Convert to half-points
              font: theme.fonts.primary,
              color: theme.colors.dimText
            })
          ],
          spacing: {
            after: 180 // 9pt
          }
        })
      );
    }
  });

  return paragraphs;
}

/**
 * Creates the education section
 * @param {Array} education - Array of education entries
 * @returns {Array} Array of paragraphs for the education section
 */
function createEducation(education) {
  const paragraphs = [];

  // Add section heading
  paragraphs.push(
    createSectionHeading(theme.ats.sectionTitles.education)
  );

  // Add each education entry
  education.forEach(edu => {
    // Degree
    let degreeText = edu.area;
    if (edu.studyType) degreeText += ` - ${edu.studyType}`;
    
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: degreeText,
            size: theme.fontSize.body * 2, // Convert to half-points
            font: theme.fonts.primary,
            bold: true
          })
        ],
        spacing: {
          after: 60 // 3pt
        }
      })
    );

    // Institution
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: edu.institution,
            size: theme.fontSize.body * 2, // Convert to half-points
            font: theme.fonts.primary,
            bold: true
          })
        ],
        spacing: {
          after: 60 // 3pt
        }
      })
    );

    // Date and location
    const dateParts = [];
    dateParts.push(`${formatDate(edu.startDate)} - ${edu.endDate ? formatDate(edu.endDate) : 'Present'}`);
    if (edu.location) dateParts.push(edu.location);

    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: dateParts.join(' · '),
            size: theme.fontSize.meta * 2, // Convert to half-points
            font: theme.fonts.primary,
            color: theme.colors.dimText
          })
        ],
        spacing: {
          after: 240 // 12pt
        }
      })
    );
  });

  return paragraphs;
}

/**
 * Creates the projects section
 * @param {Array} projects - Array of project entries
 * @returns {Array} Array of paragraphs for the projects section
 */
function createProjects(projects) {
  const paragraphs = [];

  // Add section heading
  paragraphs.push(
    createSectionHeading(theme.ats.sectionTitles.projects)
  );

  // Add each project entry
  projects.forEach(project => {
    // Project name
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: project.name,
            size: theme.fontSize.body * 2, // Convert to half-points
            font: theme.fonts.primary,
            bold: true
          })
        ],
        spacing: {
          after: 60 // 3pt
        }
      })
    );

    // Description if present
    if (project.description) {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: project.description,
              size: theme.fontSize.body * 2, // Convert to half-points
              font: theme.fonts.primary
            })
          ],
          spacing: {
            after: 120 // 6pt
          }
        })
      );
    }

    // Highlights as bullet points
    if (project.highlights && project.highlights.length > 0) {
      project.highlights.forEach(highlight => {
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: highlight,
                size: theme.fontSize.body * 2, // Convert to half-points
                font: theme.fonts.primary
              })
            ],
            bullet: {
              level: 0
            },
            spacing: {
              after: 120 // 6pt
            }
          })
        );
      });
    }

    // Add some space after each project entry
    paragraphs.push(
      new Paragraph({
        text: "",
        spacing: {
          after: 180 // 9pt
        }
      })
    );
  });

  return paragraphs;
}

/**
 * Helper function to create section headings
 * @param {String} title - Section title
 * @returns {Paragraph} Section heading paragraph
 */
function createSectionHeading(title) {
  return new Paragraph({
    children: [
      new TextRun({
        text: title.toUpperCase(),
        size: theme.fontSize.sectionHeading * 2, // Convert to half-points
        font: theme.fonts.primary,
        bold: true
      })
    ],
    heading: HeadingLevel.HEADING_2,
    spacing: {
      before: 400, // 20pt
      after: 120   // 6pt
    },
    border: {
      bottom: {
        color: theme.colors.dimText,
        size: 1,
        style: BorderStyle.SINGLE
      }
    }
  });
}

/**
 * Format date according to ATS best practices
 * @param {String} dateStr - Date string in ISO format (YYYY-MM-DD)
 * @returns {String} Formatted date string (MMM-YYYY)
 */
function formatDate(dateStr) {
  if (!dateStr) return '';
  
  // Parse the date
  const date = new Date(dateStr);
  
  // Format as MMM-YYYY (e.g., Jan-2022)
  const month = date.toLocaleString('en', { month: 'short' });
  const year = date.getFullYear();
  
  return `${month}-${year}`;
}

module.exports = { 
  createResumeDocx 
};
