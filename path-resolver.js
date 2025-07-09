const path = require('path');
const fs = require('fs');
const theme = require('./theme');

/**
 * Path Resolver Module
 * Handles file path resolution, validation, and company name extraction
 */

/**
 * Extracts company name from folder name (e.g., "relay-director-of-product" -> "Relay")
 * @param {string} folderName - The application folder name
 * @returns {string} - Formatted company name
 */
function extractCompanyFromFolderName(folderName) {
  // Take the first part before the first hyphen and capitalize it
  const companyPart = folderName.split('-')[0];
  return companyPart.charAt(0).toUpperCase() + companyPart.slice(1);
}

/**
 * Resolves all file paths for a given application
 * @param {string} applicationName - Name of the application folder
 * @param {string} baseDir - Base directory (typically __dirname)
 * @returns {Object} Object containing all resolved paths
 */
function resolvePaths(applicationName, baseDir) {
  const companyName = extractCompanyFromFolderName(applicationName);
  
  // Set up application folder paths
  const applicationFolderPath = path.resolve(baseDir, theme.fileNaming.dataDir, theme.fileNaming.applicationsDir, applicationName);
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
    combinedDocxPath
  };
}

/**
 * Validates that required paths exist and creates output directory if needed
 * @param {Object} paths - Paths object from resolvePaths
 * @returns {Object} Validation result with isValid boolean and error details
 */
function validatePaths(paths) {
  const { applicationFolderPath, resumeDataPath, outputsDir } = paths;
  
  // Verify the application folder exists
  if (!fs.existsSync(applicationFolderPath) || !fs.statSync(applicationFolderPath).isDirectory()) {
    return {
      isValid: false,
      error: theme.messages.errors.applicationNotFound.replace('{path}', applicationFolderPath),
      errorType: 'APPLICATION_NOT_FOUND'
    };
  }
  
  // Verify the resume file exists
  if (!fs.existsSync(resumeDataPath)) {
    return {
      isValid: false,
      error: theme.messages.errors.resumeNotFound.replace('{path}', resumeDataPath),
      details: [theme.messages.errors.resumeRequired],
      errorType: 'RESUME_NOT_FOUND'
    };
  }
  
  // Ensure outputs directory exists
  if (!fs.existsSync(outputsDir)) {
    try {
      fs.mkdirSync(outputsDir, { recursive: true });
    } catch (error) {
      return {
        isValid: false,
        error: `Failed to create outputs directory: ${error.message}`,
        errorType: 'OUTPUT_DIR_CREATION_FAILED'
      };
    }
  }
  
  return {
    isValid: true
  };
}

/**
 * Checks if a markdown cover letter file exists
 * @param {string} markdownFilePath - Path to the markdown file
 * @returns {boolean} Whether the file exists
 */
function hasMarkdownFile(markdownFilePath) {
  return fs.existsSync(markdownFilePath);
}

/**
 * Loads and validates resume data from JSON file
 * @param {string} resumeDataPath - Path to the resume JSON file
 * @returns {Object} Result with loaded data or error information
 */
function loadResumeData(resumeDataPath) {
  try {
    // Clear require cache to prevent cross-application contamination
    delete require.cache[require.resolve(resumeDataPath)];
    
    // Log the file being loaded for debugging
    console.log(`🔍 Loading resume data from: ${resumeDataPath}`);
    
    // Use fs.readFileSync instead of require() to avoid caching issues
    const resumeDataRaw = fs.readFileSync(resumeDataPath, 'utf8');
    const resumeData = JSON.parse(resumeDataRaw);
    
    return {
      isValid: true,
      data: resumeData
    };
  } catch (error) {
    return {
      isValid: false,
      error: `Error loading resume data: ${error.message}`,
      errorType: 'RESUME_DATA_INVALID'
    };
  }
}

/**
 * Gets information about available applications for error messages
 * @param {string} baseDir - Base directory (typically __dirname)
 * @returns {Array} Array of available application names
 */
function getAvailableApplications(baseDir) {
  const applicationsDir = path.resolve(baseDir, theme.fileNaming.dataDir, theme.fileNaming.applicationsDir);
  
  if (!fs.existsSync(applicationsDir)) {
    return [];
  }
  
  return fs.readdirSync(applicationsDir)
    .filter(item => {
      const itemPath = path.join(applicationsDir, item);
      return fs.statSync(itemPath).isDirectory() && item !== theme.fileNaming.templateDir;
    });
}

/**
 * Displays application not found error with helpful information
 * @param {string} applicationName - Requested application name
 * @param {string} baseDir - Base directory for finding available applications
 */
function displayApplicationNotFoundError(applicationName, baseDir) {
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

module.exports = {
  extractCompanyFromFolderName,
  resolvePaths,
  validatePaths,
  hasMarkdownFile,
  loadResumeData,
  getAvailableApplications,
  displayApplicationNotFoundError
}; 