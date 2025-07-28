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
    descriptionSpacing: theme.spacingTwips.afterSummary, // 4pt
    headerLines: [
      {
        // Job title/position
        field: 'position',
        spacing: theme.spacingTwips.afterJobTitle,
        keepNext: true,
      },
      {
        // Company name
        field: 'name',
        spacing: theme.spacingTwips.afterCompanyName,
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
        fontSize: theme.fontSize.meta,
        color: theme.colors.dimText,
        bold: false,
        conditionalSpacing: {
          withContent: theme.spacingTwips.minimal, // 1pt if more content
          standalone: theme.spacingTwips.afterDate,   // 4pt if standalone
        },
      },
    ],
    itemSpacing: theme.spacingTwips.afterJobEntry, // 4pt after each job entry
  };

  return createItemSection(work, experienceConfig);
}