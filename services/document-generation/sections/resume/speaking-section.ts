/**
 * Resume speaking engagements section builder
 */

import { Paragraph, TextRun } from 'docx';
import theme from '../../../../theme.js';
import { formatDate } from '../../formatting/date-utilities.js';
import { createSectionHeading } from '../../formatting/section-utilities.js';
import { createFormattedTextRuns } from '../../formatting/text-formatting.js';

interface Publication {
  name: string;
  publisher?: string;
  releaseDate?: string;
  summary?: string;
  highlights?: string[];
}

/**
 * Creates the speaking engagements section using the generic createItemSection function
 * @param publications - Array of publication/speaking entries
 * @returns Array of paragraphs for the speaking engagements section
 */
export function createSpeakingEngagements(publications: Publication[]): Paragraph[] {
  const paragraphs: Paragraph[] = [];

  // Section heading
  paragraphs.push(createSectionHeading(theme.ats.sectionTitles.speakingEngagements));

  publications.forEach((pub, index) => {
    const isLast = index === publications.length - 1;

    // Line 1: Title (bold)
    if (pub.name) {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: pub.name,
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

    // Line 2: Venue • date (dim)
    const parts: string[] = [];
    if (pub.publisher) parts.push(pub.publisher);
    if (pub.releaseDate) parts.push(formatDate(pub.releaseDate));
    const meta = parts.join(' • ');
    if (meta) {
      paragraphs.push(
        new Paragraph({
          children: createFormattedTextRuns(meta, {
            size: theme.typography.fontSize.meta * 2,
            font: theme.typography.fonts.primary,
            color: theme.colors.dimText,
          }),
          spacing: { after: isLast ? theme.spacing.twips.afterSectionEntry : theme.spacing.twips.large, line: theme.spacing.twips.resumeLine },
          keepNext: !!pub.summary,
        }),
      );
    }

    // Optional summary
    if (pub.summary) {
      paragraphs.push(
        new Paragraph({
          children: createFormattedTextRuns(pub.summary, {
            size: theme.typography.fontSize.body * 2,
            font: theme.typography.fonts.primary,
            color: theme.colors.text,
          }),
          spacing: { after: theme.spacing.twips.large, line: theme.spacing.twips.resumeLine },
          keepLines: true,
        }),
      );
    }

    // No extra spacer; rely purely on per-line spacing above
  });

  return paragraphs;
}
