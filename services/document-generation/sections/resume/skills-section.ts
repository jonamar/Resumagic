/**
 * Resume skills section builder
 */

import { Paragraph, TextRun } from 'docx';
import theme from '../../../../theme.js';
import { createFormattedTextRuns } from '../../formatting/text-formatting.js';
import { createSectionHeading } from '../../formatting/section-utilities.js';

interface Skill {
  name: string;
  keywords?: string[];
}

/**
 * Creates the skills section for a resume
 * @param skills - Array of skill categories
 * @returns Array of paragraphs for the skills section
 */
export function createSkills(skills: Skill[]): Paragraph[] {
  const paragraphs: Paragraph[] = [];

  // Add section heading without forcing a page break
  paragraphs.push(
    createSectionHeading(theme.ats.sectionTitles.skills, false),
  );

  // Add each skill category
  skills.forEach((skill, idx) => {
    const isLast = idx === skills.length - 1;
    const keywordText = (skill.keywords && skill.keywords.length > 0)
      ? skill.keywords.join(', ')
      : '';

    // Render inline: "Name: keywords"
    const childrenRuns = [
      new TextRun({
        text: keywordText ? `${skill.name}: ` : skill.name,
        size: theme.typography.fontSize.body * 2,
        font: theme.typography.fonts.primary,
        bold: true,
        color: theme.colors.text,
      }),
      ...createFormattedTextRuns(keywordText, {
        size: theme.typography.fontSize.meta * 2,
        font: theme.typography.fonts.primary,
        color: theme.colors.dimText,
      }),
    ];

    paragraphs.push(
      new Paragraph({
        children: childrenRuns,
        spacing: {
          after: isLast ? theme.spacing.twips.betweenSections : theme.spacing.twips.large,
          line: theme.spacing.twips.resumeLine,
        },
      }),
    );
  });

  return paragraphs;
}
