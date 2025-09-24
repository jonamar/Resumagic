/**
 * Resume experience section builder
 */

import { Paragraph, TextRun } from 'docx';
import theme from '../../../../theme.js';
import { formatDate } from '../../../../core/formatting/date-utilities.js';
import { createFormattedTextRuns } from '../../formatting/text-formatting.js';

interface WorkExperience {
  position?: string;
  name?: string;
  startDate?: string;
  endDate?: string;
  location?: string;
  summary?: string;
  highlights?: string[];
}

/**
 * Creates the experience section using the generic createItemSection function
 * @param work - Array of work experiences
 * @returns Array of paragraphs for the experience section
 */
export function createExperience(work: WorkExperience[]): Paragraph[] {
  const paragraphs: Paragraph[] = [];

  // Section heading (no extra before spacing; summary handles pre-gap)
  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: theme.ats.sectionTitles.experience.toUpperCase(),
          size: theme.typography.fontSize.sectionHeading * 2,
          font: 'Arial',
          color: theme.colors.headings,
          bold: true,
        }),
      ],
      spacing: { before: 0, after: theme.spacing.twips.large },
      keepNext: true,
    }),
  );

  work.forEach((item, index) => {
    const isLast = index === work.length - 1;

    // Line 1: Position (bold)
    if (item.position) {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: item.position,
              size: theme.typography.fontSize.body * 2,
              font: theme.typography.fonts.primary,
              bold: true,
              color: theme.colors.text,
            }),
          ],
          spacing: { after: theme.spacing.twips.afterJobTitle, line: theme.spacing.twips.resumeLine },
          keepNext: true,
        }),
      );
    }

    // Line 2: Company • start - end • location (meta styling)
    const start = item.startDate ? formatDate(item.startDate) : '';
    const end = item.endDate ? formatDate(item.endDate) : 'Present';
    const dateRange = start || end ? `${start} - ${end}` : '';
    const parts: string[] = [];
    if (item.name) parts.push(item.name);
    if (dateRange) parts.push(dateRange);
    if (item.location) parts.push(item.location);
    const metaLine = parts.join(' • ');

    if (metaLine) {
      paragraphs.push(
        new Paragraph({
          children: createFormattedTextRuns(metaLine, {
            size: theme.typography.fontSize.meta * 2,
            font: theme.typography.fonts.primary,
            color: theme.colors.dimText,
          }),
          spacing: { after: theme.spacing.twips.minimal, line: theme.spacing.twips.resumeLine },
          keepNext: !!(item.summary || (item.highlights && item.highlights.length)),
        }),
      );
    }

    // Description
    if (item.summary) {
      paragraphs.push(
        new Paragraph({
          children: createFormattedTextRuns(item.summary, {
            size: theme.typography.fontSize.body * 2,
            font: theme.typography.fonts.primary,
            color: theme.colors.text,
          }),
          spacing: { after: theme.spacing.twips.afterSummary, line: theme.spacing.twips.resumeLine },
          keepLines: true,
          keepNext: !!(item.highlights && item.highlights.length),
        }),
      );
    }

    // Highlights as bullets
    if (item.highlights && item.highlights.length > 0) {
      item.highlights.forEach((hl, i) => {
        const isLastHighlight = i === item.highlights!.length - 1;
        paragraphs.push(
          new Paragraph({
            children: createFormattedTextRuns(hl, {
              size: theme.typography.fontSize.body * 2,
              font: theme.typography.fonts.primary,
              color: theme.colors.text,
            }),
            numbering: { reference: 'small-bullet', level: 0 },
            spacing: { after: theme.spacing.twips.afterBullet, line: theme.spacing.twips.resumeLine },
            indent: { left: theme.spacing.twips.bulletIndent, hanging: theme.spacing.twips.bulletHanging },
            keepLines: true,
            keepNext: !isLastHighlight,
          }),
        );
      });
    }

    // Add spacing after each job entry, but not after the last one
    if (!isLast) {
      paragraphs.push(
        new Paragraph({
          text: '',
          spacing: {
            after: theme.spacing.twips.afterJobEntry, // 4pt after each job entry
          },
        }),
      );
    }
  });

  return paragraphs;
}
