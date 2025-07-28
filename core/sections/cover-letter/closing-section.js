/**
 * Cover letter closing section builder
 */

import { Paragraph, TextRun, AlignmentType } from 'docx';
import theme from '../../../theme.js';

/**
 * Creates the closing section for cover letter
 * @param {Object} metadata - Cover letter metadata
 * @returns {Array} Array of paragraphs for the closing section
 */
export function createCoverLetterClosing(metadata) {
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