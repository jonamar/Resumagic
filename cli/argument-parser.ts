import fs from 'fs';
import path from 'path';
import theme from '../theme.js';
import ErrorHandler from '../utils/error-handler.js';
import { ERROR_TYPES } from '../utils/error-types.js';

// ErrorHandler is used via static methods; no instance needed

/**
 * CLI Parser Module
 * Handles command line argument parsing, flag detection, and validation
 */

interface NewAppConfig {
  company: string;
  jobTitle: string;
}

interface CLIFlags {
  preview: boolean;
  coverLetter: boolean;
  both: boolean;
  auto: boolean;
  combined: boolean;
  evaluate: boolean;
    evaluateOnly: boolean;
  all: boolean;
  fast: boolean;
  newApp: boolean;
  test: boolean;
  evalModel: string | null;
  evalParallel: number | null;
  evalTemperature: number | null;
    extractKeywords?: boolean;
    canonicalOutput?: boolean;
}

interface CLIConfig {
  applicationName: string | undefined;
  flags: CLIFlags;
  newAppConfig: NewAppConfig | null;
  rawArgs: string[];
}

/**
 * Parses command line arguments and returns a structured configuration object
 */
function parseCliArguments(args: string[]): CLIConfig {
  // Check for --new-app flag first (special case with arguments)
  const newAppIndex = args.indexOf(theme.cli.flags.newApp);
  let newAppConfig: NewAppConfig | null = null;
  const filteredArgs = [...args];
  
  if (newAppIndex !== -1) {
    // Extract company and job title arguments following --new-app
    const company = args[newAppIndex + 1];
    const jobTitle = args[newAppIndex + 2];
    
    // Type-safe assignment - these could be undefined if args are missing
    if (company && jobTitle) {
      newAppConfig = { company, jobTitle };
    }
    
    // Remove --new-app and its arguments from args for normal processing
    filteredArgs.splice(newAppIndex, 3);
  }
  
  // Parse evaluation flags with parameters
  let evalModel: string | null = null;
  let evalParallel: number | null = null;
  let evalTemperature: number | null = null;
  
  const evalModelIndex = args.indexOf(theme.cli.flags.evalModel);
  if (evalModelIndex !== -1) {
    const value = args[evalModelIndex + 1];
    if (typeof value === 'string' && !value.startsWith('--')) {
      evalModel = String(value);
      filteredArgs.splice(filteredArgs.indexOf(theme.cli.flags.evalModel), 2);
    }
  }
  
  const evalParallelIndex = args.indexOf(theme.cli.flags.evalParallel);
  if (evalParallelIndex !== -1) {
    const value = args[evalParallelIndex + 1];
    if (typeof value === 'string' && !value.startsWith('--')) {
      const parallelValue = parseInt(value);
      if (!isNaN(parallelValue)) {
        evalParallel = parallelValue;
      }
      filteredArgs.splice(filteredArgs.indexOf(theme.cli.flags.evalParallel), 2);
    }
  }
  
  const evalTemperatureIndex = args.indexOf(theme.cli.flags.evalTemperature);
  if (evalTemperatureIndex !== -1) {
    const value = args[evalTemperatureIndex + 1];
    if (typeof value === 'string' && !value.startsWith('--')) {
      const temperatureValue = parseFloat(value);
      if (!isNaN(temperatureValue)) {
        evalTemperature = temperatureValue;
      }
      filteredArgs.splice(filteredArgs.indexOf(theme.cli.flags.evalTemperature), 2);
    }
  }
  
  // Extract application name (first non-flag argument)
  const firstArg = filteredArgs.find(arg => typeof arg === 'string' && !arg.startsWith('--'));
  let applicationName = typeof firstArg === 'string' ? firstArg : undefined;
  
  // Handle full paths - extract just the folder name
  if (applicationName && applicationName.includes('/')) {
    applicationName = path.basename(applicationName.replace(/\/$/, '')); // Remove trailing slash and get basename
  }
  
  // Parse flags
  const flags: CLIFlags = {
    preview: args.includes(theme.cli.flags.preview) || theme.cli.defaults.autoPreview,
    coverLetter: args.includes(theme.cli.flags.coverLetter),
    both: args.includes(theme.cli.flags.both),
    auto: args.includes(theme.cli.flags.auto),
    combined: args.includes(theme.cli.flags.combined),
    evaluate: args.includes(theme.cli.flags.evaluate),
    evaluateOnly: args.includes(theme.cli.flags.evaluateOnly),
    all: args.includes(theme.cli.flags.all),
    fast: args.includes(theme.cli.flags.fast),
    newApp: newAppIndex !== -1,
    test: args.includes(theme.cli.flags.test),
    evalModel,
    evalParallel,
    evalTemperature,
    extractKeywords: args.includes(theme.cli.flags.extractKeywords),
    canonicalOutput: args.includes((theme as any).cli.flags.canonicalOutput),
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
 */
function validateCliArguments(config: CLIConfig) {
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
  if (!applicationName && !flags.canonicalOutput) {
    const context = ErrorHandler.buildValidationContext('applicationName', {
      provided: applicationName,
      expectedFormat: 'non-empty string',
    } as any);
    
    ErrorHandler.logAppError(
      'Missing application name in CLI arguments',
      ERROR_TYPES.VALIDATION_ERROR,
      context as unknown as Error,
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
 */
function displayUsage(applicationsDir: string, applicationName: string | undefined): void {
  ErrorHandler.logAppError(
    'Missing application name in CLI arguments',
    ERROR_TYPES.VALIDATION_ERROR,
    {
      provided: applicationName,
      expectedFormat: 'non-empty string',
    } as any,
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
