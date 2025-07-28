import { Paragraph, TextRun, AlignmentType } from 'docx';
import theme from '../../../theme.js';
import { formatDate } from '../../formatting/date-utilities.js';
export function createCoverLetterDate(metadata) {
    const paragraphs = [];
    const formattedDate = formatDate(metadata.date);
    paragraphs.push(new Paragraph({
        children: [
            new TextRun({
                text: formattedDate,
                size: theme.typography.fontSize.body * 2,
                font: theme.typography.fonts.primary,
                color: theme.colors.text,
            }),
        ],
        spacing: {
            before: theme.spacing.twips.beforeDate,
            after: theme.spacing.twips.afterDate,
        },
        alignment: AlignmentType.RIGHT,
    }));
    return paragraphs;
}
//# sourceMappingURL=date-section.js.map