"""
Error types and constants for centralized error handling.

This module defines standardized error types, severities, and context types
to ensure consistent error handling across the Python keyword analysis service.
Mirrors the JavaScript error handling taxonomy for cross-language consistency.
"""

from enum import Enum


class ErrorTypes:
    """Standardized error type constants."""
    
    # System and file errors
    FILE_NOT_FOUND = 'FILE_NOT_FOUND'
    DIRECTORY_NOT_FOUND = 'DIRECTORY_NOT_FOUND'
    FILE_SYSTEM_ERROR = 'FILE_SYSTEM_ERROR'
    PERMISSION_DENIED = 'PERMISSION_DENIED'
    
    # Input validation errors
    INVALID_INPUT = 'INVALID_INPUT'
    MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD'
    INVALID_FORMAT = 'INVALID_FORMAT'
    VALIDATION_ERROR = 'VALIDATION_ERROR'
    
    # Service and external dependency errors
    SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE'
    NETWORK_ERROR = 'NETWORK_ERROR'
    API_ERROR = 'API_ERROR'
    
    # Data processing errors
    PARSING_ERROR = 'PARSING_ERROR'
    SERIALIZATION_ERROR = 'SERIALIZATION_ERROR'
    DATA_CORRUPTION = 'DATA_CORRUPTION'
    
    # Application-specific errors
    CONFIGURATION_ERROR = 'CONFIGURATION_ERROR'
    DEPENDENCY_ERROR = 'DEPENDENCY_ERROR'
    
    # Generic fallback
    UNKNOWN_ERROR = 'UNKNOWN_ERROR'


class ErrorSeverity:
    """Error severity levels for prioritization and handling."""
    
    LOW = 'LOW'
    MEDIUM = 'MEDIUM'
    HIGH = 'HIGH'
    CRITICAL = 'CRITICAL'


class ContextTypes:
    """Context types for structured error reporting."""
    
    FILE = 'FILE'
    SERVICE = 'SERVICE'
    VALIDATION = 'VALIDATION'
    NETWORK = 'NETWORK'
    CONFIGURATION = 'CONFIGURATION'


# Legacy error type mapping for backward compatibility
LEGACY_ERROR_MAPPING = {
    ErrorTypes.FILE_NOT_FOUND: {
        'KEYWORDS_NOT_FOUND': 'Keywords file not found',
        'JOB_POSTING_NOT_FOUND': 'Job posting file not found',
        'RESUME_NOT_FOUND': 'Resume file not found'
    },
    ErrorTypes.PARSING_ERROR: {
        'JSON_PARSE_ERROR': 'JSON parsing failed',
        'MARKDOWN_PARSE_ERROR': 'Markdown parsing failed'
    },
    ErrorTypes.VALIDATION_ERROR: {
        'INVALID_KEYWORD_FORMAT': 'Invalid keyword structure',
        'MISSING_REQUIRED_FIELD': 'Required field missing'
    }
}


# Error configuration
ERROR_CONFIG = {
    'formatting': {
        'use_emojis': True,
        'include_stack_trace': False,
        'include_context': True
    },
    'logging': {
        'enabled': True,
        'max_context_lines': 5
    },
    'emojis': {
        'error': '❌',
        'warning': '⚠️',
        'info': 'ℹ️',
        'success': '✅'
    }
}
