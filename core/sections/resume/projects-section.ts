/**
 * Resume projects section builder
 */

import { Paragraph } from 'docx';
import theme from '../../../theme.js';
import { createItemSection } from '../../formatting/section-utilities.js';

interface Project {
  name: string;
  description?: string;
  highlights?: string[];
}

/**
 * Creates the projects section using the generic createItemSection function
 * @param projects - Array of project entries
 * @returns Array of paragraphs for the projects section
 */
export function createProjects(projects: Project[]): Paragraph[] {
  const projectsConfig = {
    sectionTitle: theme.ats.sectionTitles.projects,
    descriptionField: 'description',
    highlightsField: 'highlights',
    descriptionSpacing: theme.spacing.twips.large, // 6pt
    headerLines: [
      {
        // Project name
        field: 'name',
        spacing: theme.spacing.twips.afterJobTitle, // 3pt
        keepNext: true,
      },
    ],
    itemSpacing: theme.spacing.twips.afterProjectEntry, // 9pt after each project entry
  };

  return createItemSection(projects, projectsConfig);
}
