/**
 * Resume summary section builder
 */

import { Paragraph } from 'docx';
import theme from '../../../../theme.js';
import { createFormattedTextRuns } from '../../formatting/text-formatting.js';
// No section heading; render summary text inline under header

interface Basics {
  summary?: string;
}

/**
 * Creates the summary section for a resume
 * @param basics - Basic information containing summary
 * @returns Array of paragraphs for the summary section
 */
export function createSummary(basics: Basics): Paragraph[] {
  const paragraphs: Paragraph[] = [];

  if (!basics.summary) {
    return paragraphs;
  }

  // Add summary text
  paragraphs.push(
    new Paragraph({
      children: createFormattedTextRuns(basics.summary, {
        size: theme.typography.fontSize.body * 2, // Convert to half-points
        font: theme.typography.fonts.primary,
        color: theme.colors.text,
      }),
      spacing: {
        after: theme.spacing.twips.betweenSections, // standardized gap before next section
      },
    }),
  );

  return paragraphs;
}
