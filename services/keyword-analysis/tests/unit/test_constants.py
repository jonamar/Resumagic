"""
Unit tests for config.constants module
"""
import pytest
from dataclasses import FrozenInstanceError
from config.constants import (
    ScoringWeights, ClusteringConfig, KnockoutConfig, 
    InjectionConfig, OutputConfig, Config, DEFAULT_CONFIG
)


class TestScoringWeights:
    """Test ScoringWeights configuration"""
    
    def test_default_values(self):
        """Test default scoring weights are correct"""
        weights = ScoringWeights()
        assert weights.tfidf == 0.55
        assert weights.section == 0.25
        assert weights.role == 0.2
        
    def test_sum_equals_one(self):
        """Test scoring weights sum to 1.0"""
        weights = ScoringWeights()
        total = weights.tfidf + weights.section + weights.role
        assert abs(total - 1.0) < 1e-10
        
    def test_modifiable(self):
        """Test that scoring weights can be modified"""
        weights = ScoringWeights()
        weights.tfidf = 0.6
        assert weights.tfidf == 0.6


class TestClusteringConfig:
    """Test ClusteringConfig configuration"""
    
    def test_default_values(self):
        """Test default clustering config values"""
        config = ClusteringConfig()
        assert config.similarity_threshold == 0.5
        assert config.distance_threshold == 0.5
        assert config.median_multiplier == 1.2
        assert config.min_keywords == 10
        
    def test_modifiable(self):
        """Test that clustering config can be modified"""
        config = ClusteringConfig()
        config.similarity_threshold = 0.6
        assert config.similarity_threshold == 0.6


class TestKnockoutConfig:
    """Test KnockoutConfig configuration"""
    
    def test_years_patterns(self):
        """Test years-based knockout patterns"""
        config = KnockoutConfig()
        assert len(config.years_patterns) > 0
        assert r'\d+\+?\s*years?' in config.years_patterns
        
    def test_hard_patterns(self):
        """Test hard knockout patterns"""
        config = KnockoutConfig()
        assert len(config.hard_patterns) > 0
        # Check some key hard patterns
        hard_str = ' '.join(config.hard_patterns).lower()
        expected_patterns = ['bachelor', 'degree', 'mba', 'phd']
        for pattern in expected_patterns:
            assert pattern in hard_str
            
    def test_thresholds(self):
        """Test knockout thresholds are reasonable"""
        config = KnockoutConfig()
        assert 0 < config.confidence_threshold <= 1
        assert config.max_knockouts > 0


class TestInjectionConfig:
    """Test InjectionConfig configuration"""
    
    def test_default_values(self):
        """Test default injection config"""
        config = InjectionConfig()
        assert config.similarity_threshold == 0.7
        assert config.high_similarity_threshold == 0.8
        assert config.low_similarity_threshold == 0.5
        assert config.min_word_length == 3
        
    def test_thresholds_are_ordered(self):
        """Test that thresholds are in logical order"""
        config = InjectionConfig()
        assert config.low_similarity_threshold < config.similarity_threshold < config.high_similarity_threshold


class TestOutputConfig:
    """Test OutputConfig configuration"""
    
    def test_limits(self):
        """Test output limit configurations"""
        config = OutputConfig()
        assert config.max_top_keywords > 0
        assert config.max_knockouts > 0
        
    def test_compound_multipliers(self):
        """Test compound keyword multipliers"""
        config = OutputConfig()
        assert len(config.compound_multipliers) > 0
        assert 'product management' in config.compound_multipliers
        assert all(mult >= 1.0 for mult in config.compound_multipliers.values())


class TestConfig:
    """Test master Config class"""
    
    def test_default_config(self):
        """Test default configuration is valid"""
        config = Config()
        assert isinstance(config.scoring, ScoringWeights)
        assert isinstance(config.clustering, ClusteringConfig)
        assert isinstance(config.knockouts, KnockoutConfig)
        assert isinstance(config.injection, InjectionConfig)
        assert isinstance(config.output, OutputConfig)
        
    def test_default_config_instance(self):
        """Test DEFAULT_CONFIG is accessible"""
        assert DEFAULT_CONFIG is not None
        assert isinstance(DEFAULT_CONFIG, Config)