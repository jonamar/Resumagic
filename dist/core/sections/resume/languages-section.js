import { Paragraph, TextRun } from 'docx';
import theme from '../../../theme.js';
import { createSectionHeading } from '../../formatting/section-utilities.js';
export function createLanguages(languages) {
    const paragraphs = [];
    paragraphs.push(createSectionHeading(theme.ats.sectionTitles.languages));
    languages.forEach((language, index) => {
        paragraphs.push(new Paragraph({
            children: [
                new TextRun({
                    text: language.language,
                    size: theme.typography.fontSize.body * 2,
                    font: theme.typography.fonts.primary,
                    bold: true,
                    color: theme.colors.text,
                }),
                ...(language.fluency ? [
                    new TextRun({
                        text: `: ${language.fluency}`,
                        size: theme.typography.fontSize.body * 2,
                        font: theme.typography.fonts.primary,
                        color: theme.colors.text,
                    }),
                ] : []),
            ],
            spacing: {
                after: index < languages.length - 1 ? 80 : 240,
            },
        }));
    });
    return paragraphs;
}
//# sourceMappingURL=languages-section.js.map