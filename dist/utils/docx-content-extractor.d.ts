interface ValidationResult {
    valid: boolean;
    actualHash: string;
    content?: string;
}
interface ContentHashes {
    [fileName: string]: string;
}
export declare function extractDocxContent(filePath: string): Promise<string>;
export declare function extractTextFromWordXml(xmlContent: string): string;
export declare function generateContentHash(content: string): string;
export declare function validateDocxContentHash(filePath: string, expectedHash: string): Promise<ValidationResult>;
export declare function extractMultipleContentHashes(filePaths: string[]): Promise<ContentHashes>;
export {};
//# sourceMappingURL=docx-content-extractor.d.ts.map