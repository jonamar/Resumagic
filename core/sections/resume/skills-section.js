/**
 * Resume skills section builder
 */

import { Paragraph, TextRun } from 'docx';
import theme from '../../../theme.js';
import { createFormattedTextRuns } from '../../formatting/text-formatting.js';
import { createSectionHeading } from '../../formatting/section-utilities.js';

/**
 * Creates the skills section for a resume
 * @param {Array} skills - Array of skill categories
 * @returns {Array} Array of paragraphs for the skills section
 */
export function createSkills(skills) {
  const paragraphs = [];

  // Add section heading with page break
  paragraphs.push(
    createSectionHeading(theme.ats.sectionTitles.skills, true),
  );

  // Add each skill category
  skills.forEach(skill => {
    // Skill name
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: skill.name,
            size: theme.typography.fontSize.body * 2, // Convert to half-points
            font: theme.typography.fonts.primary,
            bold: true,
            color: theme.colors.text,
          }),
        ],
        spacing: {
          after: theme.spacing.twips.afterJobTitle, // 3pt
          line: theme.spacing.twips.resumeLine,
        },
      }),
    );

    // Keywords if present
    if (skill.keywords && skill.keywords.length > 0) {
      paragraphs.push(
        new Paragraph({
          children: createFormattedTextRuns(skill.keywords.join(', '), {
            size: theme.typography.fontSize.meta * 2, // Convert to half-points
            font: theme.typography.fonts.primary,
            color: theme.colors.dimText,
          }),
          spacing: {
            after: theme.spacing.twips.xlarge, // 9pt
            line: theme.spacing.twips.resumeLine,
          },
        }),
      );
    }
  });

  return paragraphs;
}
