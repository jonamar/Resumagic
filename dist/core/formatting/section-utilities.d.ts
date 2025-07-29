import { Paragraph } from 'docx';
interface FieldConfig {
    field: string;
    format?: (value: any) => string;
}
interface HeaderLineConfig {
    fields?: FieldConfig[];
    field?: string;
    spacing?: number;
    keepNext?: boolean;
    fontSize?: number;
    bold?: boolean;
    color?: string;
    separator?: string;
    includeLocation?: boolean;
    locationSeparator?: string;
    conditionalSpacing?: {
        withContent: number;
        standalone: number | ((isLastItem: boolean, itemIndex: number) => number);
    };
}
interface SectionConfig {
    sectionTitle: string;
    headerLines: HeaderLineConfig[];
    descriptionField?: string;
    highlightsField?: string;
    descriptionSpacing?: number;
    highlightSpacing?: number | ((isLastItem: boolean, itemIndex: number) => number);
    itemSpacing?: number | ((isLastItem: boolean, itemIndex: number) => number);
}
export declare function createItemSection(items: any[], config: SectionConfig): Paragraph[];
export declare function createSectionHeading(title: string, pageBreak?: boolean): Paragraph;
export {};
//# sourceMappingURL=section-utilities.d.ts.map