"""
Data loading module for keyword analysis.

Handles loading and validation of JSON keywords and markdown job postings.
Uses centralized error handling for consistent error management.
"""

import json
from pathlib import Path
from ..utils.error_handler import ErrorHandler
from ..utils.error_types import ErrorTypes


def load_keywords(keywords_file):
    """Load keywords from JSON file with centralized error handling."""
    try:
        # Build file context for error reporting
        context = ErrorHandler.build_file_context(keywords_file)
        
        with open(keywords_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # Handle both list format and object format with keywords array
        if isinstance(data, list):
            keywords = data
        elif isinstance(data, dict) and 'keywords' in data:
            keywords = data['keywords']
        else:
            ErrorHandler.log_app_error(
                "Invalid keywords file format. Expected list or object with 'keywords' array.",
                "loaders",
                context=context
            )
            ErrorHandler.exit_with_error(
                "Invalid keywords file format", 
                ErrorTypes.INVALID_FORMAT
            )
        
        # Validate keyword structure and normalize field names
        for i, keyword in enumerate(keywords):
            if not isinstance(keyword, dict):
                validation_context = ErrorHandler.build_validation_context(
                    f"keyword[{i}]", "dictionary object", type(keyword).__name__
                )
                ErrorHandler.log_app_error(
                    f"Keyword {i} is not a valid object",
                    "loaders",
                    context=validation_context
                )
                ErrorHandler.exit_with_error(
                    f"Invalid keyword structure at index {i}", 
                    ErrorTypes.VALIDATION_ERROR
                )
            
            # Handle both 'text' and 'kw' field names for backward compatibility
            if 'kw' in keyword and 'text' not in keyword:
                keyword['text'] = keyword['kw']
            elif 'text' not in keyword and 'kw' not in keyword:
                validation_context = ErrorHandler.build_validation_context(
                    f"keyword[{i}]", "'text' or 'kw' field", str(keyword.keys())
                )
                ErrorHandler.log_app_error(
                    f"Keyword {i} missing 'text' or 'kw' field",
                    "loaders",
                    context=validation_context
                )
                ErrorHandler.exit_with_error(
                    f"Missing required field in keyword {i}", 
                    ErrorTypes.MISSING_REQUIRED_FIELD
                )
            
            if 'role' not in keyword:
                validation_context = ErrorHandler.build_validation_context(
                    f"keyword[{i}]", "'role' field", str(keyword.keys())
                )
                ErrorHandler.log_app_error(
                    f"Keyword {i} missing 'role' field",
                    "loaders",
                    context=validation_context
                )
                ErrorHandler.exit_with_error(
                    f"Missing required 'role' field in keyword {i}", 
                    ErrorTypes.MISSING_REQUIRED_FIELD
                )
        
        print(f"📊 Loading {len(keywords)} keywords")
        return keywords
        
    except FileNotFoundError as e:
        ErrorHandler.log_app_error(
            f"Keywords file not found: {keywords_file}",
            "loaders",
            error=e,
            context=context
        )
        ErrorHandler.exit_with_error(
            f"Keywords file not found: {keywords_file}", 
            ErrorTypes.FILE_NOT_FOUND
        )
    except json.JSONDecodeError as e:
        ErrorHandler.log_app_error(
            f"Invalid JSON in keywords file: {str(e)}",
            "loaders",
            error=e,
            context=context
        )
        ErrorHandler.exit_with_error(
            f"Invalid JSON format in keywords file", 
            ErrorTypes.PARSING_ERROR
        )
    except Exception as e:
        ErrorHandler.log_app_error(
            f"Unexpected error loading keywords: {str(e)}",
            "loaders",
            error=e,
            context=context
        )
        ErrorHandler.exit_with_error(
            f"Failed to load keywords file", 
            ErrorTypes.UNKNOWN_ERROR
        )


def load_job_posting(job_file):
    """Load job posting from markdown file with centralized error handling."""
    try:
        # Build file context for error reporting
        context = ErrorHandler.build_file_context(job_file)
        
        with open(job_file, 'r', encoding='utf-8') as f:
            job_text = f.read()
        
        if not job_text.strip():
            # Log warning but don't exit - empty job posting might be valid
            ErrorHandler.log_error(
                f"⚠️ Job posting file is empty: {job_file}",
                context=context
            )
            return ""
        
        return job_text
        
    except FileNotFoundError as e:
        ErrorHandler.log_app_error(
            f"Job posting file not found: {job_file}",
            "loaders",
            error=e,
            context=context
        )
        ErrorHandler.exit_with_error(
            f"Job posting file not found: {job_file}", 
            ErrorTypes.FILE_NOT_FOUND
        )
    except Exception as e:
        ErrorHandler.log_app_error(
            f"Unexpected error loading job posting: {str(e)}",
            "loaders",
            error=e,
            context=context
        )
        ErrorHandler.exit_with_error(
            f"Failed to load job posting file", 
            ErrorTypes.UNKNOWN_ERROR
        )


def load_resume_json(resume_file):
    """Load resume JSON file with centralized error handling."""
    try:
        # Build file context for error reporting
        context = ErrorHandler.build_file_context(resume_file)
        
        with open(resume_file, 'r', encoding='utf-8') as f:
            resume_data = json.load(f)
        
        return resume_data
        
    except FileNotFoundError as e:
        ErrorHandler.log_app_error(
            f"Resume file not found: {resume_file}",
            "loaders",
            error=e,
            context=context
        )
        # Re-raise for caller to handle
        raise
    except json.JSONDecodeError as e:
        ErrorHandler.log_app_error(
            f"Invalid JSON in resume file: {str(e)}",
            "loaders",
            error=e,
            context=context
        )
        # Re-raise for caller to handle
        raise
    except Exception as e:
        ErrorHandler.log_app_error(
            f"Unexpected error loading resume: {str(e)}",
            "loaders",
            error=e,
            context=context
        )
        # Re-raise for caller to handle
        raise