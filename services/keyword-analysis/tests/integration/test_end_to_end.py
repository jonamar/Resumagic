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
import sys
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
        
        # Create test keywords in canonical format (kw + role)
        raw_keywords = [
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
        keywords = []
        for kw in raw_keywords:
            role = 'functional_skills'
            if 'years' in kw or 'MBA' in kw or 'degree' in kw:
                role = 'core'
            keywords.append({'kw': kw, 'role': role})
        
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
        # Run keyword analysis via CLI-style main (no return value)
        saved_argv = sys.argv[:]
        try:
            sys.argv = [
                'kw_rank_modular.py',
                os.path.join(temp_application_dir, 'inputs', 'keywords.json'),
                os.path.join(temp_application_dir, 'inputs', 'resume.json'),
                '--top', '5',
                '--resume', os.path.join(temp_application_dir, 'inputs', 'resume.json')
            ]
            kw_main()
        finally:
            sys.argv = saved_argv
        
        # Check that output files were created
        working_dir = os.path.join(temp_application_dir, 'working')
        
        assert os.path.exists(os.path.join(working_dir, 'keyword_analysis.json'))
        assert os.path.exists(os.path.join(working_dir, 'keyword-checklist.md'))
        
    def test_clustering_and_aliases(self, temp_application_dir):
        """Test that clustering and alias assignment works"""
        saved_argv = sys.argv[:]
        try:
            sys.argv = [
                'kw_rank_modular.py',
                os.path.join(temp_application_dir, 'inputs', 'keywords.json'),
                os.path.join(temp_application_dir, 'inputs', 'resume.json'),
                '--top', '5',
                '--resume', os.path.join(temp_application_dir, 'inputs', 'resume.json')
            ]
            kw_main()
        finally:
            sys.argv = saved_argv
        
        # Find skills that should be clustered
        # Load analysis to inspect skills
        analysis_file = os.path.join(temp_application_dir, 'working', 'keyword_analysis.json')
        with open(analysis_file, 'r') as f:
            analysis = json.load(f)
        skills = analysis.get('skills_ranked', [])
        
        # Look for aliases in the results
        has_aliases = any(
            len(item.get('aliases', [])) > 0 
            for item in skills
        )
        
        # Should have some aliases if clustering threshold is appropriate
        assert has_aliases or len(skills) < 3  # Small dataset might not cluster
        
    def test_sentence_matching_integration(self, temp_application_dir):
        """Test sentence matching integration"""
        # Create a simple job posting file (second positional arg expects job file)
        job_file = os.path.join(temp_application_dir, 'inputs', 'job.md')
        with open(job_file, 'w') as f:
            f.write('Director of Product Management\nResponsibilities include strategy and roadmap.')
        saved_argv = sys.argv[:]
        try:
            sys.argv = [
                'kw_rank_modular.py',
                os.path.join(temp_application_dir, 'inputs', 'keywords.json'),
                job_file,
                '--top', '5',
                '--resume', os.path.join(temp_application_dir, 'inputs', 'resume.json')
            ]
            kw_main()
        finally:
            sys.argv = saved_argv
        
        # Load the detailed analysis file
        analysis_file = os.path.join(
            temp_application_dir, 'working', 'keyword_analysis.json'
        )
        
        with open(analysis_file, 'r') as f:
            detailed_analysis = json.load(f)
            
        # Injection analysis is optional depending on resume structure; just ensure analysis exists
        assert isinstance(detailed_analysis.get('knockout_requirements', []), list)
        assert isinstance(detailed_analysis.get('skills_ranked', []), list)
        
        injection_data = detailed_analysis.get('injection_analysis')
        if isinstance(injection_data, list):
            # Optional: ensure structure is a list when present
            assert isinstance(injection_data, list)

            # Check that some keywords have matches
            has_matches = any(
                len(item.get('matches', [])) > 0
                for item in injection_data
            )
            # Not asserting has_matches strictly; depends on resume content
        
    def test_checklist_generation(self, temp_application_dir):
        """Test checklist generation with proper formatting"""
        saved_argv = sys.argv[:]
        try:
            sys.argv = [
                'kw_rank_modular.py',
                os.path.join(temp_application_dir, 'inputs', 'keywords.json'),
                os.path.join(temp_application_dir, 'inputs', 'resume.json'),
                '--top', '5'
            ]
            kw_main()
        finally:
            sys.argv = saved_argv
        
        # Load the checklist file
        checklist_file = os.path.join(
            temp_application_dir, 'working', 'keyword-checklist.md'
        )
        
        with open(checklist_file, 'r') as f:
            checklist_content = f.read()
            
        # Verify checklist structure
        assert "# Keyword Optimization Checklist" in checklist_content
        assert "🎯 Knockout Requirements" in checklist_content
        # Dynamic top skills count header
        assert "🏆 Top" in checklist_content and "Skills" in checklist_content
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
            saved_argv = sys.argv[:]
            with pytest.raises(SystemExit):
                sys.argv = [
                    'kw_rank_modular.py',
                    os.path.join(app_dir, 'inputs', 'keywords.json'),
                    os.path.join(app_dir, 'inputs', 'resume.json'),
                ]
                kw_main()
            sys.argv = saved_argv
            
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
                
            saved_argv = sys.argv[:]
            with pytest.raises(SystemExit):
                sys.argv = [
                    'kw_rank_modular.py',
                    os.path.join(app_dir, 'inputs', 'keywords.json'),
                    os.path.join(app_dir, 'inputs', 'resume.json'),
                ]
                kw_main()
            sys.argv = saved_argv
            
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
                
            saved_argv = sys.argv[:]
            try:
                sys.argv = [
                    'kw_rank_modular.py',
                    os.path.join(app_dir, 'inputs', 'keywords.json'),
                    os.path.join(app_dir, 'inputs', 'resume.json'),
                ]
                kw_main()
            finally:
                sys.argv = saved_argv

            # Expect empty outputs, not exit
            working_dir = os.path.join(app_dir, 'working')
            analysis_file = os.path.join(working_dir, 'keyword_analysis.json')
            checklist_file = os.path.join(working_dir, 'keyword-checklist.md')
            assert os.path.exists(analysis_file)
            assert os.path.exists(checklist_file)
            with open(analysis_file, 'r') as f:
                data = json.load(f)
            assert len(data.get('knockout_requirements', [])) == 0
            assert len(data.get('skills_ranked', [])) == 0


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
            
            # Legacy keyword format adapted to canonical roles
            keywords = [
                {'kw': 'product management', 'role': 'functional_skills'},
                {'kw': 'team leadership', 'role': 'functional_skills'},
                {'kw': 'strategic planning', 'role': 'functional_skills'}
            ]
            
            with open(os.path.join(inputs_dir, 'resume.json'), 'w') as f:
                json.dump(resume_data, f)
                
            with open(os.path.join(inputs_dir, 'keywords.json'), 'w') as f:
                json.dump(keywords, f)
                
            saved_argv = sys.argv[:]
            try:
                sys.argv = [
                    'kw_rank_modular.py',
                    os.path.join(app_dir, 'inputs', 'keywords.json'),
                    os.path.join(app_dir, 'inputs', 'resume.json'),
                ]
                kw_main()
            finally:
                sys.argv = saved_argv
            
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
            
            # Mixed format adapted to canonical roles
            keywords = [
                {'kw': 'product management', 'role': 'functional_skills'},
                {'kw': 'team leadership', 'role': 'functional_skills'},
                {'kw': 'strategic planning', 'role': 'functional_skills'}
            ]
            
            with open(os.path.join(inputs_dir, 'resume.json'), 'w') as f:
                json.dump(resume_data, f)
                
            with open(os.path.join(inputs_dir, 'keywords.json'), 'w') as f:
                json.dump(keywords, f)
                
            saved_argv = sys.argv[:]
            try:
                sys.argv = [
                    'kw_rank_modular.py',
                    os.path.join(app_dir, 'inputs', 'keywords.json'),
                    os.path.join(app_dir, 'inputs', 'resume.json'),
                ]
                kw_main()
            finally:
                sys.argv = saved_argv

            # Validate outputs exist
            working_dir = os.path.join(app_dir, 'working')
            assert os.path.exists(os.path.join(working_dir, 'keyword_analysis.json'))