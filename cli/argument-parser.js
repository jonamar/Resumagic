import fs from 'fs';
import path from 'path';
import theme from '../theme.js';
import ErrorHandler from '../utils/error-handler.js';
import { ERROR_TYPES } from '../utils/error-types.js';

// Initialize error handler for CLI operations
const _errorHandler = new ErrorHandler({
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
    combined: args.includes(theme.cli.flags.combined),
    evaluate: args.includes(theme.cli.flags.evaluate),
    all: args.includes(theme.cli.flags.all),
    fast: args.includes(theme.cli.flags.fast)
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
  displayUsage
}; 
