/**
 * Cover letter closing section builder
 */

import { Paragraph, TextRun, AlignmentType } from 'docx';
import theme from '../../../../theme.js';

interface CoverLetterMetadata {
  customClosing?: string;
  basics?: {
    name?: string;
    pronouns?: string;
  };
  coverLetterFrontMatter?: {
    pronouns?: string;
  };
}

/**
 * Creates the closing section for cover letter
 * @param metadata - Cover letter metadata
 * @returns Array of paragraphs for the closing section
 */
export function createCoverLetterClosing(metadata: CoverLetterMetadata): Paragraph[] {
  const paragraphs: Paragraph[] = [];
  const candidateName: string | undefined = metadata.basics?.name;
  const pronounsFromFrontMatter: string | undefined = metadata.coverLetterFrontMatter?.pronouns;
  const pronounsFromBasics: string | undefined = metadata.basics?.pronouns;
  const resolvedPronouns: string | undefined = pronounsFromFrontMatter || pronounsFromBasics;
  
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
  
  // Add the name if provided, otherwise default to "Jon Amar"
  const nameToRender = (candidateName && candidateName.trim().length > 0) ? candidateName : 'Jon Amar';
  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: nameToRender,
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
  
  // Add the pronouns if provided
  if (resolvedPronouns && resolvedPronouns.trim().length > 0) {
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: resolvedPronouns,
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
  }
  
  return paragraphs;
}
