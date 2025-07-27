import { ERROR_TYPES, ERROR_SEVERITY, CONTEXT_TYPES } from './error-types.js';
import theme from '../theme.js';
const ERROR_CONFIG = {
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
class ErrorHandler {
  static logError({ message, error = null, type = ERROR_TYPES.UNKNOWN_ERROR, severity = ERROR_SEVERITY.MEDIUM, details = [], context = {} }) {
    if (!ERROR_CONFIG.logging.logToConsole) {
      return;
    }
    if (type && severity) {
    }
    const emoji = ERROR_CONFIG.formatting.useEmojis ? theme.messages.emojis.error : '';
    console.error(`${emoji} ${message}`);
    if (error && error.message) {
      console.error(`   ${error.message}`);
    }
    if (ERROR_CONFIG.formatting.includeContext && Object.keys(context).length > 0) {
      Object.entries(context).forEach(([key, value]) => {
        console.error(`   ${key}: ${value}`);
      });
    }
    if (details && details.length > 0) {
      const maxLines = ERROR_CONFIG.formatting.maxContextLines;
      const displayDetails = details.slice(0, maxLines);
      displayDetails.forEach(detail => console.error(`   ${detail}`));
      if (details.length > maxLines) {
        console.error(`   ... and ${details.length - maxLines} more details`);
      }
    }
    if (ERROR_CONFIG.formatting.includeStackTrace && error && error.stack) {
      console.error('Stack trace:');
      console.error(error.stack);
    }
  }
  static logServiceError(serviceName, operation, error, context = {}) {
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
  static logAppError(component, message, error = null, details = [], context = {}) {
    this.logError({
      message: `${component}: ${message}`,
      error,
      type: ERROR_TYPES.INTERNAL_ERROR,
      severity: ERROR_SEVERITY.MEDIUM,
      details,
      context,
    });
  }
  static createResult(success, data = null, errorMessage = null, errorType = ERROR_TYPES.UNKNOWN_ERROR, details = [], legacyErrorType = null) {
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
      const result = {
        isValid: false,
        success: false,
        error: errorMessage || undefined,
        errorType,
        details,
      };
      if (legacyErrorType) {
        result.legacyErrorType = legacyErrorType;
      }
      return result;
    }
  }
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
          ...(options.expectedFormat ? [`Expected: ${options.expectedFormat}`] : []),
        ]);
      }
    } catch (error) {
      return this.createResult(false, null, `Validation error for ${fieldName}`, ERROR_TYPES.INVALID_INPUT, [
        `Field: ${fieldName}`,
        `Error: ${error.message}`,
      ]);
    }
  }
  static assertRequired(value, fieldName) {
    if (value === null || value === undefined || value === '') {
      const error = new Error(`Required field '${fieldName}' is missing or empty`);
      error.type = ERROR_TYPES.MISSING_REQUIRED_FIELD;
      error.field = fieldName;
      throw error;
    }
  }
  static async buildFileContext(filePath, additionalInfo = {}) {
    const fs = await import('fs');
    const path = await import('path');
    const context = {
      type: CONTEXT_TYPES.FILE,
      filePath,
      fileName: path.basename(filePath),
      directory: path.dirname(filePath),
      ...additionalInfo,
    };
    try {
      const exists = fs.existsSync(filePath);
      context.exists = exists;
      if (exists) {
        const stats = fs.statSync(filePath);
        context.size = stats.size;
        context.modified = stats.mtime.toISOString();
      }
    } catch {
      context.contextError = 'Unable to read file stats';
    }
    return context;
  }
  static buildServiceContext(service, operation, additionalInfo = {}) {
    return {
      type: CONTEXT_TYPES.SERVICE,
      service,
      operation,
      timestamp: new Date().toISOString(),
      ...additionalInfo,
    };
  }
  static buildValidationContext(fieldName, value, expectedFormat = null) {
    return {
      type: CONTEXT_TYPES.VALIDATION,
      fieldName,
      providedValue: JSON.stringify(value),
      valueType: typeof value,
      ...(expectedFormat && { expectedFormat }),
    };
  }
  static updateConfig(newConfig) {
    Object.assign(ERROR_CONFIG, newConfig);
  }
  static getConfig() {
    return { ...ERROR_CONFIG };
  }
}
export default ErrorHandler;
//# sourceMappingURL=error-handler.js.map
