/**
 * Resume education section builder
 */

import { Paragraph, TextRun } from 'docx';
import theme from '../../../../theme.js';
import { formatDate } from '../../formatting/date-utilities.js';
import { createSectionHeading } from '../../formatting/section-utilities.js';

interface Education {
  area: string;
  studyType?: string;
  institution: string;
  startDate: string;
  endDate?: string;
  location?: string;
}

/**
 * Creates the education section for a resume
 * @param education - Array of education entries
 * @returns Array of paragraphs for the education section
 */
export function createEducation(education: Education[]): Paragraph[] {
  const paragraphs: Paragraph[] = [];

  // Add section heading
  paragraphs.push(
    createSectionHeading(theme.ats.sectionTitles.education),
  );

  // Add each education entry
  education.forEach((edu, index) => {
    const isLast = index === education.length - 1;
    // Line 1: Degree/program (bold)
    const degreeText = edu.area || edu.studyType ? `${edu.area}${edu.studyType ? '' : ''}` : '';
    const line1 = degreeText || edu.studyType ? (degreeText || edu.studyType!) : '';
    if (line1) {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: line1,
              size: theme.typography.fontSize.body * 2,
              font: theme.typography.fonts.primary,
              bold: true,
              color: theme.colors.text,
            }),
          ],
          spacing: { after: theme.spacing.twips.afterJobTitle, line: theme.spacing.twips.resumeLine },
          keepNext: true,
        }),
      );
    }

    // Line 2: Institution • years • location (dim)
    const dateRange = `${formatDate(edu.startDate)} - ${edu.endDate ? formatDate(edu.endDate) : 'Present'}`;
    const parts: string[] = [];
    parts.push(edu.institution);
    parts.push(dateRange);
    if (edu.location) parts.push(edu.location);
    const meta = parts.join(' • ');

    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: meta,
            size: theme.typography.fontSize.meta * 2,
            font: theme.typography.fonts.primary,
            color: theme.colors.dimText, // #555555
          }),
        ],
        spacing: { 
          after: isLast ? theme.spacing.twips.betweenSections : theme.spacing.twips.large, 
          line: theme.spacing.twips.resumeLine 
        },
      }),
    );
  });

  return paragraphs;
}
