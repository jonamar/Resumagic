import { Paragraph } from 'docx';
interface Education {
    area: string;
    studyType?: string;
    institution: string;
    startDate: string;
    endDate?: string;
    location?: string;
}
export declare function createEducation(education: Education[]): Paragraph[];
export {};
//# sourceMappingURL=education-section.d.ts.map