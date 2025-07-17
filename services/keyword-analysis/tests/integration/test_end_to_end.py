"""
Integration tests for end-to-end keyword analysis workflows
"""
import pytest
import tempfile
import json
import os
import shutil
from pathlib import Path
from unittest.mock import patch
from kw_rank.main import main as kw_main


class TestEndToEndWorkflow:
    """Test complete end-to-end keyword analysis workflow"""
    
    @pytest.fixture
    def temp_application_dir(self):
        """Create temporary application directory with test data"""
        temp_dir = tempfile.mkdtemp()
        app_dir = os.path.join(temp_dir, 'test-application')
        
        # Create directory structure
        os.makedirs(os.path.join(app_dir, 'inputs'))
        os.makedirs(os.path.join(app_dir, 'working'))
        
        # Create test resume data
        resume_data = {
            'personal': {
                'name': 'John Doe',
                'email': 'john@example.com'
            },
            'experiences': [
                {
                    'title': 'Senior Product Manager',
                    'company': 'TechCorp',
                    'description': 'Led product management initiatives for enterprise SaaS products. Managed cross-functional teams and delivered features that increased user engagement by 40%.'
                },
                {
                    'title': 'Product Manager',
                    'company': 'StartupCo',
                    'description': 'Developed product strategy and roadmap for mobile applications. Collaborated with engineering teams to deliver high-quality features.'
                }
            ],
            'skills': [
                'Product Management',
                'Agile Methodology',
                'Team Leadership',
                'Strategic Planning'
            ],
            'education': [
                {
                    'degree': 'MBA',
                    'school': 'Business University',
                    'year': '2018'
                }
            ]
        }
        
        # Create test keywords
        keywords = [
            'product management',
            'senior product manager',
            '5+ years of product experience',
            'MBA degree',
            'agile methodology',
            'team leadership',
            'strategic planning',
            'cross-functional collaboration',
            'user engagement',
            'mobile applications'
        ]
        
        # Save test files
        with open(os.path.join(app_dir, 'inputs', 'resume.json'), 'w') as f:
            json.dump(resume_data, f, indent=2)
            
        with open(os.path.join(app_dir, 'inputs', 'keywords.json'), 'w') as f:
            json.dump(keywords, f, indent=2)
            
        yield app_dir
        
        # Cleanup
        shutil.rmtree(temp_dir)
        
    def test_complete_analysis_workflow(self, temp_application_dir):
        """Test complete keyword analysis from input to output"""
        # Run keyword analysis
        result = kw_main(temp_application_dir)
        
        # Verify result structure
        assert result is not None
        assert 'knockouts' in result
        assert 'skills' in result
        
        # Check that knockouts were detected
        knockouts = result['knockouts']
        knockout_keywords = [item['keyword'] for item in knockouts]
        assert '5+ years of product experience' in knockout_keywords
        assert 'MBA degree' in knockout_keywords
        
        # Check that skills were categorized
        skills = result['skills']
        assert len(skills) > 0
        
        # Verify scores are reasonable
        for item in knockouts + skills:
            assert 'score' in item
            assert 0 <= item['score'] <= 1
            
        # Check that output files were created
        working_dir = os.path.join(temp_application_dir, 'working')
        
        assert os.path.exists(os.path.join(working_dir, 'keyword_analysis.json'))
        assert os.path.exists(os.path.join(working_dir, 'kw_rank_post.json'))
        assert os.path.exists(os.path.join(working_dir, 'top5.json'))
        assert os.path.exists(os.path.join(working_dir, 'keyword-checklist.md'))
        
    def test_clustering_and_aliases(self, temp_application_dir):
        """Test that clustering and alias assignment works"""
        result = kw_main(temp_application_dir)
        
        # Find skills that should be clustered
        skills = result['skills']
        
        # Look for aliases in the results
        has_aliases = any(
            len(item.get('aliases', [])) > 0 
            for item in skills
        )
        
        # Should have some aliases if clustering threshold is appropriate
        assert has_aliases or len(skills) < 3  # Small dataset might not cluster
        
    def test_sentence_matching_integration(self, temp_application_dir):
        """Test sentence matching integration"""
        result = kw_main(temp_application_dir)
        
        # Load the detailed analysis file
        analysis_file = os.path.join(
            temp_application_dir, 'working', 'keyword_analysis.json'
        )
        
        with open(analysis_file, 'r') as f:
            detailed_analysis = json.load(f)
            
        # Should have injection analysis
        assert 'injection_analysis' in detailed_analysis
        
        injection_data = detailed_analysis['injection_analysis']
        assert len(injection_data) > 0
        
        # Check that some keywords have matches
        has_matches = any(
            len(item.get('matches', [])) > 0
            for item in injection_data
        )
        assert has_matches
        
    def test_checklist_generation(self, temp_application_dir):
        """Test checklist generation with proper formatting"""
        result = kw_main(temp_application_dir)
        
        # Load the checklist file
        checklist_file = os.path.join(
            temp_application_dir, 'working', 'keyword-checklist.md'
        )
        
        with open(checklist_file, 'r') as f:
            checklist_content = f.read()
            
        # Verify checklist structure
        assert "# Keyword Optimization Checklist" in checklist_content
        assert "🎯 Knockout Requirements" in checklist_content
        assert "🏆 Top 3 Skills" in checklist_content
        assert "📝 Usage Notes" in checklist_content
        
        # Verify checkboxes are present
        assert "- [ ]" in checklist_content
        
        # Verify scores are included
        assert "(score:" in checklist_content


class TestErrorHandling:
    """Test error handling in integration scenarios"""
    
    def test_missing_input_files(self):
        """Test handling of missing input files"""
        with tempfile.TemporaryDirectory() as temp_dir:
            app_dir = os.path.join(temp_dir, 'test-app')
            os.makedirs(app_dir)
            
            # No input files created
            result = kw_main(app_dir)
            assert result is None
            
    def test_invalid_json_data(self):
        """Test handling of invalid JSON data"""
        with tempfile.TemporaryDirectory() as temp_dir:
            app_dir = os.path.join(temp_dir, 'test-app')
            inputs_dir = os.path.join(app_dir, 'inputs')
            os.makedirs(inputs_dir)
            
            # Create invalid JSON files
            with open(os.path.join(inputs_dir, 'resume.json'), 'w') as f:
                f.write('{"invalid": json}')
                
            with open(os.path.join(inputs_dir, 'keywords.json'), 'w') as f:
                f.write('[invalid json]')
                
            result = kw_main(app_dir)
            assert result is None
            
    def test_empty_keyword_list(self):
        """Test handling of empty keyword list"""
        with tempfile.TemporaryDirectory() as temp_dir:
            app_dir = os.path.join(temp_dir, 'test-app')
            inputs_dir = os.path.join(app_dir, 'inputs')
            os.makedirs(inputs_dir)
            
            # Create valid resume but empty keywords
            resume_data = {
                'personal': {'name': 'John Doe'},
                'experiences': [
                    {'title': 'PM', 'description': 'Product management'}
                ]
            }
            
            with open(os.path.join(inputs_dir, 'resume.json'), 'w') as f:
                json.dump(resume_data, f)
                
            with open(os.path.join(inputs_dir, 'keywords.json'), 'w') as f:
                json.dump([], f)
                
            result = kw_main(app_dir)
            assert result is None


class TestBackwardCompatibility:
    """Test backward compatibility with different data formats"""
    
    def test_legacy_keyword_format(self):
        """Test compatibility with legacy keyword format"""
        with tempfile.TemporaryDirectory() as temp_dir:
            app_dir = os.path.join(temp_dir, 'test-app')
            inputs_dir = os.path.join(app_dir, 'inputs')
            working_dir = os.path.join(app_dir, 'working')
            os.makedirs(inputs_dir)
            os.makedirs(working_dir)
            
            # Create resume data
            resume_data = {
                'personal': {'name': 'John Doe'},
                'experiences': [
                    {
                        'title': 'Product Manager',
                        'description': 'Led product teams'
                    }
                ]
            }
            
            # Create legacy keyword format (list of dicts)
            keywords = [
                {'kw': 'product management'},
                {'kw': 'team leadership'},
                {'text': 'strategic planning'}  # Alternative field
            ]
            
            with open(os.path.join(inputs_dir, 'resume.json'), 'w') as f:
                json.dump(resume_data, f)
                
            with open(os.path.join(inputs_dir, 'keywords.json'), 'w') as f:
                json.dump(keywords, f)
                
            result = kw_main(app_dir)
            
            # Should handle legacy format successfully
            assert result is not None
            assert 'knockouts' in result
            assert 'skills' in result
            
    def test_mixed_keyword_formats(self):
        """Test handling of mixed keyword formats"""
        with tempfile.TemporaryDirectory() as temp_dir:
            app_dir = os.path.join(temp_dir, 'test-app')
            inputs_dir = os.path.join(app_dir, 'inputs')
            working_dir = os.path.join(app_dir, 'working')
            os.makedirs(inputs_dir)
            os.makedirs(working_dir)
            
            resume_data = {
                'personal': {'name': 'John Doe'},
                'experiences': [{'title': 'PM', 'description': 'Product work'}]
            }
            
            # Mixed format: strings and dicts
            keywords = [
                'product management',  # String
                {'kw': 'team leadership'},  # Dict with 'kw'
                {'text': 'strategic planning'}  # Dict with 'text'
            ]
            
            with open(os.path.join(inputs_dir, 'resume.json'), 'w') as f:
                json.dump(resume_data, f)
                
            with open(os.path.join(inputs_dir, 'keywords.json'), 'w') as f:
                json.dump(keywords, f)
                
            result = kw_main(app_dir)
            
            assert result is not None
            # Should process all keywords regardless of format
            total_keywords = len(result['knockouts']) + len(result['skills'])
            assert total_keywords == 3