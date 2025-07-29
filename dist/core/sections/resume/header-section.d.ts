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
    name: string;
    email?: string;
    phone?: string;
    location?: Location;
    profiles?: Profile[];
}
export declare function createHeader(basics: Basics): Paragraph[];
export {};
//# sourceMappingURL=header-section.d.ts.map