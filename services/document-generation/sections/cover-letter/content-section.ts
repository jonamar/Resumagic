/**
 * Cover letter content section builder
 */

import { Paragraph, TextRun, AlignmentType } from 'docx';
import theme from '../../../../theme.js';
import { createInlineRunsWithLinks } from '../../formatting/text-formatting.js';

interface TextPart {
  text: string;
  bold?: boolean;
  italic?: boolean;
}

interface ContentSection {
  type: 'paragraph' | 'list';
  text?: TextPart[];
  items?: TextPart[][];
}

/**
 * Creates the main content section for cover letter
 * @param content - Array of content paragraphs and lists
 * @returns Array of paragraphs for the content section
 */
export function createCoverLetterContent(content: ContentSection[]): Paragraph[] {
  const paragraphs: Paragraph[] = [];
  
  content.forEach((section) => {
    if (section.type === 'paragraph') {
      // Handle paragraph content (supports [text](url) links and bold/italic)
      const textRuns: TextRun[] = [];
      
      section.text?.forEach(textPart => {
        const runs = createInlineRunsWithLinks(
          textPart.text,
          {
            size: theme.typography.fontSize.body * 2, // Convert to half-points
            font: theme.typography.fonts.primary,
            color: theme.colors.text,
          },
          textPart.bold || false,
          textPart.italic || false,
        );
        runs.forEach(r => textRuns.push(r as TextRun));
      });
      
      paragraphs.push(
        new Paragraph({
          children: textRuns,
          spacing: {
            after: theme.spacing.twips.coverLetterParagraph, // 12pt between paragraphs
            line: theme.spacing.twips.oneAndHalfLine,   // 1.5 line spacing (240 = 1.0, 360 = 1.5)
          },
          alignment: AlignmentType.LEFT,
        }),
      );
      
    } else if (section.type === 'list') {
      // Handle bullet list content
      section.items?.forEach((item, itemIndex) => {
        const textRuns: TextRun[] = [];
        
        item.forEach(textPart => {
          const runs = createInlineRunsWithLinks(
            textPart.text,
            {
              size: theme.typography.fontSize.body * 2, // Convert to half-points
              font: theme.typography.fonts.primary,
              color: theme.colors.text,
            },
            textPart.bold || false,
            textPart.italic || false,
          );
          runs.forEach(r => textRuns.push(r as TextRun));
        });
        
        paragraphs.push(
          new Paragraph({
            children: textRuns,
            numbering: {
              reference: 'small-bullet',
              level: 0,
            },
            spacing: {
              after: itemIndex < section.items!.length - 1 ? theme.spacing.twips.medium : theme.spacing.twips.coverLetterParagraph, // 4pt between items, 12pt after list
              line: theme.spacing.twips.oneAndHalfLine,   // 1.5 line spacing
            },
            alignment: AlignmentType.LEFT,
          }),
        );
      });
    }
  });
  
  return paragraphs;
}
