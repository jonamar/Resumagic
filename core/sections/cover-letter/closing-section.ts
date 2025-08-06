/**
 * Cover letter closing section builder
 */

import { Paragraph, TextRun, AlignmentType } from 'docx';
import theme from '../../../theme.js';

interface CoverLetterMetadata {
  customClosing?: string;
}

/**
 * Creates the closing section for cover letter
 * @param metadata - Cover letter metadata
 * @returns Array of paragraphs for the closing section
 */
export function createCoverLetterClosing(metadata: CoverLetterMetadata): Paragraph[] {
  const paragraphs: Paragraph[] = [];
  
  // Add the closing (e.g., "Warmly,")
  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `${metadata.customClosing || 'Warmly'},`,
          size: theme.typography.fontSize.body * 2, // Convert to half-points
          font: theme.typography.fonts.primary,
          color: theme.colors.text,
        }),
      ],
      spacing: {
        after: 0, // No extra paragraph spacing
        line: theme.spacing.twips.oneAndHalfLine,   // 1.5 line spacing
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
          size: theme.typography.fontSize.body * 2, // Convert to half-points
          font: theme.typography.fonts.primary,
          color: theme.colors.text,
        }),
      ],
      spacing: {
        after: 0, // No extra paragraph spacing
        line: theme.spacing.twips.oneAndHalfLine,   // 1.5 line spacing
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
          size: theme.typography.fontSize.body * 2, // Convert to half-points
          font: theme.typography.fonts.primary,
          color: theme.colors.text,
        }),
      ],
      spacing: {
        after: theme.spacing.twips.page, // 24pt extra space before next section
        line: theme.spacing.twips.oneAndHalfLine,   // 1.5 line spacing
      },
      alignment: AlignmentType.LEFT,
    }),
  );
  
  return paragraphs;
}
