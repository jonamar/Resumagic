import { Paragraph, TextRun, HeadingLevel } from 'docx';
import theme from '../../theme.js';
import { createFormattedTextRuns } from './text-formatting.js';
export function createItemSection(items, config) {
    const paragraphs = [];
    paragraphs.push(createSectionHeading(config.sectionTitle));
    items.forEach((item, itemIndex) => {
        const isLastItem = itemIndex === items.length - 1;
        const hasDescription = config.descriptionField && item[config.descriptionField];
        const hasHighlights = config.highlightsField && item[config.highlightsField] && item[config.highlightsField].length > 0;
        const hasMoreContent = hasDescription || hasHighlights;
        config.headerLines.forEach((headerConfig, headerIndex) => {
            const isLastHeader = headerIndex === config.headerLines.length - 1;
            let headerText = '';
            if (headerConfig.fields) {
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
                    const dateText = parts.join(headerConfig.separator || ' - ');
                    headerText = dateText + (headerConfig.locationSeparator || ' • ') + item.location;
                }
                else {
                    headerText = parts.join(headerConfig.separator || ' - ');
                }
            }
            else if (headerConfig.field && item[headerConfig.field]) {
                headerText = item[headerConfig.field];
            }
            if (!headerText) {
                return;
            }
            let spacing = headerConfig.spacing || theme.spacing.twips.afterJobTitle;
            let keepNext = headerConfig.keepNext !== false;
            if (isLastHeader) {
                keepNext = hasMoreContent;
                if (headerConfig.conditionalSpacing) {
                    if (hasMoreContent) {
                        spacing = headerConfig.conditionalSpacing.withContent;
                    }
                    else {
                        spacing = typeof headerConfig.conditionalSpacing.standalone === 'function' ?
                            headerConfig.conditionalSpacing.standalone(isLastItem, itemIndex) :
                            headerConfig.conditionalSpacing.standalone;
                    }
                }
            }
            paragraphs.push(new Paragraph({
                children: [
                    new TextRun({
                        text: headerText,
                        size: (headerConfig.fontSize || theme.typography.fontSize.body) * 2,
                        font: theme.typography.fonts.primary,
                        bold: headerConfig.bold !== false,
                        color: headerConfig.color || theme.colors.text,
                    }),
                ],
                spacing: {
                    after: spacing,
                    line: theme.spacing.twips.resumeLine,
                },
                keepNext: keepNext,
            }));
        });
        if (hasDescription) {
            paragraphs.push(new Paragraph({
                children: createFormattedTextRuns(item[config.descriptionField], {
                    size: theme.typography.fontSize.body * 2,
                    font: theme.typography.fonts.primary,
                    color: theme.colors.text,
                }),
                spacing: {
                    after: config.descriptionSpacing || theme.spacing.twips.large,
                    line: theme.spacing.twips.resumeLine,
                },
                keepLines: true,
                keepNext: hasHighlights,
            }));
        }
        if (hasHighlights) {
            item[config.highlightsField].forEach((highlight, highlightIndex) => {
                const isLastHighlight = highlightIndex === item[config.highlightsField].length - 1;
                let highlightSpacing = theme.spacing.twips.afterBullet;
                if (config.highlightSpacing && isLastHighlight) {
                    if (typeof config.highlightSpacing === 'function') {
                        highlightSpacing = config.highlightSpacing(isLastItem, itemIndex);
                    }
                    else {
                        highlightSpacing = config.highlightSpacing;
                    }
                }
                paragraphs.push(new Paragraph({
                    children: createFormattedTextRuns(highlight, {
                        size: theme.typography.fontSize.body * 2,
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
                        left: theme.spacing.twips.bulletIndent,
                        hanging: theme.spacing.twips.bulletHanging,
                    },
                    keepLines: true,
                    keepNext: !isLastHighlight,
                }));
            });
        }
        if (config.itemSpacing) {
            let spacing = config.itemSpacing;
            if (typeof spacing === 'function') {
                spacing = spacing(isLastItem, itemIndex);
            }
            paragraphs.push(new Paragraph({
                text: '',
                spacing: {
                    after: spacing,
                },
            }));
        }
    });
    return paragraphs;
}
export function createSectionHeading(title, pageBreak = false) {
    return new Paragraph({
        children: [
            new TextRun({
                text: title.toUpperCase(),
                size: theme.typography.fontSize.sectionHeading * 2,
                font: 'Arial',
                color: theme.colors.headings,
                bold: true,
            }),
        ],
        heading: HeadingLevel.HEADING_2,
        spacing: {
            before: 400,
            after: theme.spacing.twips.large,
        },
        keepNext: true,
        pageBreakBefore: pageBreak,
    });
}
//# sourceMappingURL=section-utilities.js.map