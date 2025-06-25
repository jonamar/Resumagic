/**
 * DOCX resume template generator
 * Converts JSON resume data to DOCX format
 * Based on styling from visual-design-spec.md
 */

const { Document, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, 
        TableRow, TableCell, BorderStyle, WidthType, TableLayoutType, 
        UnderlineType, TableBorders, SectionType, PageBreak, LevelFormat,
        convertInchesToTwip, ExternalHyperlink } = require('docx');
const theme = require('./theme');
const { parseTextWithFormatting } = require('./markdown-parser');

/**
 * Creates formatted TextRun elements from text with markdown-style formatting
 * @param {string} text - Text with potential markdown formatting
 * @param {Object} baseStyle - Base styling to apply to all runs
 * @returns {Array} Array of TextRun elements
 */
function createFormattedTextRuns(text, baseStyle = {}) {
  const parsedParts = parseTextWithFormatting(text);
  
  return parsedParts.map(part => new TextRun({
    text: part.text,
    bold: part.bold,
    italics: part.italic,
    ...baseStyle
  }));
}

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

  // Add speaking engagements section if present
  if (resumeData.publications && resumeData.publications.length > 0) {
    children.push(...createSpeakingEngagements(resumeData.publications));
  }

  // Add languages section if present
  if (resumeData.languages && resumeData.languages.length > 0) {
    children.push(...createLanguages(resumeData.languages));
  }

  // Create the document with styles and the theme's margin settings
  const doc = new Document({
    numbering: {
      config: [
        {
          reference: "small-bullet",
          levels: [
            {
              level: 0,
              format: LevelFormat.BULLET,
              text: "•",
              alignment: AlignmentType.LEFT,
              style: {
                run: {
                  font: theme.fonts.primary,
                  size: 16, // 8pt bullet (smaller than default 10pt text)
                  color: theme.colors.text
                }
              }
            }
          ]
        }
      ]
    },
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
  
  // Add address first with ATS-friendly label (city, province abbreviation, postal code, country)
  if (basics.location) {
    let locationText = basics.location.city || '';
    
    // Add abbreviated region/province
    if (basics.location.region) {
      const regionAbbrev = getRegionAbbreviation(basics.location.region);
      locationText += `, ${regionAbbrev}`;
    }
    
    // Add country
    if (basics.location.country) {
      locationText += `, ${basics.location.country}`;
    }
    
    // Add postal code (with space before it, not comma)
    if (basics.location.postalCode) {
      locationText += ` ${basics.location.postalCode}`;
    }
    
    // Add "Address:" label for ATS recognition
    if (locationText) contactParts.push(`Address: ${locationText}`);
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
    const profileChildren = [];
    
    basics.profiles.forEach((profile, index) => {
      // Clean up the display text by removing protocol and www
      let displayText = profile.url
        .replace(/^https?:\/\//, '') // Remove http:// or https://
        .replace(/^www\./, '');       // Remove www.
      
      // Add the hyperlink
      profileChildren.push(
        new ExternalHyperlink({
          children: [
            new TextRun({
              text: displayText,
              size: theme.fontSize.meta * 2, // Convert to half-points
              color: theme.colors.dimText,
              font: theme.fonts.primary,
              underline: {
                type: UnderlineType.SINGLE,
                color: theme.colors.dimText
              }
            })
          ],
          link: profile.url
        })
      );
      
      // Add bullet separator if not the last item
      if (index < basics.profiles.length - 1) {
        profileChildren.push(
          new TextRun({
            text: ' • ',
            size: theme.fontSize.meta * 2,
            color: theme.colors.dimText,
            font: theme.fonts.primary
          })
        );
      }
    });
    
    paragraphs.push(
      new Paragraph({
        children: profileChildren,
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
      children: createFormattedTextRuns(basics.summary, {
        size: theme.fontSize.body * 2, // Convert to half-points
        font: theme.fonts.primary,
        color: theme.colors.text
      }),
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
            text: dateParts.join(' • '),
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
          children: createFormattedTextRuns(job.summary, {
            size: theme.fontSize.body * 2, // Convert to half-points
            font: theme.fonts.primary,
            color: theme.colors.text
          }),
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
            children: createFormattedTextRuns(highlight, {
              size: theme.fontSize.body * 2, // Convert to half-points
              font: theme.fonts.primary,
              color: theme.colors.text
            }),
            numbering: {
              reference: "small-bullet",
              level: 0
            },
            spacing: {
              after: 60 // 3pt - reduced spacing after bullets
            },
            indent: {
              left: 360, // 0.25 inch left indent for bullet
              hanging: 360 // 0.25 inch hanging indent so text aligns properly
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
          children: createFormattedTextRuns(skill.keywords.join(', '), {
            size: theme.fontSize.meta * 2, // Convert to half-points
            font: theme.fonts.primary,
            color: theme.colors.dimText
          }),
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
            text: dateParts.join(' • '),
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
          children: createFormattedTextRuns(project.description, {
            size: theme.fontSize.body * 2, // Convert to half-points
            font: theme.fonts.primary,
            color: theme.colors.text
          }),
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
            children: createFormattedTextRuns(highlight, {
              size: theme.fontSize.body * 2, // Convert to half-points
              font: theme.fonts.primary,
              color: theme.colors.text
            }),
            numbering: {
              reference: "small-bullet",
              level: 0
            },
            spacing: {
              after: 60 // 3pt - reduced spacing after bullets
            },
            indent: {
              left: 360, // 0.25 inch left indent for bullet
              hanging: 360 // 0.25 inch hanging indent so text aligns properly
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
 * Creates the speaking engagements section
 * @param {Array} publications - Array of publication/speaking entries
 * @returns {Array} Array of paragraphs for the speaking engagements section
 */
function createSpeakingEngagements(publications) {
  const paragraphs = [];

  // Add section heading
  paragraphs.push(
    createSectionHeading(theme.ats.sectionTitles.speakingEngagements)
  );

  // Add each speaking engagement
  publications.forEach((publication, index) => {
    // Determine if we should keep engagement name with next content
    const hasMoreContent = publication.summary || (publication.highlights && publication.highlights.length > 0);

    // Speaking engagement name/title
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: publication.name,
            size: theme.fontSize.body * 2, // Convert to half-points
            font: theme.fonts.primary,
            bold: true,
            color: theme.colors.text
          })
        ],
        spacing: {
          after: 60 // 3pt
        },
        keepNext: true // Keep with publisher
      })
    );

    // Publisher/venue
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: publication.publisher,
            size: theme.fontSize.body * 2, // Convert to half-points
            font: theme.fonts.primary,
            bold: true,
            color: theme.colors.text
          })
        ],
        spacing: {
          after: 60 // 3pt
        },
        keepNext: true // Keep with date
      })
    );

    // Date
    if (publication.releaseDate) {
      const isLastEntry = index === publications.length - 1;
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: formatDate(publication.releaseDate),
              size: theme.fontSize.meta * 2, // Convert to half-points
              font: theme.fonts.primary,
              color: theme.colors.dimText
            })
          ],
          spacing: {
            after: hasMoreContent ? 80 : (isLastEntry ? 120 : 240) // 4pt if more content, 6pt if last entry, 12pt between entries
          },
          keepNext: hasMoreContent // Keep with summary/highlights if they exist
        })
      );
    }

    // Summary if present
    if (publication.summary) {
      paragraphs.push(
        new Paragraph({
          children: createFormattedTextRuns(publication.summary, {
            size: theme.fontSize.body * 2, // Convert to half-points
            font: theme.fonts.primary,
            color: theme.colors.text
          }),
          spacing: {
            after: 120 // 6pt
          },
          keepLines: true, // Keep summary lines together
          keepNext: publication.highlights && publication.highlights.length > 0 // Keep with highlights if they exist
        })
      );
    }

    // Highlights as bullet points
    if (publication.highlights && publication.highlights.length > 0) {
      publication.highlights.forEach((highlight, highlightIndex) => {
        const isLastHighlight = highlightIndex === publication.highlights.length - 1;
        const isLastEntry = index === publications.length - 1;
        
        paragraphs.push(
          new Paragraph({
            children: createFormattedTextRuns(highlight, {
              size: theme.fontSize.body * 2, // Convert to half-points
              font: theme.fonts.primary,
              color: theme.colors.text
            }),
            numbering: {
              reference: "small-bullet",
              level: 0
            },
            spacing: {
              after: isLastHighlight ? (isLastEntry ? 120 : 240) : 60 // 3pt between bullets, 6pt after last entry, 12pt between entries
            },
            indent: {
              left: 360, // 0.25 inch left indent for bullet
              hanging: 360 // 0.25 inch hanging indent so text aligns properly
            },
            keepLines: true, // Keep long bullet points together
            keepNext: !isLastHighlight // Keep with next highlight (but not after the last one)
          })
        );
      });
    }
  });

  return paragraphs;
}

/**
 * Creates the Languages section
 * @param {Array} languages - Array of language objects from resume data
 * @returns {Array} Array of paragraphs for the languages section
 */
function createLanguages(languages) {
  const paragraphs = [];

  // Add section heading
  paragraphs.push(
    createSectionHeading(theme.ats.sectionTitles.languages)
  );

  // Create a simple list of languages with fluency levels
  languages.forEach((language, index) => {
    const languageText = language.fluency ? 
      `${language.language}: ${language.fluency}` : 
      language.language;
    
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: language.language,
            size: theme.fontSize.body * 2, // Convert to half-points
            font: theme.fonts.primary,
            bold: true,
            color: theme.colors.text
          }),
          ...(language.fluency ? [
            new TextRun({
              text: `: ${language.fluency}`,
              size: theme.fontSize.body * 2, // Convert to half-points
              font: theme.fonts.primary,
              color: theme.colors.text
            })
          ] : [])
        ],
        spacing: {
          after: index < languages.length - 1 ? 80 : 240 // 4pt between items, 12pt after section
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
    keepNext: true, // Prevent section headings from being orphaned on previous page
    // Border removed to eliminate unwanted underlines
  });
}

/**
 * Format date according to ATS best practices
 * @param {String} dateStr - Date string in various formats
 * @returns {String} Formatted date string (Month YYYY)
 */
function formatDate(dateStr) {
  if (!dateStr) return '';
  
  try {
    // Handle different input formats
    let parsedDate;
    
    // Format: "Sep 2022", "Jan 2021", etc.
    if (/^[A-Za-z]{3}\s\d{4}$/.test(dateStr)) {
      parsedDate = new Date(dateStr + ' 01'); // Add day for parsing
    }
    // Format: "2007-01", "2015-11", etc.
    else if (/^\d{4}-\d{2}$/.test(dateStr)) {
      parsedDate = new Date(dateStr + '-01'); // Add day for parsing
    }
    // Format: "2020", "2021", etc. (year only)
    else if (/^\d{4}$/.test(dateStr)) {
      return dateStr; // Return as-is for year-only dates
    }
    // Standard ISO format: "2020-01-15", etc.
    else {
      parsedDate = new Date(dateStr);
    }
    
    // Check if date parsing was successful
    if (isNaN(parsedDate.getTime())) {
      console.warn(`⚠️  Date parsing warning: Could not parse date "${dateStr}". Using original value.`);
      return dateStr;
    }
    
    // Format as Month YYYY (e.g., March 2019)
    const month = parsedDate.toLocaleString('en', { month: 'long' });
    const year = parsedDate.getFullYear();
    
    return `${month} ${year}`;
    
  } catch (error) {
    console.warn(`⚠️  Date parsing error: Failed to format date "${dateStr}". Error: ${error.message}. Using original value.`);
    return dateStr;
  }
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
