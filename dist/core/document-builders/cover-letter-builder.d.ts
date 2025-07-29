import { Document } from 'docx';
interface CoverLetterData {
    basics: any;
    coverLetter: {
        metadata: any;
        content: any[];
    };
}
interface CoverLetterOptions {
}
export declare function createCoverLetterDocx(coverLetterData: CoverLetterData, _options?: CoverLetterOptions): Document;
export {};
//# sourceMappingURL=cover-letter-builder.d.ts.map