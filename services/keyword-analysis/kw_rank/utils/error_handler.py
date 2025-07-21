"""
Centralized error handling utilities for Python keyword analysis service.

This module provides standardized error handling, logging, and result creation
to ensure consistent error management across the Python codebase. Mirrors the
JavaScript ErrorHandler class for cross-language consistency.
"""

import sys
import traceback
from pathlib import Path
from typing import Any, Dict, List, Optional, Union
from .error_types import ErrorTypes, ErrorSeverity, ContextTypes, ERROR_CONFIG, LEGACY_ERROR_MAPPING


class ErrorHandler:
    """Centralized error handling and logging utilities."""
    
    @staticmethod
    def log_error(message: str, error: Optional[Exception] = None, 
                  context: Optional[Dict[str, Any]] = None, 
                  details: Optional[List[str]] = None) -> None:
        """
        Log error with structured formatting and context.
        
        Args:
            message: Primary error message
            error: Original exception object (optional)
            context: Additional context information (optional)
            details: List of additional details (optional)
        """
        if not ERROR_CONFIG['logging']['enabled']:
            return
        
        # Format primary error message with emoji
        emoji = ERROR_CONFIG['emojis']['error'] if ERROR_CONFIG['formatting']['use_emojis'] else ''
        print(f"{emoji} {message}")
        
        # Log original error message if provided
        if error and str(error):
            print(f"   Original error: {str(error)}")
        
        # Log context information if provided and enabled
        if context and ERROR_CONFIG['formatting']['include_context']:
            for key, value in context.items():
                if value is not None:
                    print(f"   {key}: {value}")
        
        # Log additional details if provided
        if details:
            max_lines = ERROR_CONFIG['logging']['max_context_lines']
            for i, detail in enumerate(details[:max_lines]):
                print(f"   • {detail}")
            
            if len(details) > max_lines:
                print(f"   ... and {len(details) - max_lines} more details")
        
        # Log stack trace if enabled and error provided
        if (error and ERROR_CONFIG['formatting']['include_stack_trace']):
            print("   Stack trace:")
            traceback.print_exc()
    
    @staticmethod
    def log_app_error(message: str, component: str, error: Optional[Exception] = None,
                      context: Optional[Dict[str, Any]] = None) -> None:
        """
        Log application-level error with component context.
        
        Args:
            message: Error message
            component: Component or module name where error occurred
            error: Original exception (optional)
            context: Additional context (optional)
        """
        app_context = {'component': component}
        if context:
            app_context.update(context)
        
        ErrorHandler.log_error(message, error, app_context)
    
    @staticmethod
    def log_service_error(message: str, service: str, operation: str,
                         error: Optional[Exception] = None,
                         context: Optional[Dict[str, Any]] = None) -> None:
        """
        Log service-level error with structured context.
        
        Args:
            message: Error message
            service: Service name
            operation: Operation being performed
            error: Original exception (optional)
            context: Additional context (optional)
        """
        service_context = {
            'service': service,
            'operation': operation
        }
        if context:
            service_context.update(context)
        
        ErrorHandler.log_error(message, error, service_context)
    
    @staticmethod
    def create_result(success: bool, data: Any = None, error_message: str = None,
                     error_type: str = ErrorTypes.UNKNOWN_ERROR, 
                     details: List[str] = None,
                     legacy_error_type: str = None) -> Dict[str, Any]:
        """
        Create standardized result object for consistent return values.
        
        Args:
            success: Whether the operation succeeded
            data: Result data for successful operations
            error_message: Error message for failed operations
            error_type: Standardized error type
            details: Additional error details
            legacy_error_type: Legacy error type for backward compatibility
        
        Returns:
            Standardized result dictionary
        """
        if success:
            return {
                'is_valid': True,
                'success': True,
                'data': data
            }
        else:
            result = {
                'is_valid': False,
                'success': False,
                'error': error_message,
                'error_type': error_type,
                'details': details or []
            }
            
            # Add legacy error type for backward compatibility if provided
            if legacy_error_type:
                result['legacy_error_type'] = legacy_error_type
            
            return result
    
    @staticmethod
    def validate_input(validator_func, input_data: Any, 
                      error_message: str = "Input validation failed",
                      expected_format: str = None) -> Dict[str, Any]:
        """
        Validate input using provided validator function with structured error reporting.
        
        Args:
            validator_func: Function to validate input (should return bool)
            input_data: Data to validate
            error_message: Custom error message
            expected_format: Description of expected format
        
        Returns:
            Standardized result object
        """
        try:
            is_valid = validator_func(input_data)
            
            if is_valid:
                return ErrorHandler.create_result(True, input_data)
            else:
                details = []
                if expected_format:
                    details.append(f"Expected format: {expected_format}")
                
                return ErrorHandler.create_result(
                    False, None, error_message, 
                    ErrorTypes.VALIDATION_ERROR, details
                )
        
        except Exception as e:
            ErrorHandler.log_error(f"Validator function failed: {str(e)}", e)
            return ErrorHandler.create_result(
                False, None, f"Validation error: {str(e)}", 
                ErrorTypes.VALIDATION_ERROR
            )
    
    @staticmethod
    def assert_required(value: Any, field_name: str) -> None:
        """
        Assert that a required value is present and not empty.
        
        Args:
            value: Value to check
            field_name: Name of the field for error reporting
        
        Raises:
            ValueError: If value is None, empty string, or empty collection
        """
        if value is None:
            raise ValueError(f"Required field '{field_name}' is None")
        
        if isinstance(value, str) and not value.strip():
            raise ValueError(f"Required field '{field_name}' is empty")
        
        if hasattr(value, '__len__') and len(value) == 0:
            raise ValueError(f"Required field '{field_name}' is empty")
    
    @staticmethod
    def build_file_context(file_path: str, additional_info: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Build file context for error reporting.
        
        Args:
            file_path: Path to the file
            additional_info: Additional context information
        
        Returns:
            File context dictionary
        """
        context = {
            'context_type': ContextTypes.FILE,
            'file_path': str(file_path),
            'file_exists': Path(file_path).exists() if file_path else False
        }
        
        if file_path and Path(file_path).exists():
            path_obj = Path(file_path)
            context.update({
                'file_size': path_obj.stat().st_size,
                'file_extension': path_obj.suffix
            })
        
        if additional_info:
            context.update(additional_info)
        
        return context
    
    @staticmethod
    def build_service_context(service_name: str, operation: str,
                             additional_info: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Build service context for error reporting.
        
        Args:
            service_name: Name of the service
            operation: Operation being performed
            additional_info: Additional context information
        
        Returns:
            Service context dictionary
        """
        context = {
            'context_type': ContextTypes.SERVICE,
            'service': service_name,
            'operation': operation
        }
        
        if additional_info:
            context.update(additional_info)
        
        return context
    
    @staticmethod
    def build_validation_context(field_name: str, expected_format: str = None,
                                actual_value: Any = None,
                                additional_info: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Build validation context for error reporting.
        
        Args:
            field_name: Name of the field being validated
            expected_format: Expected format description
            actual_value: Actual value that failed validation
            additional_info: Additional context information
        
        Returns:
            Validation context dictionary
        """
        context = {
            'context_type': ContextTypes.VALIDATION,
            'field_name': field_name
        }
        
        if expected_format:
            context['expected_format'] = expected_format
        
        if actual_value is not None:
            context['actual_value'] = str(actual_value)[:100]  # Truncate long values
        
        if additional_info:
            context.update(additional_info)
        
        return context
    
    @staticmethod
    def get_legacy_error_type(error_type: str, context: str = None) -> str:
        """
        Get legacy error type for backward compatibility.
        
        Args:
            error_type: Modern error type
            context: Context to help determine specific legacy type
        
        Returns:
            Legacy error type string
        """
        if error_type in LEGACY_ERROR_MAPPING:
            legacy_mapping = LEGACY_ERROR_MAPPING[error_type]
            if context and context in legacy_mapping:
                return context
            # Return first available legacy type as fallback
            return list(legacy_mapping.keys())[0] if legacy_mapping else error_type
        
        return error_type
    
    @staticmethod
    def exit_with_error(message: str, error_type: str = ErrorTypes.UNKNOWN_ERROR,
                       exit_code: int = 1) -> None:
        """
        Log error and exit the application.
        
        Args:
            message: Error message to log
            error_type: Type of error
            exit_code: Exit code (default: 1)
        """
        ErrorHandler.log_error(message)
        sys.exit(exit_code)
