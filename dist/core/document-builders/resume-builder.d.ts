import { Document } from 'docx';
interface ResumeData {
    basics: any;
    work: any[];
    skills: any[];
    education: any[];
    projects?: any[];
    publications?: any[];
    languages?: any[];
}
interface ResumeOptions {
}
export declare function createResumeDocx(resumeData: ResumeData, _options?: ResumeOptions): Document;
export {};
//# sourceMappingURL=resume-builder.d.ts.map