"""
Data loading module for keyword analysis.

Handles loading and validation of JSON keywords and markdown job postings.
"""

import json
import sys
from pathlib import Path


def load_keywords(keywords_file):
    """Load keywords from JSON file with error handling."""
    try:
        with open(keywords_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # Handle both list format and object format with keywords array
        if isinstance(data, list):
            keywords = data
        elif isinstance(data, dict) and 'keywords' in data:
            keywords = data['keywords']
        else:
            print(f"Error: Invalid keywords file format. Expected list or object with 'keywords' array.")
            sys.exit(1)
        
        # Validate keyword structure and normalize field names
        for i, keyword in enumerate(keywords):
            if not isinstance(keyword, dict):
                print(f"Error: Keyword {i} is not a valid object")
                sys.exit(1)
            
            # Handle both 'text' and 'kw' field names for backward compatibility
            if 'kw' in keyword and 'text' not in keyword:
                keyword['text'] = keyword['kw']
            elif 'text' not in keyword and 'kw' not in keyword:
                print(f"Error: Keyword {i} missing 'text' or 'kw' field")
                sys.exit(1)
            
            if 'role' not in keyword:
                print(f"Error: Keyword {i} missing 'role' field")
                sys.exit(1)
        
        print(f"📊 Loading {len(keywords)} keywords")
        return keywords
        
    except FileNotFoundError:
        print(f"Error: Keywords file not found: {keywords_file}")
        sys.exit(1)
    except json.JSONDecodeError as e:
        print(f"Error: Invalid JSON in keywords file: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"Error loading keywords: {e}")
        sys.exit(1)


def load_job_posting(job_file):
    """Load job posting from markdown file with error handling."""
    try:
        with open(job_file, 'r', encoding='utf-8') as f:
            job_text = f.read()
        
        if not job_text.strip():
            print(f"Warning: Job posting file is empty: {job_file}")
            return ""
        
        return job_text
        
    except FileNotFoundError:
        print(f"Error: Job posting file not found: {job_file}")
        sys.exit(1)
    except Exception as e:
        print(f"Error loading job posting: {e}")
        sys.exit(1)


def load_resume_json(resume_file):
    """Load resume JSON file with error handling."""
    try:
        with open(resume_file, 'r', encoding='utf-8') as f:
            resume_data = json.load(f)
        
        return resume_data
        
    except FileNotFoundError:
        print(f"Error: Resume file not found: {resume_file}")
        raise
    except json.JSONDecodeError as e:
        print(f"Error: Invalid JSON in resume file: {e}")
        raise
    except Exception as e:
        print(f"Error loading resume: {e}")
        raise