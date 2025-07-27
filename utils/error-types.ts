/**
 * Standardized Error Types
 * Shared constants for consistent error categorization across the application
 */

export const ERROR_TYPES = {
  // File system errors
  FILE_NOT_FOUND: 'FILE_NOT_FOUND',
  FILE_ACCESS_ERROR: 'FILE_ACCESS_ERROR',
  DIRECTORY_NOT_FOUND: 'DIRECTORY_NOT_FOUND',
  
  // Input validation errors
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  INVALID_FORMAT: 'INVALID_FORMAT',
  
  // Service and external dependency errors
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  NETWORK_ERROR: 'NETWORK_ERROR',
  API_ERROR: 'API_ERROR',
  
  // Data processing errors
  PARSING_ERROR: 'PARSING_ERROR',
  SERIALIZATION_ERROR: 'SERIALIZATION_ERROR',
  DATA_CORRUPTION: 'DATA_CORRUPTION',
  
  // Configuration errors
  CONFIGURATION_ERROR: 'CONFIGURATION_ERROR',
  MISSING_DEPENDENCY: 'MISSING_DEPENDENCY',
  VERSION_MISMATCH: 'VERSION_MISMATCH',
  
  // Application-specific errors
  APPLICATION_NOT_FOUND: 'APPLICATION_NOT_FOUND',
  GENERATION_ERROR: 'GENERATION_ERROR',
  TEMPLATE_ERROR: 'TEMPLATE_ERROR',
  
  // General errors
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

export type ErrorType = typeof ERROR_TYPES[keyof typeof ERROR_TYPES];

/**
 * Error severity levels for categorization and handling
 */
export const ERROR_SEVERITY = {
  LOW: 'LOW',       // Warning-level issues that don't prevent operation
  MEDIUM: 'MEDIUM', // Errors that prevent current operation but allow recovery
  HIGH: 'HIGH',     // Critical errors that require immediate attention
  FATAL: 'FATAL',    // System-level errors that prevent application from continuing
} as const;

export type ErrorSeverity = typeof ERROR_SEVERITY[keyof typeof ERROR_SEVERITY];

/**
 * Context types for structured error information
 */
export const CONTEXT_TYPES = {
  FILE: 'FILE',
  SERVICE: 'SERVICE',
  VALIDATION: 'VALIDATION',
  CONFIGURATION: 'CONFIGURATION',
  USER_INPUT: 'USER_INPUT',
} as const;

export type ContextType = typeof CONTEXT_TYPES[keyof typeof CONTEXT_TYPES];
