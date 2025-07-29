import { Paragraph } from 'docx';
interface Publication {
    name: string;
    publisher?: string;
    releaseDate?: string;
    summary?: string;
    highlights?: string[];
}
export declare function createSpeakingEngagements(publications: Publication[]): Paragraph[];
export {};
//# sourceMappingURL=speaking-section.d.ts.map