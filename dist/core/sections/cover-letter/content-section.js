import { Paragraph, TextRun, AlignmentType } from 'docx';
import theme from '../../../theme.js';
export function createCoverLetterContent(content) {
    const paragraphs = [];
    content.forEach((section) => {
        if (section.type === 'paragraph') {
            const textRuns = [];
            section.text?.forEach(textPart => {
                textRuns.push(new TextRun({
                    text: textPart.text,
                    size: theme.typography.fontSize.body * 2,
                    font: theme.typography.fonts.primary,
                    color: theme.colors.text,
                    bold: textPart.bold || false,
                    italics: textPart.italic || false,
                }));
            });
            paragraphs.push(new Paragraph({
                children: textRuns,
                spacing: {
                    after: theme.spacing.twips.coverLetterParagraph,
                    line: theme.spacing.twips.oneAndHalfLine,
                },
                alignment: AlignmentType.JUSTIFIED,
            }));
        }
        else if (section.type === 'list') {
            section.items?.forEach((item, itemIndex) => {
                const textRuns = [];
                item.forEach(textPart => {
                    textRuns.push(new TextRun({
                        text: textPart.text,
                        size: theme.typography.fontSize.body * 2,
                        font: theme.typography.fonts.primary,
                        color: theme.colors.text,
                        bold: textPart.bold || false,
                        italics: textPart.italic || false,
                    }));
                });
                paragraphs.push(new Paragraph({
                    children: textRuns,
                    numbering: {
                        reference: 'small-bullet',
                        level: 0,
                    },
                    spacing: {
                        after: itemIndex < section.items.length - 1 ? theme.spacing.twips.medium : theme.spacing.twips.coverLetterParagraph,
                        line: theme.spacing.twips.oneAndHalfLine,
                    },
                    alignment: AlignmentType.LEFT,
                }));
            });
        }
    });
    return paragraphs;
}
//# sourceMappingURL=content-section.js.map