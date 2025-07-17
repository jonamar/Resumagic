"""
Unit tests for kw_rank.core.scoring module
"""
import pytest
import numpy as np
from unittest.mock import patch, MagicMock
from kw_rank.core.scoring import (
    calculate_tfidf_scores, score_single_keyword, 
    apply_enhancements, compound_keyword_boost
)


class TestCalculateTfidfScores:
    """Test TF-IDF calculation functionality"""
    
    def test_basic_tfidf_calculation(self):
        """Test basic TF-IDF calculation with simple documents"""
        documents = [
            "product manager role",
            "senior product manager",
            "product management experience"
        ]
        keywords = ["product", "manager", "senior"]
        
        scores = calculate_tfidf_scores(documents, keywords)
        
        # Check that scores are returned for all keywords
        assert len(scores) == len(keywords)
        assert all(score >= 0 for score in scores.values())
        
        # "product" should have high score (appears in all docs)
        # "senior" should have lower score (appears in only one doc)
        assert scores["senior"] < scores["product"]
        
    def test_empty_documents(self):
        """Test TF-IDF with empty document list"""
        documents = []
        keywords = ["product", "manager"]
        
        scores = calculate_tfidf_scores(documents, keywords)
        assert all(score == 0 for score in scores.values())
        
    def test_keywords_not_in_documents(self):
        """Test keywords that don't appear in any document"""
        documents = ["software engineer role"]
        keywords = ["product", "manager", "marketing"]
        
        scores = calculate_tfidf_scores(documents, keywords)
        assert all(score == 0 for score in scores.values())


class TestScoreSingleKeyword:
    """Test single keyword scoring functionality"""
    
    def test_keyword_with_role_boost(self):
        """Test keyword scoring with role-based boost"""
        mock_resume_data = {
            'experiences': [
                {
                    'title': 'Product Manager',
                    'description': 'Led product development teams'
                }
            ]
        }
        
        with patch('kw_rank.core.scoring.calculate_tfidf_scores') as mock_tfidf:
            mock_tfidf.return_value = {'product': 0.5}
            
            score = score_single_keyword('product', mock_resume_data)
            
            # Should be base score + role boost
            assert score > 0.5  # Base TF-IDF + role boost
            
    def test_keyword_not_found(self):
        """Test scoring for keyword not found in resume"""
        mock_resume_data = {
            'experiences': [
                {
                    'title': 'Software Engineer',
                    'description': 'Built web applications'
                }
            ]
        }
        
        with patch('kw_rank.core.scoring.calculate_tfidf_scores') as mock_tfidf:
            mock_tfidf.return_value = {'marketing': 0.0}
            
            score = score_single_keyword('marketing', mock_resume_data)
            assert score == 0.0


class TestApplyEnhancements:
    """Test scoring enhancement functionality"""
    
    def test_section_boost_applied(self):
        """Test that section boosts are applied correctly"""
        base_scores = {'python': 0.5, 'leadership': 0.3}
        mock_resume_data = {
            'skills': ['Python programming', 'Team leadership']
        }
        
        enhanced_scores = apply_enhancements(base_scores, mock_resume_data)
        
        # Both keywords should receive section boost
        assert enhanced_scores['python'] > base_scores['python']
        assert enhanced_scores['leadership'] > base_scores['leadership']
        
    def test_compound_boost_applied(self):
        """Test that compound keyword boosts are applied"""
        base_scores = {'product management': 0.4, 'agile': 0.2}
        mock_resume_data = {
            'experiences': [
                {
                    'description': 'Product management using agile methodologies'
                }
            ]
        }
        
        enhanced_scores = apply_enhancements(base_scores, mock_resume_data)
        
        # Compound keywords should get boost
        assert enhanced_scores['product management'] > base_scores['product management']


class TestCompoundKeywordBoost:
    """Test compound keyword boost functionality"""
    
    def test_compound_keyword_detected(self):
        """Test detection of compound keywords"""
        resume_text = "Led product management initiatives using agile methodology"
        
        # Test compound keyword "product management"
        boost = compound_keyword_boost("product management", resume_text)
        assert boost > 0
        
        # Test single word that's part of compound
        boost = compound_keyword_boost("product", resume_text)
        assert boost == 0  # Single words don't get compound boost
        
    def test_compound_keyword_not_found(self):
        """Test compound keyword not in text"""
        resume_text = "Software engineering experience"
        
        boost = compound_keyword_boost("product management", resume_text)
        assert boost == 0
        
    def test_case_insensitive_matching(self):
        """Test compound keyword matching is case insensitive"""
        resume_text = "PRODUCT MANAGEMENT experience"
        
        boost = compound_keyword_boost("product management", resume_text)
        assert boost > 0