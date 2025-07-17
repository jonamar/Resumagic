"""
Unit tests for kw_rank.core.categorization module
"""
import pytest
from unittest.mock import patch, MagicMock
from kw_rank.core.categorization import (
    detect_knockout_keywords, is_traditional_knockout,
    is_years_knockout, categorize_keywords, extract_years_requirement
)


class TestExtractYearsRequirement:
    """Test years requirement extraction"""
    
    def test_extract_simple_years(self):
        """Test extraction of simple years requirements"""
        assert extract_years_requirement("5+ years of experience") == 5
        assert extract_years_requirement("3 years experience") == 3
        assert extract_years_requirement("10+ years in product") == 10
        
    def test_extract_range_years(self):
        """Test extraction from year ranges (should take minimum)"""
        assert extract_years_requirement("3-5 years experience") == 3
        assert extract_years_requirement("5-7 years of product management") == 5
        
    def test_no_years_found(self):
        """Test when no years are found"""
        assert extract_years_requirement("product management experience") is None
        assert extract_years_requirement("senior role") is None
        
    def test_edge_cases(self):
        """Test edge cases in years extraction"""
        assert extract_years_requirement("1 year experience") == 1
        assert extract_years_requirement("15+ years leadership") == 15


class TestIsTraditionalKnockout:
    """Test traditional knockout detection"""
    
    def test_education_keywords(self):
        """Test education-based knockouts"""
        assert is_traditional_knockout("Bachelor's degree")
        assert is_traditional_knockout("MBA required")
        assert is_traditional_knockout("PhD in Computer Science")
        assert is_traditional_knockout("Master's degree")
        
    def test_certification_keywords(self):
        """Test certification-based knockouts"""
        assert is_traditional_knockout("PMP certification")
        assert is_traditional_knockout("AWS certified")
        assert is_traditional_knockout("Scrum Master certification")
        
    def test_non_knockout_keywords(self):
        """Test keywords that are not traditional knockouts"""
        assert not is_traditional_knockout("product management")
        assert not is_traditional_knockout("leadership skills")
        assert not is_traditional_knockout("team collaboration")
        
    def test_case_insensitive(self):
        """Test case insensitive matching"""
        assert is_traditional_knockout("bachelor's DEGREE")
        assert is_traditional_knockout("mba REQUIRED")


class TestIsYearsKnockout:
    """Test years-based knockout detection"""
    
    def test_years_patterns(self):
        """Test various years-based knockout patterns"""
        assert is_years_knockout("5+ years of experience")
        assert is_years_knockout("3 years experience in product")
        assert is_years_knockout("7+ years of product management")
        assert is_years_knockout("10 years in leadership role")
        
    def test_senior_role_patterns(self):
        """Test senior role knockout patterns"""
        assert is_years_knockout("3+ years in a senior role")
        assert is_years_knockout("5+ years in leadership position")
        assert is_years_knockout("2+ years as a manager")
        
    def test_non_years_keywords(self):
        """Test keywords without years requirements"""
        assert not is_years_knockout("product management")
        assert not is_years_knockout("agile methodology")
        assert not is_years_knockout("team leadership")
        
    def test_edge_cases(self):
        """Test edge cases in years detection"""
        assert is_years_knockout("1+ year of experience")  # Singular year
        assert is_years_knockout("15+ years experience")  # High numbers


class TestDetectKnockoutKeywords:
    """Test knockout keyword detection"""
    
    def test_mixed_keywords(self):
        """Test detection with mix of knockout and non-knockout keywords"""
        keywords = [
            "5+ years of experience",
            "product management",
            "MBA required", 
            "team leadership",
            "Bachelor's degree",
            "agile methodology"
        ]
        
        knockouts, skills = detect_knockout_keywords(keywords)
        
        assert "5+ years of experience" in knockouts
        assert "MBA required" in knockouts
        assert "Bachelor's degree" in knockouts
        
        assert "product management" in skills
        assert "team leadership" in skills
        assert "agile methodology" in skills
        
    def test_all_knockouts(self):
        """Test when all keywords are knockouts"""
        keywords = [
            "MBA required",
            "5+ years experience",
            "PMP certification"
        ]
        
        knockouts, skills = detect_knockout_keywords(keywords)
        
        assert len(knockouts) == 3
        assert len(skills) == 0
        
    def test_all_skills(self):
        """Test when all keywords are skills"""
        keywords = [
            "product management",
            "team leadership",
            "agile methodology"
        ]
        
        knockouts, skills = detect_knockout_keywords(keywords)
        
        assert len(knockouts) == 0
        assert len(skills) == 3
        
    def test_empty_list(self):
        """Test with empty keyword list"""
        knockouts, skills = detect_knockout_keywords([])
        
        assert len(knockouts) == 0
        assert len(skills) == 0


class TestCategorizeKeywords:
    """Test keyword categorization with scoring"""
    
    def test_categorization_with_scores(self):
        """Test categorization includes scoring information"""
        keywords = ["product management", "5+ years experience", "MBA"]
        mock_scores = {
            "product management": 0.85,
            "5+ years experience": 0.72,
            "MBA": 0.64
        }
        
        result = categorize_keywords(keywords, mock_scores)
        
        assert "knockouts" in result
        assert "skills" in result
        
        # Check knockout categorization
        knockout_kws = [item["keyword"] for item in result["knockouts"]]
        assert "5+ years experience" in knockout_kws
        assert "MBA" in knockout_kws
        
        # Check skills categorization  
        skill_kws = [item["keyword"] for item in result["skills"]]
        assert "product management" in skill_kws
        
        # Check scores are included
        for item in result["knockouts"] + result["skills"]:
            assert "score" in item
            assert item["score"] in mock_scores.values()
            
    def test_categorization_without_scores(self):
        """Test categorization when no scores provided"""
        keywords = ["product management", "MBA required"]
        
        result = categorize_keywords(keywords, {})
        
        # Should still categorize correctly
        assert len(result["knockouts"]) == 1
        assert len(result["skills"]) == 1
        
        # Scores should be 0.0 when not provided
        for item in result["knockouts"] + result["skills"]:
            assert item["score"] == 0.0