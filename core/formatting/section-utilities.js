/**
 * Section building utilities for DOCX document generation
 */

import { Paragraph, TextRun, HeadingLevel } from 'docx';
import theme from '../../theme.js';
import { createFormattedTextRuns } from './text-formatting.js';

/**
 * Generic function to create item sections (experience, education, etc.)
 * @param {Array} items - Array of items to process
 * @param {Object} config - Configuration object for section formatting
 * @returns {Array} Array of paragraphs for the section
 */
export function createItemSection(items, config) {
  const paragraphs = [];

  // Add section heading
  paragraphs.push(
    createSectionHeading(config.sectionTitle),
  );

  // Process each item
  items.forEach((item, itemIndex) => {
    const isLastItem = itemIndex === items.length - 1;
    
    // Determine if item has additional content beyond headers
    const hasDescription = config.descriptionField && item[config.descriptionField];
    const hasHighlights = config.highlightsField && item[config.highlightsField] && item[config.highlightsField].length > 0;
    const hasMoreContent = hasDescription || hasHighlights;

    // Create header lines based on configuration
    config.headerLines.forEach((headerConfig, headerIndex) => {
      const isLastHeader = headerIndex === config.headerLines.length - 1;
      
      // Get the text for this header line
      let headerText = '';
      if (headerConfig.fields) {
        // Combine multiple fields (e.g., startDate + endDate + location)
        const parts = [];
        headerConfig.fields.forEach(fieldConfig => {
          if (fieldConfig.field && item[fieldConfig.field]) {
            let value = item[fieldConfig.field];
            if (fieldConfig.format) {
              value = fieldConfig.format(value);
            }
            parts.push(value);
          }
        });
        if (headerConfig.includeLocation && item.location) {
          // Join date fields with the main separator, then add location with locationSeparator
          const dateText = parts.join(headerConfig.separator || ' - ');
          headerText = dateText + (headerConfig.locationSeparator || ' • ') + item.location;
        } else {
          headerText = parts.join(headerConfig.separator || ' - ');
        }
      } else if (headerConfig.field && item[headerConfig.field]) {
        headerText = item[headerConfig.field];
      }

      // Skip if no text to show
      if (!headerText) {
        return;
      }

      // Determine spacing and keepNext logic
      let spacing = headerConfig.spacing || theme.spacing.twips.afterJobTitle;
      let keepNext = headerConfig.keepNext !== false; // Default to true unless explicitly false
      
      // For the last header, determine keepNext based on additional content
      if (isLastHeader) {
        keepNext = hasMoreContent;
        if (headerConfig.conditionalSpacing) {
          if (hasMoreContent) {
            spacing = headerConfig.conditionalSpacing.withContent;
          } else {
            spacing = typeof headerConfig.conditionalSpacing.standalone === 'function' ? 
              headerConfig.conditionalSpacing.standalone(isLastItem, itemIndex) :
              headerConfig.conditionalSpacing.standalone;
          }
        }
      }

      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: headerText,
              size: (headerConfig.fontSize || theme.typography.fontSize.body) * 2, // Convert to half-points
              font: theme.typography.fonts.primary,
              bold: headerConfig.bold !== false, // Default to bold unless explicitly false
              color: headerConfig.color || theme.colors.text,
            }),
          ],
          spacing: {
            after: spacing,
            line: theme.spacing.twips.resumeLine,
          },
          keepNext: keepNext,
        }),
      );
    });

    // Add description if present
    if (hasDescription) {
      paragraphs.push(
        new Paragraph({
          children: createFormattedTextRuns(item[config.descriptionField], {
            size: theme.typography.fontSize.body * 2, // Convert to half-points
            font: theme.typography.fonts.primary,
            color: theme.colors.text,
          }),
          spacing: {
            after: config.descriptionSpacing || theme.spacing.twips.large, // 6pt
            line: theme.spacing.twips.resumeLine,
          },
          keepLines: true, // Keep description lines together
          keepNext: hasHighlights, // Keep with highlights if they exist
        }),
      );
    }

    // Add highlights as bullet points if present
    if (hasHighlights) {
      item[config.highlightsField].forEach((highlight, highlightIndex) => {
        const isLastHighlight = highlightIndex === item[config.highlightsField].length - 1;
        
        // Calculate spacing for highlights
        let highlightSpacing = theme.spacing.twips.afterBullet;
        if (config.highlightSpacing && isLastHighlight) {
          if (typeof config.highlightSpacing === 'function') {
            highlightSpacing = config.highlightSpacing(isLastItem, itemIndex);
          } else {
            highlightSpacing = config.highlightSpacing;
          }
        }
        
        paragraphs.push(
          new Paragraph({
            children: createFormattedTextRuns(highlight, {
              size: theme.typography.fontSize.body * 2, // Convert to half-points
              font: theme.typography.fonts.primary,
              color: theme.colors.text,
            }),
            numbering: {
              reference: 'small-bullet',
              level: 0,
            },
            spacing: {
              after: highlightSpacing,
              line: theme.spacing.twips.resumeLine,
            },
            indent: {
              left: theme.spacing.twips.bulletIndent, // 0.25 inch left indent for bullet
              hanging: theme.spacing.twips.bulletHanging, // 0.25 inch hanging indent so text aligns properly
            },
            keepLines: true, // Keep long bullet points together
            keepNext: !isLastHighlight, // Keep with next highlight (but not after the last one)
          }),
        );
      });
    }

    // Add spacing after each item entry
    if (config.itemSpacing) {
      let spacing = config.itemSpacing;
      if (typeof spacing === 'function') {
        spacing = spacing(isLastItem, itemIndex);
      }
      
      paragraphs.push(
        new Paragraph({
          text: '',
          spacing: {
            after: spacing,
          },
        }),
      );
    }
  });

  return paragraphs;
}

/**
 * Helper function to create section headings
 * @param {String} title - Section title
 * @param {boolean} pageBreak - Whether to add a page break before the section
 * @returns {Paragraph} Section heading paragraph
 */
export function createSectionHeading(title, pageBreak = false) {
  return new Paragraph({
    children: [
      new TextRun({
        text: title.toUpperCase(),
        size: theme.typography.fontSize.sectionHeading * 2, // Convert to half-points
        font: 'Arial', // Set Arial as the default font for all runs
        color: theme.colors.headings,
        bold: true,
      }),
    ],
    heading: HeadingLevel.HEADING_2,
    spacing: {
      before: 400, // 20pt
      after: theme.spacing.twips.large,   // 6pt
    },
    keepNext: true, // Prevent section headings from being orphaned on previous page
    pageBreakBefore: pageBreak, // Add page break if requested
    // Border removed to eliminate unwanted underlines
  });
}