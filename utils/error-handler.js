/**
 * Centralized Error Handler
 * Provides consistent error logging, formatting, and result creation across the application
 */

import { ERROR_TYPES, ERROR_SEVERITY, CONTEXT_TYPES } from './error-types.js';
import theme from '../theme.js';

/**
 * Configuration for error handling behavior
 */
const ERROR_CONFIG = {
  formatting: {
    useEmojis: true,
    includeContext: true,
    maxContextLines: 5,
    includeStackTrace: process.env.NODE_ENV === 'development'
  },
  logging: {
    logToConsole: true,
    logLevel: 'error'
  }
};

/**
 * Centralized Error Handler Class
 */
class ErrorHandler {
  /**
   * Core error logging with structured output
   * @param {Object} config - Error configuration object
   * @param {string} config.message - Primary error message
   * @param {Error} [config.error] - Original error object
   * @param {string} [config.type] - Error type from ERROR_TYPES
   * @param {string} [config.severity] - Error severity from ERROR_SEVERITY
   * @param {Array} [config.details] - Additional error details
   * @param {Object} [config.context] - Error context information
   */
  static logError({
    message,
    error = null,
    type = ERROR_TYPES.UNKNOWN_ERROR,
    severity = ERROR_SEVERITY.MEDIUM,
    details = [],
    context = {}
  }) {
    if (!ERROR_CONFIG.logging.logToConsole) return;

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
   * @param {string} serviceName - Name of the service (e.g., 'KeywordExtraction')
   * @param {string} operation - Operation that failed (e.g., 'extraction')
   * @param {Error} error - Error object
   * @param {Object} [context] - Additional context information
   */
  static logServiceError(serviceName, operation, error, context = {}) {
    this.logError({
      message: `${serviceName} ${operation} failed`,
      error,
      type: ERROR_TYPES.SERVICE_UNAVAILABLE,
      severity: ERROR_SEVERITY.HIGH,
      context: {
        service: serviceName,
        operation,
        ...context
      }
    });
  }

  /**
   * Application-level error logging (CLI, file operations, etc.)
   * @param {string} component - Application component (e.g., 'CLI', 'FileSystem')
   * @param {string} message - Error message
   * @param {Error} [error] - Original error object
   * @param {Array} [details] - Additional error details
   * @param {Object} [context] - Error context
   */
  static logAppError(component, message, error = null, details = [], context = {}) {
    this.logError({
      message: `${component}: ${message}`,
      error,
      type: ERROR_TYPES.INTERNAL_ERROR,
      severity: ERROR_SEVERITY.MEDIUM,
      details,
      context
    });
  }

  /**
   * Creates a standardized error result object
   * @param {boolean} success - Whether the operation was successful
   * @param {any} [data] - Success data (if success = true)
   * @param {string} [errorMessage] - Error message (if success = false)
   * @param {string} [errorType] - Error type from ERROR_TYPES
   * @param {Array} [details] - Additional error details
   * @returns {Object} Standardized result object
   */
  static createResult(success, data = null, errorMessage = null, errorType = ERROR_TYPES.UNKNOWN_ERROR, details = [], legacyErrorType = null) {
    if (success) {
      return {
        isValid: true,
        success: true,
        data
      };
    } else {
      const result = {
        isValid: false,
        success: false,
        error: errorMessage,
        errorType,
        details
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
   * @param {any} value - Value to validate
   * @param {Function} validator - Validation function that returns boolean or throws
   * @param {string} fieldName - Name of the field being validated
   * @param {Object} [options] - Validation options
   * @returns {Object} Validation result
   */
  static validateInput(value, validator, fieldName, options = {}) {
    try {
      const isValid = typeof validator === 'function' ? validator(value) : false;
      
      if (isValid) {
        return this.createResult(true, value);
      } else {
        const errorMessage = options.customMessage || `Invalid ${fieldName}`;
        return this.createResult(false, null, errorMessage, ERROR_TYPES.INVALID_INPUT, [
          `Field: ${fieldName}`,
          `Value: ${JSON.stringify(value)}`,
          ...(options.expectedFormat ? [`Expected: ${options.expectedFormat}`] : [])
        ]);
      }
    } catch (error) {
      return this.createResult(false, null, `Validation error for ${fieldName}`, ERROR_TYPES.INVALID_INPUT, [
        `Field: ${fieldName}`,
        `Error: ${error.message}`
      ]);
    }
  }

  /**
   * Assert that a required value is present and valid
   * @param {any} value - Value to check
   * @param {string} fieldName - Name of the required field
   * @throws {Error} If value is null, undefined, or empty string
   */
  static assertRequired(value, fieldName) {
    if (value === null || value === undefined || value === '') {
      const error = new Error(`Required field '${fieldName}' is missing or empty`);
      error.type = ERROR_TYPES.MISSING_REQUIRED_FIELD;
      error.field = fieldName;
      throw error;
    }
  }

  /**
   * Build file context information for error reporting
   * @param {string} filePath - Path to the file
   * @param {Object} [additionalInfo] - Additional file context
   * @returns {Object} File context object
   */
  static async buildFileContext(filePath, additionalInfo = {}) {
    const fs = await import('fs');
    const path = await import('path');
    
    const context = {
      type: CONTEXT_TYPES.FILE,
      filePath,
      fileName: path.basename(filePath),
      directory: path.dirname(filePath),
      ...additionalInfo
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
    } catch (error) {
      // Ignore errors when building context
      context.contextError = 'Unable to read file stats';
    }

    return context;
  }

  /**
   * Build service context information for error reporting
   * @param {string} service - Service name
   * @param {string} operation - Operation name
   * @param {Object} [additionalInfo] - Additional service context
   * @returns {Object} Service context object
   */
  static buildServiceContext(service, operation, additionalInfo = {}) {
    return {
      type: CONTEXT_TYPES.SERVICE,
      service,
      operation,
      timestamp: new Date().toISOString(),
      ...additionalInfo
    };
  }

  /**
   * Build validation context for input validation errors
   * @param {string} fieldName - Name of the field being validated
   * @param {any} value - Value that failed validation
   * @param {string} [expectedFormat] - Expected format description
   * @returns {Object} Validation context object
   */
  static buildValidationContext(fieldName, value, expectedFormat = null) {
    return {
      type: CONTEXT_TYPES.VALIDATION,
      fieldName,
      providedValue: JSON.stringify(value),
      valueType: typeof value,
      ...(expectedFormat && { expectedFormat })
    };
  }

  /**
   * Update error handling configuration
   * @param {Object} newConfig - Configuration updates
   */
  static updateConfig(newConfig) {
    Object.assign(ERROR_CONFIG, newConfig);
  }

  /**
   * Get current error handling configuration
   * @returns {Object} Current configuration
   */
  static getConfig() {
    return { ...ERROR_CONFIG };
  }
}

export default ErrorHandler;
