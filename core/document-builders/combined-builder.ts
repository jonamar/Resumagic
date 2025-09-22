/**
 * Main combined document builder
 */

import { Document, LevelFormat, AlignmentType, SectionType, Paragraph } from 'docx';
import theme from '../../theme.js';
import { createCoverLetterDate } from '../sections/cover-letter/date-section.js';
import { createCoverLetterContent } from '../sections/cover-letter/content-section.js';
import { createCoverLetterClosing } from '../sections/cover-letter/closing-section.js';
import { createCoverLetterFooter } from '../sections/cover-letter/footer-section.js';
import { createHeader } from '../sections/resume/header-section.js';
import { createSummary } from '../sections/resume/summary-section.js';
import { createExperience } from '../sections/resume/experience-section.js';
import { createSkills } from '../sections/resume/skills-section.js';
import { createEducation } from '../sections/resume/education-section.js';
import { createProjects } from '../sections/resume/projects-section.js';
import { createSpeakingEngagements } from '../sections/resume/speaking-section.js';
import { createLanguages } from '../sections/resume/languages-section.js';

interface CoverLetterData {
  basics: any;
  coverLetter: {
    metadata: any;
    content: any[];
  };
}

interface ResumeData {
  basics: any;
  work: any[];
  skills: any[];
  education: any[];
  projects?: any[];
  publications?: any[];
  languages?: any[];
}

interface CombinedOptions {
  // Add any options properties here as needed
}

/**
 * Creates a combined DOCX document with cover letter followed by resume
 * @param coverLetterData - Cover letter data with basics and coverLetter sections
 * @param resumeData - Resume data in JSON Resume format
 * @param options - Additional options
 * @returns DOCX document with both cover letter and resume
 */
export function createCombinedDocx(coverLetterData: CoverLetterData, resumeData: ResumeData, _options: CombinedOptions = {}): Document {
  // Cover letter sections
  const coverLetterChildren: Paragraph[] = [
    ...createCoverLetterDate(coverLetterData.coverLetter.metadata),
    ...createCoverLetterContent(coverLetterData.coverLetter.content),
    ...createCoverLetterClosing(coverLetterData.coverLetter.metadata),
    ...createCoverLetterFooter(coverLetterData.basics, true), // Pass true for combo mode
  ];

  // Resume sections
  const resumeChildren: Paragraph[] = [
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
                  font: theme.typography.fonts.primary,
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
            size: theme.typography.fontSize.name * 2, // Convert to half-points
            font: 'Arial',
            bold: true,
            color: theme.colors.headings,
          },
          paragraph: {
            spacing: {
              after: theme.spacing.twips.afterHeader, // 12pt
            },
            indent: {
              left: 0, // No indentation
            },
          },
        },
      ],
    },
    sections: [
      {
        // Cover letter section
        properties: {
          page: {
            margin: theme.layout.margins.document,
          },
        },
        children: coverLetterChildren,
      },
      {
        // Resume section (starts on new page)
        properties: {
          page: {
            margin: theme.layout.margins.document,
          },
          type: SectionType.NEXT_PAGE, // Force new page
        },
        children: resumeChildren,
      },
    ],
  });

  return doc;
}
