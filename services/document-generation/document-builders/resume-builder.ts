/**
 * Main resume document builder
 */

import { Document, LevelFormat, AlignmentType, Paragraph, TextRun } from 'docx';
import theme from '../../../theme.js';
import { createHeader } from '../sections/resume/header-section.js';
import { createSummary } from '../sections/resume/summary-section.js';
import { createExperience } from '../sections/resume/experience-section.js';
import { createSkills } from '../sections/resume/skills-section.js';
import { createEducation } from '../sections/resume/education-section.js';
import { createProjects } from '../sections/resume/projects-section.js';
import { createSpeakingEngagements } from '../sections/resume/speaking-section.js';
import { createLanguages } from '../sections/resume/languages-section.js';

interface ResumeData {
  basics: any;
  work: any[];
  skills: any[];
  education: any[];
  projects?: any[];
  publications?: any[];
  languages?: any[];
}

type ResumeOptions = Record<string, unknown>;

/**
 * Creates a DOCX document from resume JSON data
 * @param resumeData - Resume data in JSON Resume format
 * @param options - Additional options for resume generation
 * @returns DOCX document
 */
export function createResumeDocx(resumeData: ResumeData, _options: ResumeOptions = {}): Document {
  // Document sections
  const children: Paragraph[] = [
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

  // Append footer note from meta if present (italic, left-aligned)
  const metaFooterNote: string | undefined = (resumeData as any).meta && (resumeData as any).meta.footerNote;
  if (metaFooterNote && metaFooterNote.trim().length > 0) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: metaFooterNote,
            size: theme.typography.fontSize.body * 2,
            font: theme.typography.fonts.primary,
            color: theme.colors.text,
            italics: true,
          }),
        ],
        spacing: {
          before: theme.spacing.twips.medium,
          after: theme.spacing.twips.medium,
        },
        alignment: AlignmentType.LEFT,
        keepLines: true,
      }),
    );
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
            font: 'Arial', // Set Arial as the default font for all runs
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
    sections: [{
      properties: {
        page: {
          margin: theme.layout.margins.document,
        },
      },
      children: children,
    }],
  });

  return doc;
}
