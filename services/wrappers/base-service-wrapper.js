/**
 * Base Service Wrapper
 * Provides common functionality for all service wrappers in the standardized polyglot architecture
 * Part of Phase 2: Standardize Existing Service Infrastructure
 */


/**
 * Standard JSON API response format for all services
 */
class ServiceResponse {
  constructor(success, data, metadata, error = null) {
    this.success = success;
    this.data = data;
    this.metadata = metadata;
    if (error) {
      this.error = error;
    }
  }

  static success(data, serviceName, duration = 0) {
    return new ServiceResponse(true, data, {
      service: serviceName,
      version: '1.0.0',
      duration: Math.round(duration),
      timestamp: new Date().toISOString()
    });
  }

  static error(code, message, serviceName, details = null, duration = 0) {
    const response = {
      success: false,
      metadata: {
        service: serviceName,
        version: '1.0.0',
        duration: Math.round(duration),
        timestamp: new Date().toISOString()
      },
      error: {
        code,
        message,
        details
      }
    };
    // Don't include data property for error responses
    return response;
  }
}

/**
 * Base class for all service wrappers
 */
class BaseServiceWrapper {
  constructor(serviceName, legacyFlagName = null) {
    this.serviceName = serviceName;
    this.legacyFlagName = legacyFlagName || `STANDARDIZED_${serviceName.toUpperCase().replace(/-/g, '_')}`;
  }

  /**
   * Determine if legacy implementation should be used based on feature flags
   * @returns {boolean}
   */
  shouldUseLegacyImplementation() {
    // This is a placeholder implementation
    // In a real implementation, this would check feature flags
    return false;
  }

  /**
   * Measure execution time for operations
   * @param {Function} operation - Async operation to measure
   * @returns {Promise<{result: any, duration: number}>}
   */
  async measureExecutionTime(operation) {
    const startTime = Date.now();
    try {
      const result = await operation();
      const duration = Date.now() - startTime;
      return { result, duration };
    } catch (error) {
      const duration = Date.now() - startTime;
      throw { error, duration };
    }
  }

  /**
   * Create standardized success response
   * @param {any} data - Response data
   * @param {number} duration - Execution duration in ms
   * @returns {ServiceResponse}
   */
  createSuccessResponse(data, duration = 0) {
    return ServiceResponse.success(data, this.serviceName, duration);
  }

  /**
   * Create standardized error response
   * @param {string} code - Error code
   * @param {string} message - Error message
   * @param {any} details - Additional error details
   * @param {number} duration - Execution duration in ms
   * @returns {ServiceResponse}
   */
  createErrorResponse(code, message, details = null, duration = 0) {
    return ServiceResponse.error(code, message, this.serviceName, details, duration);
  }

  /**
   * Log service operation for debugging
   * @param {string} operation - Operation name
   * @param {any} _input - Input data (sanitized, currently unused)
   */
  logOperation(operation, _input) {
    console.log(`[${this.serviceName}] ${operation}`);
  }

  /**
   * Validate service input against expected format
   * @param {any} input - Input to validate
   * @param {Object} schema - Validation schema
   * @throws {Error} - If validation fails
   */
  validateInput(input, schema) {
    if (!input) {
      throw new Error('Input is required');
    }

    // Basic schema validation - can be extended with more sophisticated validation
    for (const [key, type] of Object.entries(schema)) {
      if (schema[key].required && !(key in input)) {
        throw new Error(`Required field '${key}' is missing`);
      }
      
      if (key in input && typeof input[key] !== type.type) {
        throw new Error(`Field '${key}' must be of type ${type.type}`);
      }
    }
  }

  /**
   * Abstract method - must be implemented by subclasses
   * Main service operation that wraps legacy/standardized implementations
   */
  async execute() {
    throw new Error('execute() method must be implemented by subclass');
  }
}

export {
  BaseServiceWrapper,
  ServiceResponse
};
