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
            font: "Arial", // Set Arial as the default font for all runs
            bold: true,
            color: theme.colors.headings,
          },
          paragraph: {
            spacing: {
              after: 240, // 12pt
            },
            indent: {
              left: 0 // No indentation
            },
            font: "Arial", // Explicitly set font at paragraph level too
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

  // Create contact information with ATS-friendly format
  const contactParts = [];
  
  // Add location first (city, province abbreviation, postal code)
  if (basics.location) {
    let locationText = basics.location.city || '';
    
    // Add abbreviated region/province
    if (basics.location.region) {
      const regionAbbrev = getRegionAbbreviation(basics.location.region);
      locationText += `, ${regionAbbrev}`;
    }
    
    // Add postal code
    if (basics.location.postalCode) {
      locationText += ` ${basics.location.postalCode}`;
    }
    
    if (locationText) contactParts.push(locationText);
  }
  
  // Add phone and email
  if (basics.phone) contactParts.push(basics.phone);
  if (basics.email) contactParts.push(basics.email);

  // Add contact info line with bullet separators
  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: contactParts.join(' • '),
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
    const profileParts = basics.profiles.map(profile => profile.url);
    
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: profileParts.join(' • '),
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
          font: theme.fonts.primary,
          color: theme.colors.text
        })
      ],
      spacing: {
        after: 80 // 4pt
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
    // Position title with keepNext to stick to company
    if (job.position) {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: job.position,
              size: theme.fontSize.body * 2, // Convert to half-points
              font: theme.fonts.primary,
              bold: true,
              color: theme.colors.text
            })
          ],
          spacing: {
            after: 60 // 3pt
          },
          keepNext: true // Keep with next paragraph (company name)
        })
      );
    }

    // Company name with keepNext to stick to date/location
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: job.name,
            size: theme.fontSize.body * 2, // Convert to half-points
            font: theme.fonts.primary,
            bold: true,
            color: theme.colors.text
          })
        ],
        spacing: {
          after: 60 // 3pt
        },
        keepNext: true // Keep with next paragraph (date/location)
      })
    );

    // Date and location
    const dateParts = [];
    dateParts.push(`${formatDate(job.startDate)} - ${job.endDate ? formatDate(job.endDate) : 'Present'}`);
    if (job.location) dateParts.push(job.location);

    // Determine if we should keep with next content (summary or highlights)
    const hasMoreContent = job.summary || (job.highlights && job.highlights.length > 0);

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
          after: 80 // 4pt
        },
        keepNext: hasMoreContent // Keep with summary/highlights if they exist
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
              font: theme.fonts.primary,
              color: theme.colors.text
            })
          ],
          spacing: {
            after: 80 // 4pt
          },
          keepLines: true, // Keep summary lines together
          keepNext: job.highlights && job.highlights.length > 0 // Keep with highlights if they exist
        })
      );
    }

    // Highlights as bullet points
    if (job.highlights && job.highlights.length > 0) {
      job.highlights.forEach((highlight, highlightIndex) => {
        const isLastHighlight = highlightIndex === job.highlights.length - 1;
        
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: "\u2022 ", // Unicode U+2022 bullet point with space
                size: 20, // Use normal size for bullet (10pt converted to half-points)
                font: theme.fonts.primary,
                color: theme.colors.text
              }),
              new TextRun({
                text: highlight,
                size: theme.fontSize.body * 2, // Convert to half-points
                font: theme.fonts.primary,
                color: theme.colors.text
              })
            ],
            bullet: false, // Disable default bullet
            
            spacing: {
              after: 60 // 3pt - reduced spacing after bullets
            },
            indent: {
              left: 0 // No indentation
            },
            keepLines: true, // Keep long bullet points together
            keepNext: !isLastHighlight // Keep with next highlight (but not after the last one)
          })
        );
      });
    }

    // Add minimal space after each job entry
    paragraphs.push(
      new Paragraph({
        text: "",
        spacing: {
          after: 80 // 4pt
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
            bold: true,
            color: theme.colors.text
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
            bold: true,
            color: theme.colors.text
          })
        ],
        spacing: {
          after: 60 // 3pt
        },
        keepNext: true // Keep with institution
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
            bold: true,
            color: theme.colors.text
          })
        ],
        spacing: {
          after: 60 // 3pt
        },
        keepNext: true // Keep with date/location
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
    // Determine if we should keep project name with next content
    const hasMoreContent = project.description || (project.highlights && project.highlights.length > 0);

    // Project name
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: project.name,
            size: theme.fontSize.body * 2, // Convert to half-points
            font: theme.fonts.primary,
            bold: true,
            color: theme.colors.text
          })
        ],
        spacing: {
          after: 60 // 3pt
        },
        keepNext: hasMoreContent // Keep with description/highlights if they exist
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
              font: theme.fonts.primary,
              color: theme.colors.text
            })
          ],
          spacing: {
            after: 120 // 6pt
          },
          keepLines: true, // Keep description lines together
          keepNext: project.highlights && project.highlights.length > 0 // Keep with highlights if they exist
        })
      );
    }

    // Highlights as bullet points
    if (project.highlights && project.highlights.length > 0) {
      project.highlights.forEach((highlight, highlightIndex) => {
        const isLastHighlight = highlightIndex === project.highlights.length - 1;
        
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: "\u2022 ", // Unicode U+2022 bullet point with space
                size: 20, // Use normal size for bullet (10pt converted to half-points)
                font: theme.fonts.primary,
                color: theme.colors.text
              }),
              new TextRun({
                text: highlight,
                size: theme.fontSize.body * 2, // Convert to half-points
                font: theme.fonts.primary,
                color: theme.colors.text
              })
            ],
            bullet: false, // Disable default bullet
            
            spacing: {
              after: 60 // 3pt - reduced spacing after bullets
            },
            indent: {
              left: 0 // No indentation
            },
            keepLines: true, // Keep long bullet points together
            keepNext: !isLastHighlight // Keep with next highlight (but not after the last one)
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
        font: "Arial", // Set Arial as the default font for all runs
        color: theme.colors.headings,
        bold: true
      })
    ],
    heading: HeadingLevel.HEADING_2,
    spacing: {
      before: 400, // 20pt
      after: 120   // 6pt
    },
    // Border removed to eliminate unwanted underlines
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

/**
 * Get standard abbreviation for region/province/state names
 * @param {String} region - Full region name
 * @returns {String} Abbreviated region code
 */
function getRegionAbbreviation(region) {
  // Canadian provinces and territories
  const canadianProvinces = {
    'Alberta': 'AB',
    'British Columbia': 'BC',
    'Manitoba': 'MB',
    'New Brunswick': 'NB',
    'Newfoundland and Labrador': 'NL',
    'Northwest Territories': 'NT',
    'Nova Scotia': 'NS',
    'Nunavut': 'NU',
    'Ontario': 'ON',
    'Prince Edward Island': 'PE',
    'Quebec': 'QC',
    'Québec': 'QC',
    'Saskatchewan': 'SK',
    'Yukon': 'YT'
  };
  
  // US states (common ones)
  const usStates = {
    'California': 'CA',
    'New York': 'NY',
    'Texas': 'TX',
    'Florida': 'FL',
    'Illinois': 'IL',
    'Pennsylvania': 'PA',
    'Ohio': 'OH',
    'Georgia': 'GA',
    'North Carolina': 'NC',
    'Michigan': 'MI',
    'New Jersey': 'NJ',
    'Virginia': 'VA',
    'Washington': 'WA',
    'Arizona': 'AZ',
    'Massachusetts': 'MA',
    'Indiana': 'IN',
    'Tennessee': 'TN',
    'Missouri': 'MO',
    'Maryland': 'MD',
    'Wisconsin': 'WI',
    'Colorado': 'CO',
    'Minnesota': 'MN',
    'South Carolina': 'SC',
    'Alabama': 'AL',
    'Louisiana': 'LA',
    'Kentucky': 'KY',
    'Oregon': 'OR',
    'Oklahoma': 'OK',
    'Connecticut': 'CT',
    'Utah': 'UT',
    'Iowa': 'IA',
    'Nevada': 'NV',
    'Arkansas': 'AR',
    'Mississippi': 'MS',
    'Kansas': 'KS',
    'New Mexico': 'NM',
    'Nebraska': 'NE',
    'West Virginia': 'WV',
    'Idaho': 'ID',
    'Hawaii': 'HI',
    'New Hampshire': 'NH',
    'Maine': 'ME',
    'Montana': 'MT',
    'Rhode Island': 'RI',
    'Delaware': 'DE',
    'South Dakota': 'SD',
    'North Dakota': 'ND',
    'Alaska': 'AK',
    'District of Columbia': 'DC',
    'Vermont': 'VT',
    'Wyoming': 'WY'
  };
  
  // Check Canadian provinces first, then US states
  return canadianProvinces[region] || usStates[region] || region;
}

module.exports = { 
  createResumeDocx 
};
