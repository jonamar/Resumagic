/**
 * Centralized Error Handler
 * Provides consistent error logging, formatting, and result creation across the application
 */

import { ERROR_TYPES, ERROR_SEVERITY, CONTEXT_TYPES, ErrorType, ErrorSeverity, ContextType } from './error-types.js';
import theme from '../theme';

/**
 * Configuration for error handling behavior
 */
interface ErrorConfig {
  formatting: {
    useEmojis: boolean;
    includeContext: boolean;
    maxContextLines: number;
    includeStackTrace: boolean;
  };
  logging: {
    logToConsole: boolean;
    logLevel: string;
  };
}

const ERROR_CONFIG: ErrorConfig = {
  formatting: {
    useEmojis: true,
    includeContext: true,
    maxContextLines: 5,
    includeStackTrace: process.env.NODE_ENV === 'development',
  },
  logging: {
    logToConsole: true,
    logLevel: 'error',
  },
};

/**
 * Context information for errors
 */
interface ErrorContext {
  type?: ContextType;
  [key: string]: any;
}

/**
 * Configuration object for logging errors
 */
interface LogErrorConfig {
  message: string;
  error?: Error | null;
  type?: ErrorType;
  severity?: ErrorSeverity;
  details?: string[];
  context?: ErrorContext;
}

/**
 * Standardized result object
 */
interface Result {
  isValid: boolean;
  success: boolean;
  data?: any;
  error?: string;
  errorType?: ErrorType;
  details?: string[];
  legacyErrorType?: string;
}

/**
 * Validation options
 */
interface ValidationOptions {
  customMessage?: string;
  expectedFormat?: string;
}

/**
 * File context information
 */
interface FileContext extends ErrorContext {
  type: ContextType;
  filePath: string;
  fileName: string;
  directory: string;
  exists?: boolean;
  size?: number;
  modified?: string;
  contextError?: string;
}

/**
 * Service context information
 */
interface ServiceContext extends ErrorContext {
  type: ContextType;
  service: string;
  operation: string;
  timestamp: string;
}

/**
 * Validation context information
 */
interface ValidationContext extends ErrorContext {
  type: ContextType;
  fieldName: string;
  providedValue: string;
  valueType: string;
  expectedFormat?: string;
}

/**
 * Centralized Error Handler Class
 */
class ErrorHandler {
  /**
   * Core error logging with structured output
   * @param config - Error configuration object
   */
  static logError({
    message,
    error = null,
    type = ERROR_TYPES.UNKNOWN_ERROR,
    severity = ERROR_SEVERITY.MEDIUM,
    details = [],
    context = {},
  }: LogErrorConfig): void {
    if (!ERROR_CONFIG.logging.logToConsole) {
      return;
    }

    // Use type and severity parameters to avoid TS6133 errors
    // These are used for future extensibility
    if (type && severity) {
      // This ensures the variables are used
    }
    
    const emoji = ERROR_CONFIG.formatting.useEmojis ? theme.messages.emojis.error : '';
    console.error(`${emoji} ${message}`);

    // Log original error message if provided
    if (error && error.message) {
      console.error(`   ${error.message}`);
    }

    // Log context information
    if (ERROR_CONFIG.formatting.includeContext && Object.keys(context).length > 0) {
      Object.entries(context).forEach(([key, value]) => {
        console.error(`   ${key}: ${value}`);
      });
    }

    // Log additional details
    if (details && details.length > 0) {
      const maxLines = ERROR_CONFIG.formatting.maxContextLines;
      const displayDetails = details.slice(0, maxLines);
      displayDetails.forEach(detail => console.error(`   ${detail}`));
      
      if (details.length > maxLines) {
        console.error(`   ... and ${details.length - maxLines} more details`);
      }
    }

    // Log stack trace in development
    if (ERROR_CONFIG.formatting.includeStackTrace && error && error.stack) {
      console.error('Stack trace:');
      console.error(error.stack);
    }
  }

  /**
   * Service-specific error logging with structured context
   * @param serviceName - Name of the service (e.g., 'KeywordExtraction')
   * @param operation - Operation that failed (e.g., 'extraction')
   * @param error - Error object
   * @param context - Additional context information
   */
  static logServiceError(
    serviceName: string,
    operation: string,
    error: Error,
    context: ErrorContext = {},
  ): void {
    this.logError({
      message: `${serviceName} ${operation} failed`,
      error,
      type: ERROR_TYPES.SERVICE_UNAVAILABLE,
      severity: ERROR_SEVERITY.HIGH,
      context: {
        service: serviceName,
        operation,
        ...context,
      },
    });
  }

  /**
   * Application-level error logging (CLI, file operations, etc.)
   * @param component - Application component (e.g., 'CLI', 'FileSystem')
   * @param message - Error message
   * @param error - Original error object
   * @param details - Additional error details
   * @param context - Error context
   */
  static logAppError(
    component: string,
    message: string,
    error: Error | null = null,
    details: string[] = [],
    context: ErrorContext = {},
  ): void {
    this.logError({
      message: `${component}: ${message}`,
      error,
      type: ERROR_TYPES.INTERNAL_ERROR,
      severity: ERROR_SEVERITY.MEDIUM,
      details,
      context,
    });
  }

  /**
   * Creates a standardized error result object
   * @param success - Whether the operation was successful
   * @param data - Success data (if success = true)
   * @param errorMessage - Error message (if success = false)
   * @param errorType - Error type from ERROR_TYPES
   * @param details - Additional error details
   * @param legacyErrorType - Legacy error type for backward compatibility
   * @returns Standardized result object
   */
  static createResult(
    success: boolean,
    data: any = null,
    errorMessage: string | null = null,
    errorType: ErrorType = ERROR_TYPES.UNKNOWN_ERROR,
    details: string[] = [],
    legacyErrorType: string | null = null,
  ): Result {
    if (success) {
      return {
        isValid: true,
        success: true,
        data,
        error: undefined,
        errorType: undefined,
        details: undefined,
      };
    } else {
      const result: Result = {
        isValid: false,
        success: false,
        error: errorMessage || undefined,
        errorType,
        details,
      };
      
      // Add legacy error type for backward compatibility if provided
      if (legacyErrorType) {
        result.legacyErrorType = legacyErrorType;
      }
      
      return result;
    }
  }

  /**
   * Input validation helper with structured error reporting
   * @param value - Value to validate
   * @param validator - Validation function that returns boolean or throws
   * @param fieldName - Name of the field being validated
   * @param options - Validation options
   * @returns Validation result
   */
  static validateInput(
    value: any,
    validator: (value: any) => boolean,
    fieldName: string,
    options: ValidationOptions = {},
  ): Result {
    try {
      const isValid = typeof validator === 'function' ? validator(value) : false;
      
      if (isValid) {
        return this.createResult(true, value);
      } else {
        const errorMessage = options.customMessage || `Invalid ${fieldName}`;
        return this.createResult(false, null, errorMessage, ERROR_TYPES.INVALID_INPUT, [
          `Field: ${fieldName}`,
          `Value: ${JSON.stringify(value)}`,
          ...(options.expectedFormat ? [`Expected: ${options.expectedFormat}`] : []),
        ]);
      }
    } catch (error: any) {
      return this.createResult(false, null, `Validation error for ${fieldName}`, ERROR_TYPES.INVALID_INPUT, [
        `Field: ${fieldName}`,
        `Error: ${error.message}`,
      ]);
    }
  }

  /**
   * Assert that a required value is present and valid
   * @param value - Value to check
   * @param fieldName - Name of the required field
   * @throws If value is null, undefined, or empty string
   */
  static assertRequired(value: any, fieldName: string): void {
    if (value === null || value === undefined || value === '') {
      const error = new Error(`Required field '${fieldName}' is missing or empty`);
      (error as any).type = ERROR_TYPES.MISSING_REQUIRED_FIELD;
      (error as any).field = fieldName;
      throw error;
    }
  }

  /**
   * Build file context information for error reporting
   * @param filePath - Path to the file
   * @param additionalInfo - Additional file context
   * @returns File context object
   */
  static async buildFileContext(filePath: string, additionalInfo: ErrorContext = {}): Promise<FileContext> {
    const fs = await import('fs');
    const path = await import('path');
    
    const context: FileContext = {
      type: CONTEXT_TYPES.FILE,
      filePath,
      fileName: path.basename(filePath),
      directory: path.dirname(filePath),
      ...additionalInfo,
    };

    // Add file existence and stats if possible
    try {
      const exists = fs.existsSync(filePath);
      context.exists = exists;
      
      if (exists) {
        const stats = fs.statSync(filePath);
        context.size = stats.size;
        context.modified = stats.mtime.toISOString();
      }
    } catch {
      // Ignore errors when building context
      context.contextError = 'Unable to read file stats';
    }

    return context;
  }

  /**
   * Build service context information for error reporting
   * @param service - Service name
   * @param operation - Operation name
   * @param additionalInfo - Additional service context
   * @returns Service context object
   */
  static buildServiceContext(
    service: string,
    operation: string,
    additionalInfo: ErrorContext = {},
  ): ServiceContext {
    return {
      type: CONTEXT_TYPES.SERVICE,
      service,
      operation,
      timestamp: new Date().toISOString(),
      ...additionalInfo,
    };
  }

  /**
   * Build validation context for input validation errors
   * @param fieldName - Name of the field being validated
   * @param value - Value that failed validation
   * @param expectedFormat - Expected format description
   * @returns Validation context object
   */
  static buildValidationContext(
    fieldName: string,
    value: any,
    expectedFormat: string | null = null,
  ): ValidationContext {
    return {
      type: CONTEXT_TYPES.VALIDATION,
      fieldName,
      providedValue: JSON.stringify(value),
      valueType: typeof value,
      ...(expectedFormat && { expectedFormat }),
    };
  }

  /**
   * Update error handling configuration
   * @param newConfig - Configuration updates
   */
  static updateConfig(newConfig: Partial<ErrorConfig>): void {
    Object.assign(ERROR_CONFIG, newConfig);
  }

  /**
   * Get current error handling configuration
   * @returns Current configuration
   */
  static getConfig(): ErrorConfig {
    return { ...ERROR_CONFIG };
  }
}

export default ErrorHandler;
export type { ErrorType, ErrorSeverity, ContextType, ErrorContext, Result, ValidationOptions };
