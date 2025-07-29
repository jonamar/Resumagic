import { Paragraph } from 'docx';
interface TextPart {
    text: string;
    bold?: boolean;
    italic?: boolean;
}
interface ContentSection {
    type: 'paragraph' | 'list';
    text?: TextPart[];
    items?: TextPart[][];
}
export declare function createCoverLetterContent(content: ContentSection[]): Paragraph[];
export {};
//# sourceMappingURL=content-section.d.ts.map