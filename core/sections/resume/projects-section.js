/**
 * Resume projects section builder
 */

import theme from '../../../theme.js';
import { createItemSection } from '../../formatting/section-utilities.js';

/**
 * Creates the projects section using the generic createItemSection function
 * @param {Array} projects - Array of project entries
 * @returns {Array} Array of paragraphs for the projects section
 */
export function createProjects(projects) {
  const projectsConfig = {
    sectionTitle: theme.ats.sectionTitles.projects,
    descriptionField: 'description',
    highlightsField: 'highlights',
    descriptionSpacing: theme.spacingTwips.large, // 6pt
    headerLines: [
      {
        // Project name
        field: 'name',
        spacing: theme.spacingTwips.afterJobTitle, // 3pt
        keepNext: true,
      },
    ],
    itemSpacing: theme.spacingTwips.afterProjectEntry, // 9pt after each project entry
  };

  return createItemSection(projects, projectsConfig);
}