export interface ServiceMetadata {
    service: string;
    version: string;
    duration: number;
    timestamp: string;
}
export interface ServiceError {
    code: string;
    message: string;
    details?: any;
}
export interface ServiceResponseSuccess<T> {
    success: true;
    data: T;
    metadata: ServiceMetadata;
}
export interface ServiceResponseError {
    success: false;
    metadata: ServiceMetadata;
    error: ServiceError;
}
export type ServiceResponse<T> = ServiceResponseSuccess<T> | ServiceResponseError;
export interface BaseServiceWrapper {
    serviceName: string;
    getServiceName(): string;
    execute(): Promise<ServiceResponse<any>>;
}
export interface KeywordAnalysisInput {
    applicationName: string;
    keywordsFile: string;
    jobPostingFile: string;
    resumeFile?: string;
    topCount?: number;
}
export interface KeywordAnalysisData {
    analysis: any;
    command: string;
    implementation: string;
}
export interface KeywordAnalysisService extends BaseServiceWrapper {
    analyze(input: KeywordAnalysisInput): Promise<ServiceResponse<KeywordAnalysisData>>;
    getRecommendations(input: KeywordAnalysisInput): Promise<ServiceResponse<any>>;
}
export interface HiringEvaluationInput {
    applicationName: string;
    resumeData: any;
    fastMode?: boolean;
    jobPostingFile?: string;
}
export interface HiringEvaluationData {
    evaluation: {
        overall_score: number;
        summary: string;
        persona_evaluations: any[];
        recommendations: string[];
        composite_score: number;
        individual_scores: Record<string, number>;
    };
    candidate: {
        name: string;
        email?: string;
    };
    context: {
        applicationName: string;
        fastMode: boolean;
        evaluation_timestamp: string;
    };
    implementation: string;
}
export interface HiringEvaluationService extends BaseServiceWrapper {
    evaluate(input: HiringEvaluationInput): Promise<ServiceResponse<HiringEvaluationData>>;
}
export interface DocumentGenerationInput {
    applicationName: string;
    resumeData: any;
    coverLetterMarkdown?: string;
    outputPath: string;
    documentType: 'resume' | 'cover-letter' | 'combined';
}
export interface DocumentGenerationData {
    outputPath: string;
    documentType: string;
    fileSize: number;
    implementation: string;
}
export interface DocumentGenerationService extends BaseServiceWrapper {
    generate(input: DocumentGenerationInput): Promise<ServiceResponse<DocumentGenerationData>>;
}
export interface ValeLintingInput {
    applicationName: string;
    content: string;
    contentType: 'resume' | 'cover-letter' | 'combined';
}
export interface ValeLintingData {
    results: any[];
    implementation: string;
}
export interface ValeLintingService extends BaseServiceWrapper {
    lint(input: ValeLintingInput): Promise<ServiceResponse<ValeLintingData>>;
}
//# sourceMappingURL=service-contracts.d.ts.map