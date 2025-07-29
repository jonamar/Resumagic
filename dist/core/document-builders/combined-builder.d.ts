import { Document } from 'docx';
interface CoverLetterData {
    basics: any;
    coverLetter: {
        metadata: any;
        content: any[];
    };
}
interface ResumeData {
    basics: any;
    work: any[];
    skills: any[];
    education: any[];
    projects?: any[];
    publications?: any[];
    languages?: any[];
}
interface CombinedOptions {
}
export declare function createCombinedDocx(coverLetterData: CoverLetterData, resumeData: ResumeData, _options?: CombinedOptions): Document;
export {};
//# sourceMappingURL=combined-builder.d.ts.map