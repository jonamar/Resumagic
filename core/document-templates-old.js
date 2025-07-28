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
import { createHeader } from './sections/resume/header-section.js';
import { createSummary } from './sections/resume/summary-section.js';
import { createExperience } from './sections/resume/experience-section.js';
import { createSkills } from './sections/resume/skills-section.js';
import { createEducation } from './sections/resume/education-section.js';
import { createProjects } from './sections/resume/projects-section.js';
import { createSpeakingEngagements } from './sections/resume/speaking-section.js';
import { createLanguages } from './sections/resume/languages-section.js';
import { createCoverLetterDate } from './sections/cover-letter/date-section.js';
import { createCoverLetterContent } from './sections/cover-letter/content-section.js';
import { createCoverLetterClosing } from './sections/cover-letter/closing-section.js';
import { createCoverLetterFooter } from './sections/cover-letter/footer-section.js';


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
