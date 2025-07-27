/**
 * DOCX resume template generator
 * Converts JSON resume data to DOCX format
 * Based on styling from visual-design-spec.md
 */

import { Document, Paragraph, TextRun, HeadingLevel, AlignmentType, Table as _Table, 
  TableRow as _TableRow, TableCell as _TableCell, BorderStyle as _BorderStyle, WidthType as _WidthType, TableLayoutType as _TableLayoutType, 
  UnderlineType, TableBorders as _TableBorders, SectionType, PageBreak as _PageBreak, LevelFormat,
  convertInchesToTwip as _convertInchesToTwip, ExternalHyperlink } from 'docx';
import theme from '../theme.js';
import { createFormattedTextRuns } from './formatting/text-formatting.js';
import { formatDate, getRegionAbbreviation } from './formatting/date-utilities.js';
import { createItemSection, createSectionHeading } from './formatting/section-utilities.js';


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
          reference: 'small-bullet',
          levels: [
            {
              level: 0,
              format: LevelFormat.BULLET,
              text: '•',
              alignment: AlignmentType.LEFT,
              style: {
                run: {
                  font: theme.fonts.primary,
                  size: 16, // 8pt bullet (smaller than default 10pt text)
                  color: theme.colors.text,
                },
              },
            },
          ],
        },
      ],
    },
    styles: {
      paragraphStyles: [
        {
          id: 'applicantName',
          name: 'Applicant Name',
          basedOn: 'Normal',
          next: 'Normal',
          run: {
            size: theme.fontSize.name * 2, // Convert to half-points
            font: 'Arial', // Set Arial as the default font for all runs
            bold: true,
            color: theme.colors.headings,
          },
          paragraph: {
            spacing: {
              after: theme.spacingTwips.afterHeader, // 12pt
            },
            indent: {
              left: 0, // No indentation
            },
            font: 'Arial', // Explicitly set font at paragraph level too
          },
        },
      ],
      defaultRunProperties: {
        font: 'Arial', // Set Arial as the default font for all runs
      },
    },
    sections: [{
      properties: {
        page: {
          margin: theme.margins.document,
        },
      },
      children: children,
    }],
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
      style: 'applicantName',
      alignment: AlignmentType.LEFT,
      spacing: {
        after: theme.spacingTwips.afterHeader, // 12pt
      },
      thematicBreak: false,
    }),
  );

  // Create contact information with ATS-friendly format
  const contactParts = [];
  
  // Add address first with ATS-friendly label (city, province abbreviation, country)
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
    
    // Add "Address:" label for ATS recognition
    if (locationText) {
      contactParts.push(`Address: ${locationText}`);
    }
  }
  
  // Add phone and email
  if (basics.phone) {
    contactParts.push(basics.phone);
  }
  if (basics.email) {
    contactParts.push(basics.email);
  }

  // Add contact info line with bullet separators
  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: contactParts.join(' • '),
          size: theme.fontSize.meta * 2, // Convert to half-points
          color: theme.colors.dimText,
          font: theme.fonts.primary,
        }),
      ],
      spacing: {
        after: theme.spacingTwips.afterContact, // 5pt
      },
    }),
  );

  // Add profiles if any
  if (basics.profiles && basics.profiles.length > 0) {
    const profileChildren = [];
    
    basics.profiles.forEach((profile, index) => {
      // Clean up the display text by removing protocol and www
      const displayText = profile.url
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
                color: theme.colors.dimText,
              },
            }),
          ],
          link: profile.url,
        }),
      );
      
      // Add bullet separator if not the last item
      if (index < basics.profiles.length - 1) {
        profileChildren.push(
          new TextRun({
            text: ' • ',
            size: theme.fontSize.meta * 2,
            color: theme.colors.dimText,
            font: theme.fonts.primary,
          }),
        );
      }
    });
    
    paragraphs.push(
      new Paragraph({
        children: profileChildren,
        spacing: {
          after: theme.spacingTwips.afterHeader, // 12pt
        },
      }),
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

  if (!basics.summary) {
    return paragraphs;
  }

  // Add section heading
  paragraphs.push(
    createSectionHeading('Summary'),
  );

  // Add summary text
  paragraphs.push(
    new Paragraph({
      children: createFormattedTextRuns(basics.summary, {
        size: theme.fontSize.body * 2, // Convert to half-points
        font: theme.fonts.primary,
        color: theme.colors.text,
      }),
      spacing: {
        after: theme.spacingTwips.afterSummary, // 4pt
      },
    }),
  );

  return paragraphs;
}

/**
 * Creates the experience section using the generic createItemSection function
 * @param {Array} work - Array of work experiences
 * @returns {Array} Array of paragraphs for the experience section
 */
function createExperience(work) {
  const experienceConfig = {
    sectionTitle: theme.ats.sectionTitles.experience,
    descriptionField: 'summary',
    highlightsField: 'highlights',
    descriptionSpacing: theme.spacingTwips.afterSummary, // 4pt
    headerLines: [
      {
        // Job title/position
        field: 'position',
        spacing: theme.spacingTwips.afterJobTitle,
        keepNext: true,
      },
      {
        // Company name
        field: 'name',
        spacing: theme.spacingTwips.afterCompanyName,
        keepNext: true,
      },
      {
        // Date and location
        fields: [
          { field: 'startDate', format: formatDate },
          { field: 'endDate', format: (date) => date ? formatDate(date) : 'Present' },
        ],
        includeLocation: true,
        separator: ' - ',
        locationSeparator: ' • ',
        fontSize: theme.fontSize.meta,
        color: theme.colors.dimText,
        bold: false,
        conditionalSpacing: {
          withContent: theme.spacingTwips.minimal, // 1pt if more content
          standalone: theme.spacingTwips.afterDate,   // 4pt if standalone
        },
      },
    ],
    itemSpacing: theme.spacingTwips.afterJobEntry, // 4pt after each job entry
  };

  return createItemSection(work, experienceConfig);
}

/**
 * Creates the skills section
 * @param {Array} skills - Array of skill categories
 * @returns {Array} Array of paragraphs for the skills section
 */
function createSkills(skills) {
  const paragraphs = [];

  // Add section heading with page break
  paragraphs.push(
    createSectionHeading(theme.ats.sectionTitles.skills, true),
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
            color: theme.colors.text,
          }),
        ],
        spacing: {
          after: theme.spacingTwips.afterJobTitle, // 3pt
          line: theme.spacingTwips.resumeLine,
        },
      }),
    );

    // Keywords if present
    if (skill.keywords && skill.keywords.length > 0) {
      paragraphs.push(
        new Paragraph({
          children: createFormattedTextRuns(skill.keywords.join(', '), {
            size: theme.fontSize.meta * 2, // Convert to half-points
            font: theme.fonts.primary,
            color: theme.colors.dimText,
          }),
          spacing: {
            after: theme.spacingTwips.xlarge, // 9pt
            line: theme.spacingTwips.resumeLine,
          },
        }),
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
    createSectionHeading(theme.ats.sectionTitles.education),
  );

  // Add each education entry
  education.forEach(edu => {
    // Degree
    let degreeText = edu.area;
    if (edu.studyType) {
      degreeText += ` - ${edu.studyType}`;
    }
    
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: degreeText,
            size: theme.fontSize.body * 2, // Convert to half-points
            font: theme.fonts.primary,
            bold: true,
            color: theme.colors.text,
          }),
        ],
        spacing: {
          after: theme.spacingTwips.afterJobTitle, // 3pt
          line: theme.spacingTwips.resumeLine,
        },
        keepNext: true, // Keep with institution
      }),
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
            color: theme.colors.text,
          }),
        ],
        spacing: {
          after: theme.spacingTwips.afterCompanyName, // 3pt
          line: theme.spacingTwips.resumeLine,
        },
        keepNext: true, // Keep with date/location
      }),
    );

    // Date and location
    const dateParts = [];
    dateParts.push(`${formatDate(edu.startDate)} - ${edu.endDate ? formatDate(edu.endDate) : 'Present'}`);
    if (edu.location) {
      dateParts.push(edu.location);
    }

    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: dateParts.join(' • '),
            size: theme.fontSize.meta * 2, // Convert to half-points
            font: theme.fonts.primary,
            color: theme.colors.dimText,
          }),
        ],
        spacing: {
          after: theme.spacingTwips.afterSectionEntry, // 12pt
        },
      }),
    );
  });

  return paragraphs;
}

/**
 * Creates the projects section using the generic createItemSection function
 * @param {Array} projects - Array of project entries
 * @returns {Array} Array of paragraphs for the projects section
 */
function createProjects(projects) {
  const projectsConfig = {
    sectionTitle: theme.ats.sectionTitles.projects,
    descriptionField: 'description',
    highlightsField: 'highlights',
    descriptionSpacing: theme.spacingTwips.large, // 6pt
    headerLines: [
      {
        // Project name
        field: 'name',
        spacing: theme.spacingTwips.afterJobTitle, // 3pt
        keepNext: true,
      },
    ],
    itemSpacing: theme.spacingTwips.afterProjectEntry, // 9pt after each project entry
  };

  return createItemSection(projects, projectsConfig);
}

/**
 * Creates the speaking engagements section using the generic createItemSection function
 * @param {Array} publications - Array of publication/speaking entries
 * @returns {Array} Array of paragraphs for the speaking engagements section
 */
function createSpeakingEngagements(publications) {
  const speakingConfig = {
    sectionTitle: theme.ats.sectionTitles.speakingEngagements,
    descriptionField: 'summary',
    highlightsField: 'highlights',
    descriptionSpacing: theme.spacingTwips.large, // 6pt
    headerLines: [
      {
        // Speaking engagement name/title
        field: 'name',
        spacing: theme.spacingTwips.afterJobTitle, // 3pt
        keepNext: true,
      },
      {
        // Publisher/venue
        field: 'publisher',
        spacing: theme.spacingTwips.afterCompanyName, // 3pt
        keepNext: true,
      },
      {
        // Date
        field: 'releaseDate',
        format: formatDate,
        fontSize: theme.fontSize.meta,
        color: theme.colors.dimText,
        bold: false,
        conditionalSpacing: {
          withContent: theme.spacingTwips.afterDate, // 4pt if more content
          standalone: (isLastItem) => isLastItem ? theme.spacingTwips.large : theme.spacingTwips.afterSectionEntry, // 6pt if last entry, 12pt between entries
        },
      },
    ],
    // Complex highlight spacing for speaking engagements
    highlightSpacing: (isLastItem, itemIndex) => {
      return isLastItem ? theme.spacingTwips.large : theme.spacingTwips.afterSectionEntry; // 6pt after last entry, 12pt between entries
    },
    // No itemSpacing - speaking engagements don't add extra space after each entry
  };

  return createItemSection(publications, speakingConfig);
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
    createSectionHeading(theme.ats.sectionTitles.languages),
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
            color: theme.colors.text,
          }),
          ...(language.fluency ? [
            new TextRun({
              text: `: ${language.fluency}`,
              size: theme.fontSize.body * 2, // Convert to half-points
              font: theme.fonts.primary,
              color: theme.colors.text,
            }),
          ] : []),
        ],
        spacing: {
          after: index < languages.length - 1 ? 80 : 240, // 4pt between items, 12pt after section
        },
      }),
    );
  });

  return paragraphs;
}



/**
 * Creates a DOCX cover letter document from transformed markdown data
 * @param {Object} coverLetterData - Cover letter data with basics and coverLetter sections
 * @param {Object} options - Additional options for cover letter generation
 * @returns {Document} DOCX document
 */
function createCoverLetterDocx(coverLetterData, options = {}) {
  // Document sections (no header for cover letter)
  const children = [
    ...createCoverLetterDate(coverLetterData.coverLetter.metadata),
    ...createCoverLetterContent(coverLetterData.coverLetter.content),
    ...createCoverLetterClosing(coverLetterData.coverLetter.metadata),
    ...createCoverLetterFooter(coverLetterData.basics),
  ];

  // Create the document with identical styling to resume
  const doc = new Document({
    numbering: {
      config: [
        {
          reference: 'small-bullet',
          levels: [
            {
              level: 0,
              format: LevelFormat.BULLET,
              text: '•',
              alignment: AlignmentType.LEFT,
              style: {
                run: {
                  font: theme.fonts.primary,
                  size: 16, // 8pt bullet (smaller than default 10pt text)
                  color: theme.colors.text,
                },
              },
            },
          ],
        },
      ],
    },
    styles: {
      paragraphStyles: [
        {
          id: 'applicantName',
          name: 'Applicant Name',
          basedOn: 'Normal',
          next: 'Normal',
          run: {
            size: theme.fontSize.name * 2, // Convert to half-points
            font: 'Arial', // Set Arial as the default font for all runs
            bold: true,
            color: theme.colors.headings,
          },
          paragraph: {
            spacing: {
              after: theme.spacingTwips.afterHeader, // 12pt
            },
            indent: {
              left: 0, // No indentation
            },
            font: 'Arial', // Explicitly set font at paragraph level too
          },
        },
      ],
      defaultRunProperties: {
        font: 'Arial', // Set Arial as the default font for all runs
      },
    },
    sections: [{
      properties: {
        page: {
          margin: theme.margins.document,
        },
      },
      children: children,
    }],
  });

  return doc;
}

/**
 * Creates the date section for cover letter
 * @param {Object} metadata - Cover letter metadata
 * @returns {Array} Array of paragraphs for the date section
 */
function createCoverLetterDate(metadata) {
  const paragraphs = [];
  
  // Format the date
  const formattedDate = formatDate(metadata.date);
  
  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: formattedDate,
          size: theme.fontSize.body * 2, // Convert to half-points
          font: theme.fonts.primary,
          color: theme.colors.text,
        }),
      ],
      spacing: {
        before: theme.spacingTwips.beforeDate, // 12pt breathing room before
        after: theme.spacingTwips.afterDate,   // 24pt breathing room after
      },
      alignment: AlignmentType.RIGHT,
    }),
  );
  
  return paragraphs;
}

/**
 * Creates the main content section for cover letter
 * @param {Array} content - Array of content paragraphs and lists
 * @returns {Array} Array of paragraphs for the content section
 */
function createCoverLetterContent(content) {
  const paragraphs = [];
  
  content.forEach((section, index) => {
    if (section.type === 'paragraph') {
      // Handle paragraph content
      const textRuns = [];
      
      section.text.forEach(textPart => {
        textRuns.push(new TextRun({
          text: textPart.text,
          size: theme.fontSize.body * 2, // Convert to half-points
          font: theme.fonts.primary,
          color: theme.colors.text,
          bold: textPart.bold || false,
          italics: textPart.italic || false,
        }));
      });
      
      paragraphs.push(
        new Paragraph({
          children: textRuns,
          spacing: {
            after: theme.spacingTwips.coverLetterParagraph, // 12pt between paragraphs
            line: theme.spacingTwips.oneAndHalfLine,   // 1.5 line spacing (240 = 1.0, 360 = 1.5)
          },
          alignment: AlignmentType.JUSTIFIED,
        }),
      );
      
    } else if (section.type === 'list') {
      // Handle bullet list content
      section.items.forEach((item, itemIndex) => {
        const textRuns = [];
        
        item.forEach(textPart => {
          textRuns.push(new TextRun({
            text: textPart.text,
            size: theme.fontSize.body * 2, // Convert to half-points
            font: theme.fonts.primary,
            color: theme.colors.text,
            bold: textPart.bold || false,
            italics: textPart.italic || false,
          }));
        });
        
        paragraphs.push(
          new Paragraph({
            children: textRuns,
            numbering: {
              reference: 'small-bullet',
              level: 0,
            },
            spacing: {
              after: itemIndex < section.items.length - 1 ? theme.spacingTwips.medium : theme.spacingTwips.coverLetterParagraph, // 4pt between items, 12pt after list
              line: theme.spacingTwips.oneAndHalfLine,   // 1.5 line spacing
            },
            alignment: AlignmentType.LEFT,
          }),
        );
      });
    }
  });
  
  return paragraphs;
}

/**
 * Creates the closing section for cover letter
 * @param {Object} metadata - Cover letter metadata
 * @returns {Array} Array of paragraphs for the closing section
 */
function createCoverLetterClosing(metadata) {
  const paragraphs = [];
  
  // Add the closing (e.g., "Warmly,")
  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `${metadata.customClosing || 'Warmly'},`,
          size: theme.fontSize.body * 2, // Convert to half-points
          font: theme.fonts.primary,
          color: theme.colors.text,
        }),
      ],
      spacing: {
        after: 0, // No extra paragraph spacing
        line: theme.spacingTwips.oneAndHalfLine,   // 1.5 line spacing
      },
      alignment: AlignmentType.LEFT,
    }),
  );
  
  // Add the name
  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: 'Jon Amar',
          size: theme.fontSize.body * 2, // Convert to half-points
          font: theme.fonts.primary,
          color: theme.colors.text,
        }),
      ],
      spacing: {
        after: 0, // No extra paragraph spacing
        line: theme.spacingTwips.oneAndHalfLine,   // 1.5 line spacing
      },
      alignment: AlignmentType.LEFT,
    }),
  );
  
  // Add the pronouns
  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: 'they/them',
          size: theme.fontSize.body * 2, // Convert to half-points
          font: theme.fonts.primary,
          color: theme.colors.text,
        }),
      ],
      spacing: {
        after: theme.spacingTwips.page, // 24pt extra space before next section
        line: theme.spacingTwips.oneAndHalfLine,   // 1.5 line spacing
      },
      alignment: AlignmentType.LEFT,
    }),
  );
  
  return paragraphs;
}

/**
 * Creates the footer section with contact information for cover letter
 * @param {Object} basics - Basic contact information
 * @param {boolean} isComboMode - Whether this is part of a combined document
 * @returns {Array} Array of paragraphs for the footer section
 */
function createCoverLetterFooter(basics, isComboMode = false) {
  const paragraphs = [];
  
  // Skip contact info in combo mode since resume already has it
  if (isComboMode) {
    return paragraphs;
  }

  // Create contact information with ATS-friendly format
  const contactParts = [];
  
  // Add address first with ATS-friendly label (city, province abbreviation, country)
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
    
    // Add "Address:" label for ATS recognition
    if (locationText) {
      contactParts.push(`Address: ${locationText}`);
    }
  }
  
  // Add phone and email
  if (basics.phone) {
    contactParts.push(basics.phone);
  }
  if (basics.email) {
    contactParts.push(basics.email);
  }

  // Add contact info line with bullet separators
  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: contactParts.join(' • '),
          size: theme.fontSize.meta * 2, // Convert to half-points
          color: theme.colors.dimText,
          font: theme.fonts.primary,
        }),
      ],
      spacing: {
        before: theme.spacingTwips.beforeContact, // 12pt before contact info
        after: theme.spacingTwips.afterContact,   // 5pt
      },
    }),
  );

  // Add profiles if any
  if (basics.profiles && basics.profiles.length > 0) {
    const profileChildren = [];
    
    basics.profiles.forEach((profile, index) => {
      // Add bullet separator between profiles (not before first)
      if (index > 0) {
        profileChildren.push(new TextRun({
          text: ' • ',
          size: theme.fontSize.meta * 2, // Convert to half-points
          color: theme.colors.dimText,
          font: theme.fonts.primary,
        }));
      }
      
      // Add profile as hyperlink
      profileChildren.push(
        new ExternalHyperlink({
          children: [
            new TextRun({
              text: profile.url.replace(/^https?:\/\//, ''), // Remove protocol for cleaner display
              size: theme.fontSize.meta * 2, // Convert to half-points
              color: theme.colors.dimText,
              font: theme.fonts.primary,
              underline: {
                type: UnderlineType.SINGLE,
                color: theme.colors.dimText,
              },
            }),
          ],
          link: profile.url,
        }),
      );
    });

    paragraphs.push(
      new Paragraph({
        children: profileChildren,
        spacing: {
          after: theme.spacingTwips.afterContact, // 5pt
        },
      }),
    );
  }
  
  return paragraphs;
}

/**
 * Creates a combined DOCX document with cover letter followed by resume
 * @param {Object} coverLetterData - Cover letter data with basics and coverLetter sections
 * @param {Object} resumeData - Resume data in JSON Resume format
 * @param {Object} options - Additional options
 * @returns {Document} DOCX document with both cover letter and resume
 */
function createCombinedDocx(coverLetterData, resumeData, options = {}) {
  // Cover letter sections
  const coverLetterChildren = [
    ...createCoverLetterDate(coverLetterData.coverLetter.metadata),
    ...createCoverLetterContent(coverLetterData.coverLetter.content),
    ...createCoverLetterClosing(coverLetterData.coverLetter.metadata),
    ...createCoverLetterFooter(coverLetterData.basics, true), // Pass true for combo mode
  ];

  // Resume sections
  const resumeChildren = [
    ...createHeader(resumeData.basics),
    ...createSummary(resumeData.basics),
    ...createExperience(resumeData.work),
    ...createSkills(resumeData.skills),
    ...createEducation(resumeData.education),
  ];

  // Add optional resume sections
  if (resumeData.projects && resumeData.projects.length > 0) {
    resumeChildren.push(...createProjects(resumeData.projects));
  }

  if (resumeData.publications && resumeData.publications.length > 0) {
    resumeChildren.push(...createSpeakingEngagements(resumeData.publications));
  }

  if (resumeData.languages && resumeData.languages.length > 0) {
    resumeChildren.push(...createLanguages(resumeData.languages));
  }

  // Create the document with two sections
  const doc = new Document({
    numbering: {
      config: [
        {
          reference: 'small-bullet',
          levels: [
            {
              level: 0,
              format: LevelFormat.BULLET,
              text: '•',
              alignment: AlignmentType.LEFT,
              style: {
                run: {
                  font: theme.fonts.primary,
                  size: 16, // 8pt bullet (smaller than default 10pt text)
                  color: theme.colors.text,
                },
              },
            },
          ],
        },
      ],
    },
    styles: {
      paragraphStyles: [
        {
          id: 'applicantName',
          name: 'Applicant Name',
          basedOn: 'Normal',
          next: 'Normal',
          run: {
            size: theme.fontSize.name * 2, // Convert to half-points
            font: 'Arial',
            bold: true,
            color: theme.colors.headings,
          },
          paragraph: {
            spacing: {
              after: theme.spacingTwips.afterHeader, // 12pt
            },
            indent: {
              left: 0, // No indentation
            },
            font: 'Arial',
          },
        },
      ],
      defaultRunProperties: {
        font: 'Arial',
      },
    },
    sections: [
      {
        // Cover letter section
        properties: {
          page: {
            margin: theme.margins.document,
          },
        },
        children: coverLetterChildren,
      },
      {
        // Resume section (starts on new page)
        properties: {
          page: {
            margin: theme.margins.document,
          },
          type: SectionType.NEXT_PAGE, // Force new page
        },
        children: resumeChildren,
      },
    ],
  });

  return doc;
}

export { 
  createResumeDocx,
  createCoverLetterDocx,
  createCombinedDocx,
};
