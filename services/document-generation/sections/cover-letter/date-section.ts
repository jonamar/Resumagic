/**
 * Cover letter date section builder
 */

import { Paragraph, TextRun, AlignmentType } from 'docx';
import theme from '../../../../theme.js';
import { formatDate } from '../../../../core/formatting/date-utilities.js';

interface CoverLetterMetadata {
  date: string;
  recipientName?: string;
  companyName?: string;
}

/**
 * Creates the date section for a cover letter
 * @param metadata - Cover letter metadata containing date
 * @returns Array of paragraphs for the date section
 */
export function createCoverLetterDate(metadata: CoverLetterMetadata): Paragraph[] {
  const paragraphs: Paragraph[] = [];
  
  // Format the date
  const formattedDate = formatDate(metadata.date);
  
  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: formattedDate,
          size: theme.typography.fontSize.body * 2, // Convert to half-points
          font: theme.typography.fonts.primary,
          color: theme.colors.text,
        }),
      ],
      spacing: {
        before: theme.spacing.twips.beforeDate, // 12pt breathing room before
        after: theme.spacing.twips.afterDate,   // 24pt breathing room after
      },
      alignment: AlignmentType.RIGHT,
    }),
  );
  
  return paragraphs;
}
