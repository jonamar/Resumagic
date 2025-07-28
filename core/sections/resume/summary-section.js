/**
 * Resume summary section builder
 */

import { Paragraph } from 'docx';
import theme from '../../../theme.js';
import { createFormattedTextRuns } from '../../formatting/text-formatting.js';
import { createSectionHeading } from '../../formatting/section-utilities.js';

/**
 * Creates the summary section for a resume
 * @param {Object} basics - Basic information containing summary
 * @returns {Array} Array of paragraphs for the summary section
 */
export function createSummary(basics) {
  const paragraphs = [];

  if (!basics.summary) {
    return paragraphs;
  }

  // Add section heading
  paragraphs.push(
    createSectionHeading('Summary'),
  );

  // Add summary text
  paragraphs.push(
    new Paragraph({
      children: createFormattedTextRuns(basics.summary, {
        size: theme.typography.fontSize.body * 2, // Convert to half-points
        font: theme.typography.fonts.primary,
        color: theme.colors.text,
      }),
      spacing: {
        after: theme.spacing.twips.afterSummary, // 4pt
      },
    }),
  );

  return paragraphs;
}
