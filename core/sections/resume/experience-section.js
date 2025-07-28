/**
 * Resume experience section builder
 */

import theme from '../../../theme.js';
import { formatDate } from '../../formatting/date-utilities.js';
import { createItemSection } from '../../formatting/section-utilities.js';

/**
 * Creates the experience section using the generic createItemSection function
 * @param {Array} work - Array of work experiences
 * @returns {Array} Array of paragraphs for the experience section
 */
export function createExperience(work) {
  const experienceConfig = {
    sectionTitle: theme.ats.sectionTitles.experience,
    descriptionField: 'summary',
    highlightsField: 'highlights',
    descriptionSpacing: theme.spacing.twips.afterSummary, // 4pt
    headerLines: [
      {
        // Job title/position
        field: 'position',
        spacing: theme.spacing.twips.afterJobTitle,
        keepNext: true,
      },
      {
        // Company name
        field: 'name',
        spacing: theme.spacing.twips.afterCompanyName,
        keepNext: true,
      },
      {
        // Date and location
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
          withContent: theme.spacing.twips.minimal, // 1pt if more content
          standalone: theme.spacing.twips.afterDate,   // 4pt if standalone
        },
      },
    ],
    itemSpacing: theme.spacing.twips.afterJobEntry, // 4pt after each job entry
  };

  return createItemSection(work, experienceConfig);
}
