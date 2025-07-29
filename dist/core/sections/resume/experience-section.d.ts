import { Paragraph } from 'docx';
interface WorkExperience {
    position?: string;
    name?: string;
    startDate?: string;
    endDate?: string;
    location?: string;
    summary?: string;
    highlights?: string[];
}
export declare function createExperience(work: WorkExperience[]): Paragraph[];
export {};
//# sourceMappingURL=experience-section.d.ts.map