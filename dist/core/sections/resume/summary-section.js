import { Paragraph } from 'docx';
import theme from '../../../theme.js';
import { createFormattedTextRuns } from '../../formatting/text-formatting.js';
import { createSectionHeading } from '../../formatting/section-utilities.js';
export function createSummary(basics) {
    const paragraphs = [];
    if (!basics.summary) {
        return paragraphs;
    }
    paragraphs.push(createSectionHeading('Summary'));
    paragraphs.push(new Paragraph({
        children: createFormattedTextRuns(basics.summary, {
            size: theme.typography.fontSize.body * 2,
            font: theme.typography.fonts.primary,
            color: theme.colors.text,
        }),
        spacing: {
            after: theme.spacing.twips.afterSummary,
        },
    }));
    return paragraphs;
}
//# sourceMappingURL=summary-section.js.map