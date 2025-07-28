/**
 * Resume education section builder
 */

import { Paragraph, TextRun } from 'docx';
import theme from '../../../theme.js';
import { formatDate } from '../../formatting/date-utilities.js';
import { createSectionHeading } from '../../formatting/section-utilities.js';

/**
 * Creates the education section for a resume
 * @param {Array} education - Array of education entries
 * @returns {Array} Array of paragraphs for the education section
 */
export function createEducation(education) {
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