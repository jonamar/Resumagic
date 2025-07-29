import theme from '../../../theme.js';
import { formatDate } from '../../formatting/date-utilities.js';
import { createItemSection } from '../../formatting/section-utilities.js';
export function createSpeakingEngagements(publications) {
    const speakingConfig = {
        sectionTitle: theme.ats.sectionTitles.speakingEngagements,
        descriptionField: 'summary',
        highlightsField: 'highlights',
        descriptionSpacing: theme.spacing.twips.large,
        headerLines: [
            {
                field: 'name',
                spacing: theme.spacing.twips.afterJobTitle,
                keepNext: true,
            },
            {
                field: 'publisher',
                spacing: theme.spacing.twips.afterCompanyName,
                keepNext: true,
            },
            {
                field: 'releaseDate',
                format: formatDate,
                fontSize: theme.typography.fontSize.meta,
                color: theme.colors.dimText,
                bold: false,
                conditionalSpacing: {
                    withContent: theme.spacing.twips.afterDate,
                    standalone: (isLastItem) => isLastItem ? theme.spacing.twips.large : theme.spacing.twips.afterSectionEntry,
                },
            },
        ],
        highlightSpacing: (isLastItem) => {
            return isLastItem ? theme.spacing.twips.large : theme.spacing.twips.afterSectionEntry;
        },
    };
    return createItemSection(publications, speakingConfig);
}
//# sourceMappingURL=speaking-section.js.map