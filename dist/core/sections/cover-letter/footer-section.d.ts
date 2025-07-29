import { Paragraph } from 'docx';
interface Location {
    city?: string;
    region?: string;
    country?: string;
}
interface Profile {
    url: string;
}
interface Basics {
    location?: Location;
    phone?: string;
    email?: string;
    profiles?: Profile[];
}
export declare function createCoverLetterFooter(basics: Basics, isComboMode?: boolean): Paragraph[];
export {};
//# sourceMappingURL=footer-section.d.ts.map