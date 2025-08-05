/**
 * Direct Document Generation Service
 * Provides typed, direct functions for document generation without wrapper abstraction
 */

import * as documentOrchestrator from '../core/document-orchestration';
import { GenerationResult } from '../types/services';

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
  resumeData: any,
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
export async function generateResume(resumeData: any, outputPath: string): Promise<GenerationResult> {
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
  return generateDocument('cover-letter', {}, outputPath, markdownFilePath, resumeDataPath);
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
  resumeData: any,
  outputPath: string,
): Promise<GenerationResult> {
  return generateDocument('combined', resumeData, outputPath, markdownFilePath, resumeDataPath);
}
