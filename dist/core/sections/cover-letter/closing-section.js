import { Paragraph, TextRun, AlignmentType } from 'docx';
import theme from '../../../theme.js';
export function createCoverLetterClosing(metadata) {
    const paragraphs = [];
    paragraphs.push(new Paragraph({
        children: [
            new TextRun({
                text: `${metadata.customClosing || 'Warmly'},`,
                size: theme.typography.fontSize.body * 2,
                font: theme.typography.fonts.primary,
                color: theme.colors.text,
            }),
        ],
        spacing: {
            after: 0,
            line: theme.spacing.twips.oneAndHalfLine,
        },
        alignment: AlignmentType.LEFT,
    }));
    paragraphs.push(new Paragraph({
        children: [
            new TextRun({
                text: 'Jon Amar',
                size: theme.typography.fontSize.body * 2,
                font: theme.typography.fonts.primary,
                color: theme.colors.text,
            }),
        ],
        spacing: {
            after: 0,
            line: theme.spacing.twips.oneAndHalfLine,
        },
        alignment: AlignmentType.LEFT,
    }));
    paragraphs.push(new Paragraph({
        children: [
            new TextRun({
                text: 'they/them',
                size: theme.typography.fontSize.body * 2,
                font: theme.typography.fonts.primary,
                color: theme.colors.text,
            }),
        ],
        spacing: {
            after: theme.spacing.twips.page,
            line: theme.spacing.twips.oneAndHalfLine,
        },
        alignment: AlignmentType.LEFT,
    }));
    return paragraphs;
}
//# sourceMappingURL=closing-section.js.map