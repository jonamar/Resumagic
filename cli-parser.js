const fs = require('fs');
const path = require('path');
const theme = require('./theme');
const ErrorHandler = require('./utils/error-handler');
const { ERROR_TYPES } = require('./utils/error-types');

// Initialize error handler for CLI operations
const errorHandler = new ErrorHandler({
  component: 'cli-parser',
  includeContext: true,
  includeStackTrace: false
});

/**
 * CLI Parser Module
 * Handles command line argument parsing, flag detection, and validation
 */

/**
 * Parses command line arguments and returns a structured configuration object
 * @param {Array} args - Command line arguments (typically process.argv.slice(2))
 * @returns {Object} Parsed CLI configuration
 */
function parseCliArguments(args) {
  // Extract application name (first non-flag argument)
  const applicationName = args.find(arg => !arg.startsWith('--'));
  
  // Parse flags
  const flags = {
    preview: args.includes(theme.cli.flags.preview) || theme.cli.defaults.autoPreview,
    coverLetter: args.includes(theme.cli.flags.coverLetter),
    both: args.includes(theme.cli.flags.both),
    auto: args.includes(theme.cli.flags.auto),
    combined: args.includes(theme.cli.flags.combined)
  };
  
  return {
    applicationName,
    flags,
    rawArgs: args
  };
}

/**
 * Validates CLI arguments and provides helpful error messages
 * @param {Object} config - Parsed CLI configuration
 * @returns {Object} Validation result with isValid boolean and error details
 */
function validateCliArguments(config) {
  const { applicationName } = config;
  
  // Check if application name is provided
  if (!applicationName) {
    const context = ErrorHandler.buildValidationContext('applicationName', {
      provided: applicationName,
      expectedFormat: 'non-empty string'
    });
    
    ErrorHandler.logAppError(
      'Missing application name in CLI arguments',
      ERROR_TYPES.VALIDATION_ERROR,
      context
    );
    
    return ErrorHandler.createResult(
      false,
      null,
      theme.messages.errors.noApplicationName,
      ERROR_TYPES.VALIDATION_ERROR,
      [
        theme.messages.usage.command,
        theme.messages.usage.example,
        '',
        theme.messages.usage.createApplication,
        theme.messages.usage.createCommand.replace('{name}', '<application-name>')
      ]
    );
  }
  
  return ErrorHandler.createResult(true);
}

/**
 * Determines what document types to generate based on flags and file availability
 * @param {Object} flags - CLI flags object
 * @param {boolean} hasMarkdownFile - Whether a cover letter markdown file exists
 * @returns {Object} Generation plan with boolean flags for each document type
 */
function determineGenerationPlan(flags, hasMarkdownFile) {
  let generateResume = false;
  let generateCoverLetter = false;
  let generateCombinedDoc = false;
  let behaviorDescription = '';
  
  if (flags.coverLetter) {
    generateCoverLetter = true;
    behaviorDescription = 'Cover letter only mode';
  } else if (flags.both) {
    generateResume = true;
    generateCoverLetter = true;
    behaviorDescription = 'Both resume and cover letter mode';
  } else if (flags.combined) {
    generateCombinedDoc = true;
    behaviorDescription = 'Combined document mode';
  } else if (flags.auto) {
    generateResume = true;
    generateCoverLetter = hasMarkdownFile;
    behaviorDescription = hasMarkdownFile ? 
      'Auto mode: generating resume and cover letter' : 
      'Auto mode: generating resume only';
  } else {
    // Default behavior - generate all three formats if both content types are available
    if (hasMarkdownFile) {
      generateResume = true;
      generateCoverLetter = true;
      generateCombinedDoc = true;
      behaviorDescription = theme.messages.usage.defaultBehavior;
    } else {
      // Only resume content available - generate resume only
      generateResume = true;
      behaviorDescription = theme.messages.usage.defaultResumeOnly;
    }
  }
  
  return {
    generateResume,
    generateCoverLetter,
    generateCombinedDoc,
    behaviorDescription
  };
}

/**
 * Validates that the generation plan is feasible given available files
 * @param {Object} plan - Generation plan from determineGenerationPlan
 * @param {boolean} hasMarkdownFile - Whether a cover letter markdown file exists
 * @param {string} markdownFilePath - Path to the markdown file for error messages
 * @returns {Object} Validation result with isValid boolean and error details
 */
function validateGenerationPlan(plan, hasMarkdownFile, markdownFilePath) {
  const { generateCoverLetter, generateCombinedDoc } = plan;
  
  // Check if cover letter generation is requested but no markdown file exists
  if ((generateCoverLetter || generateCombinedDoc) && !hasMarkdownFile) {
    const context = ErrorHandler.buildFileContext(markdownFilePath, {
      operation: 'cover letter generation',
      required: true,
      generateCoverLetter,
      generateCombinedDoc
    });
    
    ErrorHandler.logAppError(
      'Cover letter generation requested but markdown file not found',
      ERROR_TYPES.FILE_NOT_FOUND,
      context
    );
    
    return ErrorHandler.createResult(
      false,
      null,
      theme.messages.errors.coverLetterNotFound,
      ERROR_TYPES.FILE_NOT_FOUND,
      [
        theme.messages.errors.coverLetterRequired.replace('{path}', markdownFilePath)
      ]
    );
  }
  
  return ErrorHandler.createResult(true);
}

/**
 * Displays usage information and available applications
 * @param {string} applicationsDir - Path to applications directory
 * @param {string} applicationName - Requested application name for create command
 */
function displayUsage(applicationsDir, applicationName) {
  ErrorHandler.logAppError(
    'Missing application name in CLI arguments',
    ERROR_TYPES.VALIDATION_ERROR,
    {
      provided: applicationName,
      expectedFormat: 'non-empty string'
    }
  );
  
  console.error(theme.messages.usage.command);
  console.error(theme.messages.usage.example);
  
  // Show available applications if directory exists
  if (fs.existsSync(applicationsDir)) {
    console.error('');
    console.error(theme.messages.usage.availableApplications);
    
    const folders = fs.readdirSync(applicationsDir)
      .filter(item => fs.statSync(path.join(applicationsDir, item)).isDirectory() && item !== 'template')
      .map(folder => `  - ${folder}`)
      .join('\n');
    
    console.error(folders || theme.messages.usage.noApplications);
  }
  
  console.error('');
  console.error(theme.messages.usage.createApplication);
  console.error(theme.messages.usage.createCommand.replace('{name}', applicationName || '<application-name>'));
}

module.exports = {
  parseCliArguments,
  validateCliArguments,
  determineGenerationPlan,
  validateGenerationPlan,
  displayUsage
}; 