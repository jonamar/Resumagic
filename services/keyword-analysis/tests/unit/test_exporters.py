"""
Unit tests for kw_rank.io.exporters module
"""
import pytest
import json
import tempfile
import os
from unittest.mock import patch, mock_open
from kw_rank.io.exporters import (
    save_json_results, save_top_skills, save_keyword_checklist,
    export_all_results, format_checklist_section
)


class TestSaveJsonResults:
    """Test JSON results saving"""
    
    def test_save_valid_json(self):
        """Test saving valid JSON data"""
        test_data = {
            'knockouts': [{'keyword': 'MBA', 'score': 0.8}],
            'skills': [{'keyword': 'product management', 'score': 0.9}]
        }
        
        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
            temp_path = f.name
            
        try:
            success = save_json_results(test_data, temp_path)
            assert success
            
            # Verify file contents
            with open(temp_path, 'r') as f:
                saved_data = json.load(f)
            assert saved_data == test_data
            
        finally:
            if os.path.exists(temp_path):
                os.unlink(temp_path)
                
    def test_save_to_invalid_path(self):
        """Test saving to invalid file path"""
        test_data = {'test': 'data'}
        
        success = save_json_results(test_data, '/invalid/path/file.json')
        assert not success
        
    def test_save_invalid_data(self):
        """Test saving non-serializable data"""
        # Create non-serializable data (function object)
        test_data = {'function': lambda x: x}
        
        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
            temp_path = f.name
            
        try:
            success = save_json_results(test_data, temp_path)
            assert not success
        finally:
            if os.path.exists(temp_path):
                os.unlink(temp_path)


class TestSaveTopSkills:
    """Test top skills saving"""
    
    def test_save_skills_with_aliases(self):
        """Test saving skills that have aliases"""
        skills_data = [
            {
                'keyword': 'product management',
                'score': 0.95,
                'aliases': ['product strategy', 'product planning']
            },
            {
                'keyword': 'leadership',
                'score': 0.87,
                'aliases': ['team management']
            }
        ]
        
        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
            temp_path = f.name
            
        try:
            success = save_top_skills(skills_data, temp_path, top_n=5)
            assert success
            
            # Verify file contents
            with open(temp_path, 'r') as f:
                saved_data = json.load(f)
                
            assert len(saved_data) == 2
            assert saved_data[0]['keyword'] == 'product management'
            assert 'aliases' in saved_data[0]
            
        finally:
            if os.path.exists(temp_path):
                os.unlink(temp_path)
                
    def test_save_skills_limit_top_n(self):
        """Test limiting to top N skills"""
        skills_data = [
            {'keyword': f'skill_{i}', 'score': 1.0 - i*0.1, 'aliases': []}
            for i in range(10)
        ]
        
        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
            temp_path = f.name
            
        try:
            success = save_top_skills(skills_data, temp_path, top_n=3)
            assert success
            
            with open(temp_path, 'r') as f:
                saved_data = json.load(f)
                
            # Should only save top 3
            assert len(saved_data) == 3
            assert saved_data[0]['keyword'] == 'skill_0'  # Highest score
            
        finally:
            if os.path.exists(temp_path):
                os.unlink(temp_path)
                
    def test_save_empty_skills(self):
        """Test saving empty skills list"""
        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
            temp_path = f.name
            
        try:
            success = save_top_skills([], temp_path, top_n=5)
            assert success
            
            with open(temp_path, 'r') as f:
                saved_data = json.load(f)
                
            assert saved_data == []
            
        finally:
            if os.path.exists(temp_path):
                os.unlink(temp_path)


class TestFormatChecklistSection:
    """Test checklist section formatting"""
    
    def test_format_knockouts_section(self):
        """Test formatting knockouts section"""
        items = [
            {'keyword': 'MBA required', 'score': 0.85, 'aliases': []},
            {'keyword': '5+ years experience', 'score': 0.72, 'aliases': []}
        ]
        
        result = format_checklist_section(
            items, 
            "🎯 Knockout Requirements",
            "These are critical qualifications that must be addressed."
        )
        
        assert "🎯 Knockout Requirements" in result
        assert "MBA required" in result
        assert "5+ years experience" in result
        assert "(score: 0.85)" in result
        assert "(score: 0.72)" in result
        
    def test_format_skills_with_aliases(self):
        """Test formatting skills section with aliases"""
        items = [
            {
                'keyword': 'product management',
                'score': 0.95,
                'aliases': ['product strategy', 'product planning']
            }
        ]
        
        result = format_checklist_section(
            items,
            "🏆 Top Skills",
            "These are the highest-priority skills to emphasize."
        )
        
        assert "product management" in result
        assert "(aliases: product strategy, product planning)" in result
        
    def test_format_empty_section(self):
        """Test formatting empty section"""
        result = format_checklist_section([], "Test Section", "Description")
        
        assert "Test Section" in result
        assert "Description" in result
        # Should not have any list items
        assert "- [ ]" not in result


class TestSaveKeywordChecklist:
    """Test keyword checklist saving"""
    
    def test_save_complete_checklist(self):
        """Test saving complete keyword checklist"""
        categorized_data = {
            'knockouts': [
                {'keyword': 'MBA', 'score': 0.8, 'aliases': []},
                {'keyword': '5+ years experience', 'score': 0.7, 'aliases': []}
            ],
            'skills': [
                {
                    'keyword': 'product management',
                    'score': 0.95,
                    'aliases': ['product strategy']
                },
                {'keyword': 'leadership', 'score': 0.87, 'aliases': []}
            ]
        }
        
        with tempfile.NamedTemporaryFile(mode='w', suffix='.md', delete=False) as f:
            temp_path = f.name
            
        try:
            success = save_keyword_checklist(categorized_data, temp_path)
            assert success
            
            # Verify file contents
            with open(temp_path, 'r') as f:
                content = f.read()
                
            assert "# Keyword Optimization Checklist" in content
            assert "🎯 Knockout Requirements" in content
            assert "🏆 Top 3 Skills" in content
            assert "MBA" in content
            assert "product management" in content
            assert "(aliases: product strategy)" in content
            
        finally:
            if os.path.exists(temp_path):
                os.unlink(temp_path)
                
    def test_save_checklist_no_knockouts(self):
        """Test saving checklist with no knockouts"""
        categorized_data = {
            'knockouts': [],
            'skills': [
                {'keyword': 'product management', 'score': 0.95, 'aliases': []}
            ]
        }
        
        with tempfile.NamedTemporaryFile(mode='w', suffix='.md', delete=False) as f:
            temp_path = f.name
            
        try:
            success = save_keyword_checklist(categorized_data, temp_path)
            assert success
            
            with open(temp_path, 'r') as f:
                content = f.read()
                
            assert "🎯 Knockout Requirements" in content
            assert "🏆 Top 3 Skills" in content
            assert "product management" in content
            
        finally:
            if os.path.exists(temp_path):
                os.unlink(temp_path)


class TestExportAllResults:
    """Test complete results export"""
    
    @patch('kw_rank.io.exporters.save_json_results')
    @patch('kw_rank.io.exporters.save_top_skills')
    @patch('kw_rank.io.exporters.save_keyword_checklist')
    def test_export_all_success(self, mock_checklist, mock_top, mock_json):
        """Test successful export of all results"""
        # Mock all save operations as successful
        mock_json.return_value = True
        mock_top.return_value = True
        mock_checklist.return_value = True
        
        categorized_data = {
            'knockouts': [{'keyword': 'MBA', 'score': 0.8, 'aliases': []}],
            'skills': [{'keyword': 'product', 'score': 0.9, 'aliases': []}]
        }
        
        output_dir = '/test/output'
        
        success = export_all_results(categorized_data, output_dir)
        assert success
        
        # Verify all export functions were called
        mock_json.assert_called_once()
        mock_top.assert_called_once()
        mock_checklist.assert_called_once()
        
    @patch('kw_rank.io.exporters.save_json_results')
    @patch('kw_rank.io.exporters.save_top_skills')
    @patch('kw_rank.io.exporters.save_keyword_checklist')
    def test_export_all_partial_failure(self, mock_checklist, mock_top, mock_json):
        """Test export when some operations fail"""
        # Mock partial failure
        mock_json.return_value = True
        mock_top.return_value = False  # This one fails
        mock_checklist.return_value = True
        
        categorized_data = {
            'knockouts': [],
            'skills': [{'keyword': 'test', 'score': 0.5, 'aliases': []}]
        }
        
        success = export_all_results(categorized_data, '/test/output')
        assert not success  # Should fail if any operation fails