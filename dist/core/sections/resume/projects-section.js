import theme from '../../../theme.js';
import { createItemSection } from '../../formatting/section-utilities.js';
export function createProjects(projects) {
    const projectsConfig = {
        sectionTitle: theme.ats.sectionTitles.projects,
        descriptionField: 'description',
        highlightsField: 'highlights',
        descriptionSpacing: theme.spacing.twips.large,
        headerLines: [
            {
                field: 'name',
                spacing: theme.spacing.twips.afterJobTitle,
                keepNext: true,
            },
        ],
        itemSpacing: theme.spacing.twips.afterProjectEntry,
    };
    return createItemSection(projects, projectsConfig);
}
//# sourceMappingURL=projects-section.js.map