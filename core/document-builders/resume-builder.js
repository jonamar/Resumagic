/**
 * Main resume document builder
 */

import { Document, LevelFormat, AlignmentType } from 'docx';
import theme from '../../theme.js';
import { createHeader } from '../sections/resume/header-section.js';
import { createSummary } from '../sections/resume/summary-section.js';
import { createExperience } from '../sections/resume/experience-section.js';
import { createSkills } from '../sections/resume/skills-section.js';
import { createEducation } from '../sections/resume/education-section.js';
import { createProjects } from '../sections/resume/projects-section.js';
import { createSpeakingEngagements } from '../sections/resume/speaking-section.js';
import { createLanguages } from '../sections/resume/languages-section.js';

/**
 * Creates a DOCX document from resume JSON data
 * @param {Object} resumeData - Resume data in JSON Resume format
 * @param {Object} options - Additional options for resume generation
 * @returns {Document} DOCX document
 */
export function createResumeDocx(resumeData, options = {}) {
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