/**
 * Resume languages section builder
 */

import { Paragraph, TextRun } from 'docx';
import theme from '../../../../theme.js';
import { createSectionHeading } from '../../formatting/section-utilities.js';

interface Language {
  language: string;
  fluency?: string;
}

/**
 * Creates the Languages section
 * @param languages - Array of language objects from resume data
 * @returns Array of paragraphs for the languages section
 */
export function createLanguages(languages: Language[]): Paragraph[] {
  const paragraphs: Paragraph[] = [];

  // Add section heading
  paragraphs.push(
    createSectionHeading(theme.ats.sectionTitles.languages),
  );

  // Create a simple list of languages with fluency levels
  languages.forEach((language, index) => {
    
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: language.language,
            size: theme.typography.fontSize.body * 2, // Convert to half-points
            font: theme.typography.fonts.primary,
            bold: true,
            color: theme.colors.text,
          }),
          ...(language.fluency ? [
            new TextRun({
              text: `: ${language.fluency}`,
              size: theme.typography.fontSize.body * 2, // Convert to half-points
              font: theme.typography.fonts.primary,
              color: theme.colors.text,
            }),
          ] : []),
        ],
        spacing: {
          after: index < languages.length - 1 ? 80 : 240, // 4pt between items, 12pt after section
        },
      }),
    );
  });

  return paragraphs;
}
