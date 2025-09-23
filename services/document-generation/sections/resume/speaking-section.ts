/**
 * Resume speaking engagements section builder
 */

import { Paragraph } from 'docx';
import theme from '../../../../theme.js';
import { formatDate } from '../../../../core/formatting/date-utilities.js';
import { createItemSection } from '../../formatting/section-utilities.js';

interface Publication {
  name: string;
  publisher?: string;
  releaseDate?: string;
  summary?: string;
  highlights?: string[];
}

/**
 * Creates the speaking engagements section using the generic createItemSection function
 * @param publications - Array of publication/speaking entries
 * @returns Array of paragraphs for the speaking engagements section
 */
export function createSpeakingEngagements(publications: Publication[]): Paragraph[] {
  const speakingConfig = {
    sectionTitle: theme.ats.sectionTitles.speakingEngagements,
    descriptionField: 'summary',
    highlightsField: 'highlights',
    descriptionSpacing: theme.spacing.twips.large, // 6pt
    headerLines: [
      {
        // Speaking engagement name/title
        field: 'name',
        spacing: theme.spacing.twips.afterJobTitle, // 3pt
        keepNext: true,
      },
      {
        // Publisher/venue
        field: 'publisher',
        spacing: theme.spacing.twips.afterCompanyName, // 3pt
        keepNext: true,
      },
      {
        // Date
        field: 'releaseDate',
        format: formatDate,
        fontSize: theme.typography.fontSize.meta,
        color: theme.colors.dimText,
        bold: false,
        conditionalSpacing: {
          withContent: theme.spacing.twips.afterDate, // 4pt if more content
          standalone: (isLastItem: boolean) => isLastItem ? theme.spacing.twips.large : theme.spacing.twips.afterSectionEntry, // 6pt if last entry, 12pt between entries
        },
      },
    ],
    // Complex highlight spacing for speaking engagements
    highlightSpacing: (isLastItem: boolean) => {
      return isLastItem ? theme.spacing.twips.large : theme.spacing.twips.afterSectionEntry; // 6pt after last entry, 12pt between entries
    },
    // No itemSpacing - speaking engagements don't add extra space after each entry
  };

  return createItemSection(publications, speakingConfig);
}
