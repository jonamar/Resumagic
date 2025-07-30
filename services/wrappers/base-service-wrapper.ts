/**
 * Base Service Wrapper
 * Provides common functionality for all service wrappers in the standardized polyglot architecture
 * Part of Phase 2: Standardize Existing Service Infrastructure
 */

import { getFeatureFlags } from '../../utils/feature-flags';

interface ServiceMetadata {
  service: string;
  version: string;
  duration: number;
  timestamp: string;
}

interface ServiceError {
  code: string;
  message: string;
  details?: unknown;
}

interface ValidationSchema {
  [key: string]: {
    type: string;
    required: boolean;
  };
}

interface MeasuredResult {
  result: unknown;
  duration: number;
}

/**
 * Standard JSON API response format for all services
 */
class ServiceResponse {
  public success: boolean;
  public data?: unknown;
  public metadata: ServiceMetadata;
  public error?: ServiceError;

  constructor(success: boolean, data: unknown, metadata: ServiceMetadata, error: ServiceError | null = null) {
    this.success = success;
    this.data = data;
    this.metadata = metadata;
    if (error) {
      this.error = error;
    }
  }

  static success(data: unknown, serviceName: string, duration = 0): ServiceResponse {
    return new ServiceResponse(true, data, {
      service: serviceName,
      version: '1.0.0',
      duration: Math.round(duration),
      timestamp: new Date().toISOString(),
    });
  }

  static error(code: string, message: string, serviceName: string, details: unknown = null, duration = 0): ServiceResponse {
    const response = new ServiceResponse(false, undefined, {
      service: serviceName,
      version: '1.0.0',
      duration: Math.round(duration),
      timestamp: new Date().toISOString(),
    }, {
      code,
      message,
      details,
    });
    return response;
  }
}

/**
 * Base class for all service wrappers
 */
class BaseServiceWrapper {
  protected serviceName: string;
  protected featureFlags: unknown;

  constructor(serviceName: string) {
    this.serviceName = serviceName;
    this.featureFlags = getFeatureFlags();
  }

  /**
   * Get the service name
   */
  getServiceName(): string {
    return this.serviceName;
  }

  /**
   * Measure execution time for operations
   */
  async measureExecutionTime(operation: () => Promise<unknown>): Promise<MeasuredResult> {
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
   */
  createSuccessResponse(data: unknown, duration = 0): ServiceResponse {
    return ServiceResponse.success(data, this.serviceName, duration);
  }

  /**
   * Create standardized error response
   */
  createErrorResponse(code: string, message: string, details: unknown = null, duration = 0): ServiceResponse {
    return ServiceResponse.error(code, message, this.serviceName, details, duration);
  }

  /**
   * Log service operation for debugging
   */
  logOperation(operation: string, _input: unknown): void {
    console.log(`[${this.serviceName}] ${operation}`);
  }

  /**
   * Validate service input against expected format
   */
  validateInput(input: unknown, schema: ValidationSchema): void {
    if (!input) {
      throw new Error('Input is required');
    }

    // Type guard to ensure input is an object
    if (typeof input !== 'object' || input === null) {
      throw new Error('Input must be an object');
    }

    const inputObj = input as Record<string, unknown>;

    // Basic schema validation - can be extended with more sophisticated validation
    for (const [key, schemaSpec] of Object.entries(schema)) {
      if (schemaSpec.required && !(key in inputObj)) {
        throw new Error(`Required field '${key}' is missing`);
      }
      
      if (key in inputObj && typeof inputObj[key] !== schemaSpec.type) {
        throw new Error(`Field '${key}' must be of type ${schemaSpec.type}`);
      }
    }
  }

  /**
   * Abstract method - must be implemented by subclasses
   * Main service operation that wraps legacy/standardized implementations
   */
  async execute(): Promise<unknown> {
    throw new Error('execute() method must be implemented by subclass');
  }
}

export {
  BaseServiceWrapper,
  ServiceResponse,
};
