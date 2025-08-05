import path from 'path';
import fs from 'fs';
import theme from '../theme';
import ErrorHandler from '../utils/error-handler';
import { ERROR_TYPES } from '../utils/error-types';

/**
 * Path Resolution Module
 * Handles file path resolution, validation, and company name extraction
 * Includes support for canonical source and test directories
 */

interface ResolvedPaths {
  companyName: string;
  applicationFolderPath: string;
  inputsDir: string;
  outputsDir: string;
  resumeDataPath: string;
  markdownFilePath: string;
  resumeDocxPath: string;
  coverLetterDocxPath: string;
  combinedDocxPath: string;
}

interface ValidationResult {
  isValid: boolean;
  error?: string;
  errorType?: string;
  details?: string[];
  data?: unknown;
}

interface LoadResult {
  isValid: boolean;
  data?: unknown;
  error?: string;
  errorType?: string;
}

interface CanonicalPaths {
  canonicalDir: string;
  inputsDir: string;
  workingDir: string;
  outputsDir: string;
  resumeFile: string;
  coverLetterFile: string;
  jobPostingFile: string;
}

interface TestPaths {
  testApplicationPath: string;
  inputsDir: string;
  outputsDir: string;
  resumeFile: string;
  coverLetterFile: string;
}

/**
 * Extracts company name from folder name (e.g., "relay-director-of-product" -> "Relay")
 */
function extractCompanyFromFolderName(folderName: string): string {
  // Take the first part before the first hyphen and capitalize it
  const companyPart = folderName.split('-')[0];
  return companyPart.charAt(0).toUpperCase() + companyPart.slice(1);
}

/**
 * Resolves all file paths for a given application
 */
function resolvePaths(applicationName: string, baseDir: string, isTest = false): ResolvedPaths {
  const companyName = extractCompanyFromFolderName(applicationName);
  
  // Set up application folder paths - use test directory if in test mode
  const applicationsDir = isTest ? theme.fileNaming.testDir : theme.fileNaming.applicationsDir;
  const applicationFolderPath = path.resolve(baseDir, theme.fileNaming.dataDir, applicationsDir, applicationName);
  const inputsDir = path.join(applicationFolderPath, theme.fileNaming.inputsDir);
  const outputsDir = path.join(applicationFolderPath, theme.fileNaming.outputsDir);
  
  // Input file paths
  const resumeDataPath = path.join(inputsDir, theme.fileNaming.resumeFile);
  const markdownFilePath = path.join(inputsDir, theme.fileNaming.coverLetterFile);
  
  // Output file paths with HR-friendly naming
  const resumeDocxPath = path.join(outputsDir, theme.fileNaming.resumePattern.replace('{company}', companyName));
  const coverLetterDocxPath = path.join(outputsDir, theme.fileNaming.coverLetterPattern.replace('{company}', companyName));
  const combinedDocxPath = path.join(outputsDir, theme.fileNaming.combinedPattern.replace('{company}', companyName));
  
  return {
    companyName,
    applicationFolderPath,
    inputsDir,
    outputsDir,
    resumeDataPath,
    markdownFilePath,
    resumeDocxPath,
    coverLetterDocxPath,
    combinedDocxPath,
  };
}

/**
 * Validates that required paths exist and creates output directory if needed
 */
function validatePaths(paths: ResolvedPaths): ValidationResult {
  const { applicationFolderPath, resumeDataPath, outputsDir } = paths;
  
  // Verify the application folder exists
  if (!fs.existsSync(applicationFolderPath) || !fs.statSync(applicationFolderPath).isDirectory()) {
    const context = ErrorHandler.buildFileContext(applicationFolderPath, {
      operation: 'application folder validation',
      required: true,
      expectedType: 'directory',
    });
    
    ErrorHandler.logAppError(
      'Application folder not found or not a directory',
      ERROR_TYPES.FILE_NOT_FOUND,
      context,
    );
    
    return ErrorHandler.createResult(
      false,
      null,
      theme.messages.errors.applicationNotFound.replace('{path}', applicationFolderPath),
      ERROR_TYPES.FILE_NOT_FOUND,
      [],
      'APPLICATION_NOT_FOUND',
    );
  }
  
  // Verify the resume file exists
  if (!fs.existsSync(resumeDataPath)) {
    const context = ErrorHandler.buildFileContext(resumeDataPath, {
      operation: 'resume data validation',
      required: true,
      expectedType: 'file',
    });
    
    ErrorHandler.logAppError(
      'Resume data file not found',
      ERROR_TYPES.FILE_NOT_FOUND,
      context,
    );
    
    return ErrorHandler.createResult(
      false,
      null,
      theme.messages.errors.resumeNotFound.replace('{path}', resumeDataPath),
      ERROR_TYPES.FILE_NOT_FOUND,
      [theme.messages.errors.resumeRequired],
      'RESUME_NOT_FOUND',
    );
  }
  
  // Ensure outputs directory exists
  if (!fs.existsSync(outputsDir)) {
    try {
      fs.mkdirSync(outputsDir, { recursive: true });
    } catch (error) {
      const context = ErrorHandler.buildFileContext(outputsDir, {
        operation: 'output directory creation',
        error: error.message,
        required: true,
      });
      
      ErrorHandler.logAppError(
        'Failed to create outputs directory',
        ERROR_TYPES.FILE_SYSTEM_ERROR,
        context,
      );
      
      return ErrorHandler.createResult(
        false,
        null,
        `Failed to create outputs directory: ${error.message}`,
        ERROR_TYPES.FILE_SYSTEM_ERROR,
        [],
        'OUTPUT_DIR_CREATION_FAILED',
      );
    }
  }
  
  return ErrorHandler.createResult(true);
}

/**
 * Checks if a markdown cover letter file exists
 */
function hasMarkdownFile(markdownFilePath: string): boolean {
  return fs.existsSync(markdownFilePath);
}

/**
 * Loads and validates resume data from JSON file
 */
function loadResumeData(resumeDataPath: string): LoadResult {
  try {
    // Use fs.readFileSync to load JSON data
    const resumeDataRaw = fs.readFileSync(resumeDataPath, 'utf8');
    const resumeData = JSON.parse(resumeDataRaw);
    
    return {
      isValid: true,
      data: resumeData,
    };
  } catch (error) {
    return {
      isValid: false,
      error: `Error loading resume data: ${error.message}`,
      errorType: 'RESUME_DATA_INVALID',
    };
  }
}

/**
 * Gets information about available applications for error messages
 */
function getAvailableApplications(baseDir: string): string[] {
  const applicationsDir = path.resolve(baseDir, theme.fileNaming.dataDir, theme.fileNaming.applicationsDir);
  
  if (!fs.existsSync(applicationsDir)) {
    return [];
  }
  
  return fs.readdirSync(applicationsDir)
    .filter(item => {
      const itemPath = path.join(applicationsDir, item);
      return fs.statSync(itemPath).isDirectory();
    });
}

/**
 * Displays application not found error with helpful information
 */
function displayApplicationNotFoundError(applicationName: string, baseDir: string): void {
  const applicationsDir = path.resolve(baseDir, theme.fileNaming.dataDir, theme.fileNaming.applicationsDir);
  const applicationFolderPath = path.join(applicationsDir, applicationName);
  
  console.error(`${theme.messages.emojis.error} ${theme.messages.errors.applicationNotFound.replace('{path}', applicationFolderPath)}`);
  
  // Show available applications
  const availableApps = getAvailableApplications(baseDir);
  if (availableApps.length > 0) {
    console.error(theme.messages.usage.availableApplications);
    availableApps.forEach(app => console.error(`  - ${app}`));
  } else {
    console.error(theme.messages.usage.noApplications);
  }
  
  console.error('');
  console.error(theme.messages.usage.createApplication);
  console.error(theme.messages.usage.createCommand.replace('{name}', applicationName));
}

/**
 * Resolves paths for canonical source directory
 */
function resolveCanonicalPaths(baseDir: string): CanonicalPaths {
  const canonicalDir = path.resolve(baseDir, theme.fileNaming.dataDir, theme.fileNaming.canonicalDir);
  const inputsDir = path.join(canonicalDir, theme.fileNaming.inputsDir);
  const workingDir = path.join(canonicalDir, theme.fileNaming.workingDir || 'working');
  const outputsDir = path.join(canonicalDir, theme.fileNaming.outputsDir);
  
  return {
    canonicalDir,
    inputsDir,
    workingDir,
    outputsDir,
    resumeFile: path.join(inputsDir, theme.fileNaming.resumeFile),
    coverLetterFile: path.join(inputsDir, theme.fileNaming.coverLetterFile),
    jobPostingFile: path.join(inputsDir, 'job-posting.md'),
  };
}

/**
 * Resolves paths for test directory
 */
function resolveTestPaths(baseDir: string): TestPaths {
  const testApplicationPath = path.resolve(baseDir, theme.fileNaming.dataDir, theme.fileNaming.testDir, theme.fileNaming.testApplicationName);
  const inputsDir = path.join(testApplicationPath, theme.fileNaming.inputsDir);
  const outputsDir = path.join(testApplicationPath, theme.fileNaming.outputsDir);
  
  return {
    testApplicationPath,
    inputsDir,
    outputsDir,
    resumeFile: path.join(inputsDir, theme.fileNaming.resumeFile),
    coverLetterFile: path.join(inputsDir, theme.fileNaming.coverLetterFile),
  };
}

export {
  extractCompanyFromFolderName,
  resolvePaths,
  validatePaths,
  hasMarkdownFile,
  loadResumeData,
  getAvailableApplications,
  displayApplicationNotFoundError,
  resolveCanonicalPaths,
  resolveTestPaths,
}; 
