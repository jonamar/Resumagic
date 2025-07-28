/**
 * Cover letter content section builder
 */

import { Paragraph, TextRun, AlignmentType } from 'docx';
import theme from '../../../theme.js';

/**
 * Creates the main content section for cover letter
 * @param {Array} content - Array of content paragraphs and lists
 * @returns {Array} Array of paragraphs for the content section
 */
export function createCoverLetterContent(content) {
  const paragraphs = [];
  
  content.forEach((section, index) => {
    if (section.type === 'paragraph') {
      // Handle paragraph content
      const textRuns = [];
      
      section.text.forEach(textPart => {
        textRuns.push(new TextRun({
          text: textPart.text,
          size: theme.fontSize.body * 2, // Convert to half-points
          font: theme.fonts.primary,
          color: theme.colors.text,
          bold: textPart.bold || false,
          italics: textPart.italic || false,
        }));
      });
      
      paragraphs.push(
        new Paragraph({
          children: textRuns,
          spacing: {
            after: theme.spacingTwips.coverLetterParagraph, // 12pt between paragraphs
            line: theme.spacingTwips.oneAndHalfLine,   // 1.5 line spacing (240 = 1.0, 360 = 1.5)
          },
          alignment: AlignmentType.JUSTIFIED,
        }),
      );
      
    } else if (section.type === 'list') {
      // Handle bullet list content
      section.items.forEach((item, itemIndex) => {
        const textRuns = [];
        
        item.forEach(textPart => {
          textRuns.push(new TextRun({
            text: textPart.text,
            size: theme.fontSize.body * 2, // Convert to half-points
            font: theme.fonts.primary,
            color: theme.colors.text,
            bold: textPart.bold || false,
            italics: textPart.italic || false,
          }));
        });
        
        paragraphs.push(
          new Paragraph({
            children: textRuns,
            numbering: {
              reference: 'small-bullet',
              level: 0,
            },
            spacing: {
              after: itemIndex < section.items.length - 1 ? theme.spacingTwips.medium : theme.spacingTwips.coverLetterParagraph, // 4pt between items, 12pt after list
              line: theme.spacingTwips.oneAndHalfLine,   // 1.5 line spacing
            },
            alignment: AlignmentType.LEFT,
          }),
        );
      });
    }
  });
  
  return paragraphs;
}