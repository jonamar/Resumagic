/**
 * Cover letter date section builder
 */

import { Paragraph, TextRun, AlignmentType } from 'docx';
import theme from '../../../theme.js';
import { formatDate } from '../../formatting/date-utilities.js';

/**
 * Creates the date section for a cover letter
 * @param {Object} metadata - Cover letter metadata containing date
 * @returns {Array} Array of paragraphs for the date section
 */
export function createCoverLetterDate(metadata) {
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