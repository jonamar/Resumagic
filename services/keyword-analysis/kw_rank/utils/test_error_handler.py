"""
Unit tests for Python error handling utilities.

Tests the ErrorHandler class and error_types module to ensure consistent
error handling behavior and cross-language compatibility with JavaScript.
"""

import unittest
import sys
from io import StringIO
from unittest.mock import patch, MagicMock
from pathlib import Path
import tempfile
import os

from .error_handler import ErrorHandler
from .error_types import ErrorTypes, ErrorSeverity, ContextTypes, ERROR_CONFIG


class TestErrorHandler(unittest.TestCase):
    """Test cases for ErrorHandler class."""
    
    def setUp(self):
        """Set up test fixtures."""
        # Capture stdout for testing log output
        self.captured_output = StringIO()
        self.original_stdout = sys.stdout
        
    def tearDown(self):
        """Clean up after tests."""
        sys.stdout = self.original_stdout
    
    def capture_output(self):
        """Start capturing stdout."""
        sys.stdout = self.captured_output
        self.captured_output.seek(0)
        self.captured_output.truncate(0)
    
    def get_output(self):
        """Get captured output."""
        sys.stdout = self.original_stdout
        output = self.captured_output.getvalue()
        return output
    
    def test_log_error_basic(self):
        """Test basic error logging."""
        self.capture_output()
        ErrorHandler.log_error("Test error message")
        output = self.get_output()
        
        self.assertIn("❌ Test error message", output)
    
    def test_log_error_with_exception(self):
        """Test error logging with exception object."""
        self.capture_output()
        test_exception = ValueError("Test exception")
        ErrorHandler.log_error("Test error", error=test_exception)
        output = self.get_output()
        
        self.assertIn("❌ Test error", output)
        self.assertIn("Original error: Test exception", output)
    
    def test_log_error_with_context(self):
        """Test error logging with context information."""
        self.capture_output()
        context = {"file_path": "/test/path", "operation": "load"}
        ErrorHandler.log_error("Test error", context=context)
        output = self.get_output()
        
        self.assertIn("❌ Test error", output)
        self.assertIn("file_path: /test/path", output)
        self.assertIn("operation: load", output)
    
    def test_log_error_with_details(self):
        """Test error logging with details array."""
        self.capture_output()
        details = ["Detail 1", "Detail 2", "Detail 3"]
        ErrorHandler.log_error("Test error", details=details)
        output = self.get_output()
        
        self.assertIn("❌ Test error", output)
        self.assertIn("• Detail 1", output)
        self.assertIn("• Detail 2", output)
        self.assertIn("• Detail 3", output)
    
    def test_log_error_details_limit(self):
        """Test that details are limited to max_context_lines."""
        self.capture_output()
        details = [f"Detail {i}" for i in range(10)]  # More than max limit
        ErrorHandler.log_error("Test error", details=details)
        output = self.get_output()
        
        self.assertIn("❌ Test error", output)
        self.assertIn("... and 5 more details", output)  # Should show truncation
    
    def test_log_error_disabled(self):
        """Test that logging can be disabled."""
        original_enabled = ERROR_CONFIG['logging']['enabled']
        ERROR_CONFIG['logging']['enabled'] = False
        
        try:
            self.capture_output()
            ErrorHandler.log_error("Test error")
            output = self.get_output()
            
            self.assertEqual(output.strip(), "")  # No output when disabled
        finally:
            ERROR_CONFIG['logging']['enabled'] = original_enabled
    
    def test_log_app_error(self):
        """Test application error logging with component context."""
        self.capture_output()
        ErrorHandler.log_app_error("App error", "test_component")
        output = self.get_output()
        
        self.assertIn("❌ App error", output)
        self.assertIn("component: test_component", output)
    
    def test_log_service_error(self):
        """Test service error logging with structured context."""
        self.capture_output()
        ErrorHandler.log_service_error("Service error", "test_service", "load_data")
        output = self.get_output()
        
        self.assertIn("❌ Service error", output)
        self.assertIn("service: test_service", output)
        self.assertIn("operation: load_data", output)
    
    def test_create_result_success(self):
        """Test creating successful result."""
        result = ErrorHandler.create_result(True, {"key": "value"})
        
        self.assertTrue(result['is_valid'])
        self.assertTrue(result['success'])
        self.assertEqual(result['data'], {"key": "value"})
        self.assertNotIn('error', result)
    
    def test_create_result_error(self):
        """Test creating error result."""
        result = ErrorHandler.create_result(
            False, None, "Test error", ErrorTypes.FILE_NOT_FOUND, 
            ["detail1", "detail2"], "LEGACY_ERROR"
        )
        
        self.assertFalse(result['is_valid'])
        self.assertFalse(result['success'])
        self.assertEqual(result['error'], "Test error")
        self.assertEqual(result['error_type'], ErrorTypes.FILE_NOT_FOUND)
        self.assertEqual(result['details'], ["detail1", "detail2"])
        self.assertEqual(result['legacy_error_type'], "LEGACY_ERROR")
    
    def test_validate_input_success(self):
        """Test successful input validation."""
        def validator(data):
            return isinstance(data, str) and len(data) > 0
        
        result = ErrorHandler.validate_input(validator, "test_data")
        
        self.assertTrue(result['success'])
        self.assertEqual(result['data'], "test_data")
    
    def test_validate_input_failure(self):
        """Test failed input validation."""
        def validator(data):
            return isinstance(data, str) and len(data) > 5
        
        result = ErrorHandler.validate_input(
            validator, "test", "Input too short", "String longer than 5 characters"
        )
        
        self.assertFalse(result['success'])
        self.assertEqual(result['error'], "Input too short")
        self.assertEqual(result['error_type'], ErrorTypes.VALIDATION_ERROR)
        self.assertIn("Expected format: String longer than 5 characters", result['details'])
    
    def test_validate_input_exception(self):
        """Test validator function that raises exception."""
        def failing_validator(data):
            raise ValueError("Validator failed")
        
        result = ErrorHandler.validate_input(failing_validator, "test_data")
        
        self.assertFalse(result['success'])
        self.assertIn("Validation error", result['error'])
        self.assertEqual(result['error_type'], ErrorTypes.VALIDATION_ERROR)
    
    def test_assert_required_valid(self):
        """Test assert_required with valid values."""
        # Should not raise for valid values
        ErrorHandler.assert_required("valid_string", "test_field")
        ErrorHandler.assert_required(["item1", "item2"], "test_list")
        ErrorHandler.assert_required(42, "test_number")
    
    def test_assert_required_none(self):
        """Test assert_required with None value."""
        with self.assertRaises(ValueError) as context:
            ErrorHandler.assert_required(None, "test_field")
        
        self.assertIn("Required field 'test_field' is None", str(context.exception))
    
    def test_assert_required_empty_string(self):
        """Test assert_required with empty string."""
        with self.assertRaises(ValueError) as context:
            ErrorHandler.assert_required("", "test_field")
        
        self.assertIn("Required field 'test_field' is empty", str(context.exception))
    
    def test_assert_required_empty_list(self):
        """Test assert_required with empty list."""
        with self.assertRaises(ValueError) as context:
            ErrorHandler.assert_required([], "test_field")
        
        self.assertIn("Required field 'test_field' is empty", str(context.exception))
    
    def test_build_file_context(self):
        """Test building file context."""
        # Create a temporary file for testing
        with tempfile.NamedTemporaryFile(mode='w', delete=False) as temp_file:
            temp_file.write("test content")
            temp_path = temp_file.name
        
        try:
            context = ErrorHandler.build_file_context(temp_path)
            
            self.assertEqual(context['context_type'], ContextTypes.FILE)
            self.assertEqual(context['file_path'], temp_path)
            self.assertTrue(context['file_exists'])
            self.assertIn('file_size', context)
            self.assertIn('file_extension', context)
        finally:
            os.unlink(temp_path)
    
    def test_build_file_context_nonexistent(self):
        """Test building file context for non-existent file."""
        context = ErrorHandler.build_file_context("/nonexistent/file.txt")
        
        self.assertEqual(context['context_type'], ContextTypes.FILE)
        self.assertEqual(context['file_path'], "/nonexistent/file.txt")
        self.assertFalse(context['file_exists'])
    
    def test_build_service_context(self):
        """Test building service context."""
        context = ErrorHandler.build_service_context("test_service", "load_data")
        
        self.assertEqual(context['context_type'], ContextTypes.SERVICE)
        self.assertEqual(context['service'], "test_service")
        self.assertEqual(context['operation'], "load_data")
    
    def test_build_validation_context(self):
        """Test building validation context."""
        context = ErrorHandler.build_validation_context(
            "test_field", "string format", "invalid_value"
        )
        
        self.assertEqual(context['context_type'], ContextTypes.VALIDATION)
        self.assertEqual(context['field_name'], "test_field")
        self.assertEqual(context['expected_format'], "string format")
        self.assertEqual(context['actual_value'], "invalid_value")
    
    def test_get_legacy_error_type(self):
        """Test getting legacy error type for backward compatibility."""
        legacy_type = ErrorHandler.get_legacy_error_type(
            ErrorTypes.FILE_NOT_FOUND, "KEYWORDS_NOT_FOUND"
        )
        
        self.assertEqual(legacy_type, "KEYWORDS_NOT_FOUND")
    
    def test_get_legacy_error_type_fallback(self):
        """Test legacy error type fallback."""
        legacy_type = ErrorHandler.get_legacy_error_type(ErrorTypes.UNKNOWN_ERROR)
        
        self.assertEqual(legacy_type, ErrorTypes.UNKNOWN_ERROR)
    
    @patch('sys.exit')
    def test_exit_with_error(self, mock_exit):
        """Test exit_with_error function."""
        self.capture_output()
        ErrorHandler.exit_with_error("Fatal error", ErrorTypes.UNKNOWN_ERROR, 2)
        output = self.get_output()
        
        self.assertIn("❌ Fatal error", output)
        mock_exit.assert_called_once_with(2)


class TestErrorTypes(unittest.TestCase):
    """Test cases for error types and constants."""
    
    def test_error_types_constants(self):
        """Test that error type constants are properly defined."""
        self.assertEqual(ErrorTypes.FILE_NOT_FOUND, 'FILE_NOT_FOUND')
        self.assertEqual(ErrorTypes.VALIDATION_ERROR, 'VALIDATION_ERROR')
        self.assertEqual(ErrorTypes.UNKNOWN_ERROR, 'UNKNOWN_ERROR')
    
    def test_error_severity_constants(self):
        """Test that error severity constants are properly defined."""
        self.assertEqual(ErrorSeverity.LOW, 'LOW')
        self.assertEqual(ErrorSeverity.HIGH, 'HIGH')
        self.assertEqual(ErrorSeverity.CRITICAL, 'CRITICAL')
    
    def test_context_types_constants(self):
        """Test that context type constants are properly defined."""
        self.assertEqual(ContextTypes.FILE, 'FILE')
        self.assertEqual(ContextTypes.SERVICE, 'SERVICE')
        self.assertEqual(ContextTypes.VALIDATION, 'VALIDATION')
    
    def test_error_config_structure(self):
        """Test that error configuration has expected structure."""
        self.assertIn('formatting', ERROR_CONFIG)
        self.assertIn('logging', ERROR_CONFIG)
        self.assertIn('emojis', ERROR_CONFIG)
        
        self.assertIn('use_emojis', ERROR_CONFIG['formatting'])
        self.assertIn('enabled', ERROR_CONFIG['logging'])
        self.assertIn('error', ERROR_CONFIG['emojis'])


if __name__ == '__main__':
    unittest.main()
