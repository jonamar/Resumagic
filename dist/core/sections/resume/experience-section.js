import theme from '../../../theme.js';
import { formatDate } from '../../formatting/date-utilities.js';
import { createItemSection } from '../../formatting/section-utilities.js';
export function createExperience(work) {
    const experienceConfig = {
        sectionTitle: theme.ats.sectionTitles.experience,
        descriptionField: 'summary',
        highlightsField: 'highlights',
        descriptionSpacing: theme.spacing.twips.afterSummary,
        headerLines: [
            {
                field: 'position',
                spacing: theme.spacing.twips.afterJobTitle,
                keepNext: true,
            },
            {
                field: 'name',
                spacing: theme.spacing.twips.afterCompanyName,
                keepNext: true,
            },
            {
                fields: [
                    { field: 'startDate', format: formatDate },
                    { field: 'endDate', format: (date) => date ? formatDate(date) : 'Present' },
                ],
                includeLocation: true,
                separator: ' - ',
                locationSeparator: ' • ',
                fontSize: theme.typography.fontSize.meta,
                color: theme.colors.dimText,
                bold: false,
                conditionalSpacing: {
                    withContent: theme.spacing.twips.minimal,
                    standalone: theme.spacing.twips.afterDate,
                },
            },
        ],
        itemSpacing: theme.spacing.twips.afterJobEntry,
    };
    return createItemSection(work, experienceConfig);
}
//# sourceMappingURL=experience-section.js.map