import path from 'path';
import fs from 'fs';
import theme from '../theme.js';
import { resolveCanonicalPaths } from './path-resolution.js';
import ErrorHandler from '../dist/utils/error-handler.js';
import { ERROR_TYPES } from '../dist/utils/error-types.js';

/**
 * New Application Creation Module
 * Handles automated creation of new application directories and files
 */

/**
 * Generates a proper application name from company and job title
 * @param {string} company - Company name
 * @param {string} jobTitle - Job title
 * @returns {string} Formatted application name
 */
function generateApplicationName(company, jobTitle) {
  // Convert to lowercase and replace spaces/special chars with hyphens
  const cleanCompany = company.toLowerCase().replace(/[^a-z0-9]/g, '-');
  const cleanJobTitle = jobTitle.toLowerCase().replace(/[^a-z0-9]/g, '-');
  
  // Remove multiple consecutive hyphens and leading/trailing hyphens
  const companyPart = cleanCompany.replace(/-+/g, '-').replace(/^-|-$/g, '');
  const jobPart = cleanJobTitle.replace(/-+/g, '-').replace(/^-|-$/g, '');
  
  return `${companyPart}-${jobPart}`;
}

/**
 * Creates a new application directory structure and copies canonical files
 * @param {string} company - Company name
 * @param {string} jobTitle - Job title
 * @param {string} baseDir - Base directory (typically app root)
 * @returns {Object} Result object with success status and application info
 */
function createNewApplication(company, jobTitle, baseDir) {
  try {
    // Generate application name
    const applicationName = generateApplicationName(company, jobTitle);
    
    // Set up paths
    const canonicalPaths = resolveCanonicalPaths(baseDir);
    const applicationsDir = path.resolve(baseDir, theme.fileNaming.dataDir, theme.fileNaming.applicationsDir);
    const newAppDir = path.join(applicationsDir, applicationName);
    
    // Check if application already exists
    if (fs.existsSync(newAppDir)) {
      return ErrorHandler.createResult(
        false,
        null,
        `Application already exists: ${applicationName}`,
        ERROR_TYPES.VALIDATION_ERROR,
        [`Directory already exists: ${newAppDir}`],
      );
    }
    
    // Verify canonical source exists
    if (!fs.existsSync(canonicalPaths.canonicalDir)) {
      return ErrorHandler.createResult(
        false,
        null,
        'Canonical source directory not found',
        ERROR_TYPES.FILE_NOT_FOUND,
        [
          `Expected canonical directory: ${canonicalPaths.canonicalDir}`,
          'Run data directory setup first',
        ],
      );
    }
    
    // Create application directory structure
    const inputsDir = path.join(newAppDir, theme.fileNaming.inputsDir);
    const workingDir = path.join(newAppDir, 'working');
    const outputsDir = path.join(newAppDir, theme.fileNaming.outputsDir);
    
    fs.mkdirSync(inputsDir, { recursive: true });
    fs.mkdirSync(workingDir, { recursive: true });
    fs.mkdirSync(outputsDir, { recursive: true });
    
    // Copy canonical files to new application
    const filesToCopy = [
      { src: canonicalPaths.resumeFile, dest: path.join(inputsDir, theme.fileNaming.resumeFile) },
      { src: canonicalPaths.coverLetterFile, dest: path.join(inputsDir, theme.fileNaming.coverLetterFile) },
      { src: canonicalPaths.jobPostingFile, dest: path.join(inputsDir, 'job-posting.md') },
    ];
    
    for (const file of filesToCopy) {
      if (fs.existsSync(file.src)) {
        fs.copyFileSync(file.src, file.dest);
      }
    }
    
    // Customize the job posting template with company and job title
    const jobPostingPath = path.join(inputsDir, 'job-posting.md');
    if (fs.existsSync(jobPostingPath)) {
      let jobPostingContent = fs.readFileSync(jobPostingPath, 'utf8');
      jobPostingContent = jobPostingContent
        .replace(/\[Company Name\]/g, company)
        .replace(/\[Job Title\]/g, jobTitle);
      fs.writeFileSync(jobPostingPath, jobPostingContent);
    }
    
    const result = {
      applicationName,
      applicationPath: newAppDir,
      company,
      jobTitle,
      filesCreated: [
        `${inputsDir}/${theme.fileNaming.resumeFile}`,
        `${inputsDir}/${theme.fileNaming.coverLetterFile}`,
        `${inputsDir}/job-posting.md`,
        workingDir,
        outputsDir,
      ],
    };
    
    return ErrorHandler.createResult(true, result);
    
  } catch (error) {
    return ErrorHandler.createResult(
      false,
      null,
      `Failed to create new application: ${error.message}`,
      ERROR_TYPES.INTERNAL_ERROR,
      [error.stack],
    );
  }
}

export {
  generateApplicationName,
  createNewApplication,
};
