"""
Unit tests for kw_rank.io.loaders module
"""
import pytest
import json
import tempfile
import os
from unittest.mock import patch, mock_open
from kw_rank.io.loaders import (
    load_resume_data, load_keywords, validate_resume_data,
    validate_keywords, safe_load_json
)


class TestSafeLoadJson:
    """Test safe JSON loading functionality"""
    
    def test_load_valid_json(self):
        """Test loading valid JSON file"""
        test_data = {"name": "John", "role": "PM"}
        
        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
            json.dump(test_data, f)
            temp_path = f.name
            
        try:
            result = safe_load_json(temp_path)
            assert result == test_data
        finally:
            os.unlink(temp_path)
            
    def test_load_invalid_json(self):
        """Test loading invalid JSON file"""
        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
            f.write('{"invalid": json}')  # Invalid JSON
            temp_path = f.name
            
        try:
            result = safe_load_json(temp_path)
            assert result is None
        finally:
            os.unlink(temp_path)
            
    def test_load_nonexistent_file(self):
        """Test loading nonexistent file"""
        result = safe_load_json('/nonexistent/path/file.json')
        assert result is None
        
    def test_load_empty_file(self):
        """Test loading empty file"""
        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
            temp_path = f.name  # Empty file
            
        try:
            result = safe_load_json(temp_path)
            assert result is None
        finally:
            os.unlink(temp_path)


class TestValidateResumeData:
    """Test resume data validation"""
    
    def test_validate_complete_resume(self):
        """Test validation of complete resume data"""
        resume_data = {
            'personal': {'name': 'John Doe'},
            'experiences': [
                {
                    'title': 'Product Manager',
                    'company': 'TechCorp',
                    'description': 'Led product teams'
                }
            ],
            'skills': ['Python', 'Leadership'],
            'education': [
                {
                    'degree': 'MBA',
                    'school': 'University'
                }
            ]
        }
        
        is_valid, errors = validate_resume_data(resume_data)
        assert is_valid
        assert len(errors) == 0
        
    def test_validate_minimal_resume(self):
        """Test validation of minimal resume data"""
        resume_data = {
            'personal': {'name': 'John Doe'},
            'experiences': []
        }
        
        is_valid, errors = validate_resume_data(resume_data)
        assert is_valid
        assert len(errors) == 0
        
    def test_validate_missing_required_fields(self):
        """Test validation with missing required fields"""
        resume_data = {
            'experiences': []  # Missing personal section
        }
        
        is_valid, errors = validate_resume_data(resume_data)
        assert not is_valid
        assert any('personal' in error.lower() for error in errors)
        
    def test_validate_invalid_structure(self):
        """Test validation with invalid data structure"""
        resume_data = {
            'personal': 'not_a_dict',  # Should be dict
            'experiences': 'not_a_list'  # Should be list
        }
        
        is_valid, errors = validate_resume_data(resume_data)
        assert not is_valid
        assert len(errors) > 0
        
    def test_validate_none_input(self):
        """Test validation with None input"""
        is_valid, errors = validate_resume_data(None)
        assert not is_valid
        assert len(errors) > 0


class TestValidateKeywords:
    """Test keyword validation"""
    
    def test_validate_string_keywords(self):
        """Test validation of string keyword list"""
        keywords = ['product management', 'leadership', 'agile']
        
        is_valid, errors = validate_keywords(keywords)
        assert is_valid
        assert len(errors) == 0
        
    def test_validate_dict_keywords(self):
        """Test validation of dictionary keyword format"""
        keywords = [
            {'kw': 'product management'},
            {'kw': 'leadership'},
            {'text': 'agile methodology'}  # Alternative field name
        ]
        
        is_valid, errors = validate_keywords(keywords)
        assert is_valid
        assert len(errors) == 0
        
    def test_validate_mixed_format_keywords(self):
        """Test validation of mixed format keywords"""
        keywords = [
            'product management',  # String
            {'kw': 'leadership'}   # Dict
        ]
        
        is_valid, errors = validate_keywords(keywords)
        assert is_valid
        assert len(errors) == 0
        
    def test_validate_empty_keywords(self):
        """Test validation of empty keyword list"""
        is_valid, errors = validate_keywords([])
        assert not is_valid
        assert any('empty' in error.lower() for error in errors)
        
    def test_validate_invalid_keyword_format(self):
        """Test validation with invalid keyword format"""
        keywords = [
            {'invalid_field': 'value'},  # Missing 'kw' or 'text'
            123,  # Invalid type
            ''    # Empty string
        ]
        
        is_valid, errors = validate_keywords(keywords)
        assert not is_valid
        assert len(errors) > 0
        
    def test_validate_none_keywords(self):
        """Test validation with None keywords"""
        is_valid, errors = validate_keywords(None)
        assert not is_valid
        assert len(errors) > 0


class TestLoadResumeData:
    """Test resume data loading"""
    
    @patch('kw_rank.io.loaders.safe_load_json')
    @patch('kw_rank.io.loaders.validate_resume_data')
    def test_load_valid_resume(self, mock_validate, mock_load):
        """Test loading valid resume data"""
        mock_data = {'personal': {'name': 'John'}, 'experiences': []}
        mock_load.return_value = mock_data
        mock_validate.return_value = (True, [])
        
        result = load_resume_data('/path/to/resume.json')
        
        assert result == mock_data
        mock_load.assert_called_once_with('/path/to/resume.json')
        mock_validate.assert_called_once_with(mock_data)
        
    @patch('kw_rank.io.loaders.safe_load_json')
    def test_load_resume_file_error(self, mock_load):
        """Test loading resume when file error occurs"""
        mock_load.return_value = None
        
        result = load_resume_data('/nonexistent/file.json')
        assert result is None
        
    @patch('kw_rank.io.loaders.safe_load_json')
    @patch('kw_rank.io.loaders.validate_resume_data')
    def test_load_resume_validation_error(self, mock_validate, mock_load):
        """Test loading resume with validation errors"""
        mock_load.return_value = {'invalid': 'data'}
        mock_validate.return_value = (False, ['Validation error'])
        
        result = load_resume_data('/path/to/resume.json')
        assert result is None


class TestLoadKeywords:
    """Test keyword loading"""
    
    @patch('kw_rank.io.loaders.safe_load_json')
    @patch('kw_rank.io.loaders.validate_keywords')
    def test_load_valid_keywords(self, mock_validate, mock_load):
        """Test loading valid keywords"""
        mock_data = ['product management', 'leadership']
        mock_load.return_value = mock_data
        mock_validate.return_value = (True, [])
        
        result = load_keywords('/path/to/keywords.json')
        
        assert result == mock_data
        mock_load.assert_called_once_with('/path/to/keywords.json')
        mock_validate.assert_called_once_with(mock_data)
        
    @patch('kw_rank.io.loaders.safe_load_json')
    def test_load_keywords_file_error(self, mock_load):
        """Test loading keywords when file error occurs"""
        mock_load.return_value = None
        
        result = load_keywords('/nonexistent/file.json')
        assert result is None
        
    @patch('kw_rank.io.loaders.safe_load_json')
    @patch('kw_rank.io.loaders.validate_keywords')
    def test_load_keywords_validation_error(self, mock_validate, mock_load):
        """Test loading keywords with validation errors"""
        mock_load.return_value = ['invalid', 'data']
        mock_validate.return_value = (False, ['Validation error'])
        
        result = load_keywords('/path/to/keywords.json')
        assert result is None