/**
 * TypeScript Interface Contracts for Standardized Services
 * Part of Phase 5: Architectural Review & TypeScript Strategy
 */

// Base Service Response Types

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

// Base Service Interface

export interface BaseServiceWrapper {
  serviceName: string;
  
  /**
   * Get the service name
   * @returns {string} The service name
   */
  getServiceName(): string;
  
  /**
   * Main service operation that wraps legacy/standardized implementations
   * @returns {Promise<ServiceResponse<any>>}
   */
  execute(): Promise<ServiceResponse<any>>;
}

// Keyword Analysis Service Contract

export interface KeywordAnalysisInput {
  applicationName: string;
  keywordsFile: string;
  jobPostingFile: string;
  resumeFile?: string;
  topCount?: number;
}

export interface KeywordAnalysisData {
  analysis: any; // TODO: Define specific structure
  command: string;
  implementation: string;
}

export interface KeywordAnalysisService extends BaseServiceWrapper {
  /**
   * Analyze keywords for a job application
   * @param {KeywordAnalysisInput} input - Analysis input
   * @returns {Promise<ServiceResponse<KeywordAnalysisData>>}
   */
  analyze(input: KeywordAnalysisInput): Promise<ServiceResponse<KeywordAnalysisData>>;
  
  /**
   * Get analysis recommendations based on keywords
   * @param {KeywordAnalysisInput} input - Recommendation input
   * @returns {Promise<ServiceResponse<any>>}
   */
  getRecommendations(input: KeywordAnalysisInput): Promise<ServiceResponse<any>>;
}

// Hiring Evaluation Service Contract

export interface HiringEvaluationInput {
  applicationName: string;
  resumeData: any; // TODO: Define specific structure
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
  /**
   * Evaluate hiring potential for a candidate
   * @param {HiringEvaluationInput} input - Evaluation input
   * @returns {Promise<ServiceResponse<HiringEvaluationData>>}
   */
  evaluate(input: HiringEvaluationInput): Promise<ServiceResponse<HiringEvaluationData>>;
}

// Document Generation Service Contract

export interface DocumentGenerationInput {
  applicationName: string;
  resumeData: any; // TODO: Define specific structure
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
  /**
   * Generate a document (resume, cover letter, or combined)
   * @param {DocumentGenerationInput} input - Generation input
   * @returns {Promise<ServiceResponse<DocumentGenerationData>>}
   */
  generate(input: DocumentGenerationInput): Promise<ServiceResponse<DocumentGenerationData>>;
}

// Vale Linting Service Contract

export interface ValeLintingInput {
  applicationName: string;
  content: string;
  contentType: 'resume' | 'cover-letter' | 'combined';
}

export interface ValeLintingData {
  results: any[]; // TODO: Define specific structure
  implementation: string;
}

export interface ValeLintingService extends BaseServiceWrapper {
  /**
   * Lint content using Vale
   * @param {ValeLintingInput} input - Linting input
   * @returns {Promise<ServiceResponse<ValeLintingData>>}
   */
  lint(input: ValeLintingInput): Promise<ServiceResponse<ValeLintingData>>;
}
