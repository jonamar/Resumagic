/**
 * Direct Document Generation Service
 * Provides typed, direct functions for document generation without wrapper abstraction
 */

import * as documentOrchestrator from '../core/document-orchestration';
import { GenerationResult } from '../types/services';

// Resume data interface based on JSON Resume schema (actual data structure)
interface ResumeData {
  basics: {
    name: string;
    label: string;
    image?: string;
    email: string;
    phone: string;
    url?: string;
    summary: string;
    work_modes?: string;
    location: {
      address?: string;
      city: string;
      region: string;
      country: string;
      countryCode?: string;
      postalCode: string;
    };
    profiles: Array<{
      network: string;
      username: string;
      url: string;
    }>;
  };
  work: Array<{
    name: string;
    position: string;
    url?: string;
    location: string;
    startDate: string;
    endDate?: string;
    summary: string;
    highlights: string[];
  }>;
  // Additional optional sections
  education?: Array<{
    institution: string;
    area: string;
    studyType: string;
    startDate: string;
    endDate?: string;
    score?: string;
    courses?: string[];
  }>;
  skills?: Array<{
    name: string;
    level: string;
    keywords: string[];
  }>;
  projects?: Array<{
    name: string;
    description: string;
    highlights: string[];
    keywords: string[];
    startDate: string;
    endDate?: string;
    url?: string;
  }>;
}

/**
 * Generate documents based on type and options
 * @param documentType - Type of document to generate
 * @param resumeData - Resume data object
 * @param outputPath - Path where to save the document
 * @param markdownFilePath - Optional path to markdown file (for cover letters)
 * @param resumeDataPath - Optional path to resume data file (for cover letters)
 * @returns Promise resolving to generation result
 */
export async function generateDocument(
  documentType: 'resume' | 'cover-letter' | 'combined',
  resumeData: ResumeData,
  outputPath: string,
  markdownFilePath?: string,
  resumeDataPath?: string,
): Promise<GenerationResult> {
  try {
    let filePath: string;

    switch (documentType) {
    case 'resume':
      filePath = await documentOrchestrator.generateResumeDocument(resumeData, outputPath);
      break;
      
    case 'cover-letter':
      if (!markdownFilePath || !resumeDataPath) {
        throw new Error('Cover letter generation requires markdownFilePath and resumeDataPath');
      }
      filePath = await documentOrchestrator.generateCoverLetterDocument(
        markdownFilePath,
        resumeDataPath,
        outputPath,
      );
      break;
      
    case 'combined':
      if (!markdownFilePath || !resumeDataPath) {
        throw new Error('Combined document generation requires markdownFilePath and resumeDataPath');
      }
      filePath = await documentOrchestrator.generateCombinedDocument(
        markdownFilePath,
        resumeDataPath,
        resumeData,
        outputPath,
      );
      break;
      
    default:
      throw new Error(`Unsupported document type: ${documentType}`);
    }

    return {
      filePath,
      documentType,
    };

  } catch (error) {
    throw new Error(`Document generation failed: ${error.message}`);
  }
}

/**
 * Generate resume document
 * @param resumeData - Resume data object
 * @param outputPath - Path where to save the document
 * @returns Promise resolving to generation result
 */
export async function generateResume(resumeData: ResumeData, outputPath: string): Promise<GenerationResult> {
  return generateDocument('resume', resumeData, outputPath);
}

/**
 * Generate cover letter document
 * @param markdownFilePath - Path to markdown cover letter file
 * @param resumeDataPath - Path to resume data file
 * @param outputPath - Path where to save the document
 * @returns Promise resolving to generation result
 */
export async function generateCoverLetter(
  markdownFilePath: string,
  resumeDataPath: string,
  outputPath: string,
): Promise<GenerationResult> {
  // We need dummy resume data for the function signature, but it's not used for cover letters
  const dummyResumeData = {} as ResumeData;
  return generateDocument('cover-letter', dummyResumeData, outputPath, markdownFilePath, resumeDataPath);
}

/**
 * Generate combined document (cover letter + resume)
 * @param markdownFilePath - Path to markdown cover letter file
 * @param resumeDataPath - Path to resume data file
 * @param resumeData - Resume data object
 * @param outputPath - Path where to save the document
 * @returns Promise resolving to generation result
 */
export async function generateCombined(
  markdownFilePath: string,
  resumeDataPath: string,
  resumeData: ResumeData,
  outputPath: string,
): Promise<GenerationResult> {
  return generateDocument('combined', resumeData, outputPath, markdownFilePath, resumeDataPath);
}
