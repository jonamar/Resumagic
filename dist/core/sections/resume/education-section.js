import { Paragraph, TextRun } from 'docx';
import theme from '../../../theme.js';
import { formatDate } from '../../formatting/date-utilities.js';
import { createSectionHeading } from '../../formatting/section-utilities.js';
export function createEducation(education) {
    const paragraphs = [];
    paragraphs.push(createSectionHeading(theme.ats.sectionTitles.education));
    education.forEach(edu => {
        let degreeText = edu.area;
        if (edu.studyType) {
            degreeText += ` - ${edu.studyType}`;
        }
        paragraphs.push(new Paragraph({
            children: [
                new TextRun({
                    text: degreeText,
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
            keepNext: true,
        }));
        paragraphs.push(new Paragraph({
            children: [
                new TextRun({
                    text: edu.institution,
                    size: theme.typography.fontSize.body * 2,
                    font: theme.typography.fonts.primary,
                    bold: true,
                    color: theme.colors.text,
                }),
            ],
            spacing: {
                after: theme.spacing.twips.afterCompanyName,
                line: theme.spacing.twips.resumeLine,
            },
            keepNext: true,
        }));
        const dateParts = [];
        dateParts.push(`${formatDate(edu.startDate)} - ${edu.endDate ? formatDate(edu.endDate) : 'Present'}`);
        if (edu.location) {
            dateParts.push(edu.location);
        }
        paragraphs.push(new Paragraph({
            children: [
                new TextRun({
                    text: dateParts.join(' • '),
                    size: theme.typography.fontSize.meta * 2,
                    font: theme.typography.fonts.primary,
                    color: theme.colors.dimText,
                }),
            ],
            spacing: {
                after: theme.spacing.twips.afterSectionEntry,
            },
        }));
    });
    return paragraphs;
}
//# sourceMappingURL=education-section.js.map