import { Paragraph, TextRun } from 'docx';
import theme from '../../../theme.js';
import { createFormattedTextRuns } from '../../formatting/text-formatting.js';
import { createSectionHeading } from '../../formatting/section-utilities.js';
export function createSkills(skills) {
    const paragraphs = [];
    paragraphs.push(createSectionHeading(theme.ats.sectionTitles.skills, true));
    skills.forEach(skill => {
        paragraphs.push(new Paragraph({
            children: [
                new TextRun({
                    text: skill.name,
                    size: theme.typography.fontSize.body * 2,
                    font: theme.typography.fonts.primary,
                    bold: true,
                    color: theme.colors.text,
                }),
            ],
            spacing: {
                after: theme.spacing.twips.afterJobTitle,
                line: theme.spacing.twips.resumeLine,
            },
        }));
        if (skill.keywords && skill.keywords.length > 0) {
            paragraphs.push(new Paragraph({
                children: createFormattedTextRuns(skill.keywords.join(', '), {
                    size: theme.typography.fontSize.meta * 2,
                    font: theme.typography.fonts.primary,
                    color: theme.colors.dimText,
                }),
                spacing: {
                    after: theme.spacing.twips.xlarge,
                    line: theme.spacing.twips.resumeLine,
                },
            }));
        }
    });
    return paragraphs;
}
//# sourceMappingURL=skills-section.js.map