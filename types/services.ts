/**
 * Service Interface Definitions
 * Type definitions for direct service functions replacing wrapper pattern
 */

export interface KeywordAnalysis {
  keywords: string[];
  topSkills: string[];
  applicationName: string;
  analysis?: {
    matched_keywords?: string[];
    missing_keywords?: string[];
    keyword_scores?: Record<string, number>;
    recommendations?: string[];
  };
}

export interface HiringEvaluation {
  overallScore: number;
  summary: string;
  applicationName: string;
  fitScore?: number;
  matchedKeywords?: string[];
  missingKeywords?: string[];
  keyStrengths?: string[];
  composite_score?: number;
  persona_evaluations?: Array<{
    persona: string;
    score: number;
    feedback: string;
  }>;
  recommendations?: string[];
}

export interface DocumentOptions {
  applicationName: string;
  documentType: 'resume' | 'cover-letter' | 'combined';
  resumeData?: unknown;
  paths?: {
    resumeDocxPath?: string;
    coverLetterDocxPath?: string;
    combinedDocxPath?: string;
    coverLetterMarkdownPath?: string;
    resumeDataPath?: string;
  };
  autoPreview?: boolean;
}

export interface GenerationResult {
  filePath: string;
  documentType: string;
  files?: Array<{
    type: string;
    path: string;
    filename: string;
    size_bytes: number;
  }>;
  summary?: {
    total_files: number;
    successful: number;
    failed: number;
    resume_generated: boolean;
    cover_letter_generated: boolean;
    combined_generated: boolean;
  };
}

export interface KeywordAnalysisInput {
  applicationName: string;
  keywordsFile: string;
  jobPostingFile: string;
  resumeFile?: string;
  topCount?: number;
}

export interface HiringEvaluationInput {
  applicationName: string;
  resumeData: {
    personalInfo?: {
      name?: string;
      email?: string;
    };
    basics?: {
      name?: string;
      email?: string;
    };
  };
  fastMode?: boolean;
}
