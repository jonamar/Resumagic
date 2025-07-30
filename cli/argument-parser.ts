import fs from 'fs';
import path from 'path';
import theme from '../theme';
import ErrorHandler from '../utils/error-handler';
import { ERROR_TYPES } from '../utils/error-types';

// Initialize error handler for CLI operations
const _errorHandler = new ErrorHandler({
  component: 'cli-parser',
  includeContext: true,
  includeStackTrace: false,
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
  // Check for --new-app flag first (special case with arguments)
  const newAppIndex = args.indexOf(theme.cli.flags.newApp);
  let newAppConfig = null;
  const filteredArgs = [...args];
  
  if (newAppIndex !== -1) {
    // Extract company and job title arguments following --new-app
    const company = args[newAppIndex + 1];
    const jobTitle = args[newAppIndex + 2];
    
    newAppConfig = { company, jobTitle };
    
    // Remove --new-app and its arguments from args for normal processing
    filteredArgs.splice(newAppIndex, 3);
  }
  
  // Extract application name (first non-flag argument)
  let applicationName = filteredArgs.find(arg => !arg.startsWith('--'));
  
  // Handle full paths - extract just the folder name
  if (applicationName && applicationName.includes('/')) {
    applicationName = path.basename(applicationName.replace(/\/$/, '')); // Remove trailing slash and get basename
  }
  
  // Parse flags
  const flags = {
    preview: args.includes(theme.cli.flags.preview) || theme.cli.defaults.autoPreview,
    coverLetter: args.includes(theme.cli.flags.coverLetter),
    both: args.includes(theme.cli.flags.both),
    auto: args.includes(theme.cli.flags.auto),
    combined: args.includes(theme.cli.flags.combined),
    evaluate: args.includes(theme.cli.flags.evaluate),
    all: args.includes(theme.cli.flags.all),
    fast: args.includes(theme.cli.flags.fast),
    newApp: newAppIndex !== -1,
    test: args.includes(theme.cli.flags.test),
  };
  
  return {
    applicationName,
    flags,
    newAppConfig,
    rawArgs: args,
  };
}

/**
 * Validates CLI arguments and provides helpful error messages
 * @param {Object} config - Parsed CLI configuration
 * @returns {Object} Validation result with isValid boolean and error details
 */
function validateCliArguments(config) {
  const { applicationName, flags, newAppConfig } = config;
  
  // Handle --new-app flag validation
  if (flags && flags.newApp) {
    if (!newAppConfig || !newAppConfig.company || !newAppConfig.jobTitle) {
      return ErrorHandler.createResult(
        false,
        null,
        'Missing required arguments for --new-app flag',
        ERROR_TYPES.VALIDATION_ERROR,
        [
          'Usage: node generate-resume.js --new-app "company-name" "job-title"',
          'Example: node generate-resume.js --new-app "spotify" "senior-product-manager"',
          '',
          'Both company name and job title are required.',
        ],
      );
    }
    
    // Validate company and job title format
    if (typeof newAppConfig.company !== 'string' || newAppConfig.company.trim().length === 0) {
      return ErrorHandler.createResult(
        false,
        null,
        'Invalid company name provided',
        ERROR_TYPES.VALIDATION_ERROR,
        ['Company name must be a non-empty string'],
      );
    }
    
    if (typeof newAppConfig.jobTitle !== 'string' || newAppConfig.jobTitle.trim().length === 0) {
      return ErrorHandler.createResult(
        false,
        null,
        'Invalid job title provided',
        ERROR_TYPES.VALIDATION_ERROR,
        ['Job title must be a non-empty string'],
      );
    }
    
    // For new app creation, we don't need an application name
    return ErrorHandler.createResult(true);
  }
  
  // Check if application name is provided (for normal operation)
  if (!applicationName) {
    const context = ErrorHandler.buildValidationContext('applicationName', {
      provided: applicationName,
      expectedFormat: 'non-empty string',
    });
    
    ErrorHandler.logAppError(
      'Missing application name in CLI arguments',
      ERROR_TYPES.VALIDATION_ERROR,
      context,
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
        theme.messages.usage.createCommand.replace('{name}', '<application-name>'),
      ],
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
      expectedFormat: 'non-empty string',
    },
  );
  
  console.error(theme.messages.usage.command);
  console.error(theme.messages.usage.example);
  console.error('');
  console.error(theme.messages.usage.flags);
  console.error(theme.messages.usage.flagDescriptions);
  
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

export {
  parseCliArguments,
  validateCliArguments,
  displayUsage,
}; 
