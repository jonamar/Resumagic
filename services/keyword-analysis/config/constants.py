"""
Configuration constants for the keyword analysis tool.
All magic numbers and patterns are centralized here for easy maintenance.
"""

from dataclasses import dataclass, field
from typing import Dict, Set, List
import re


@dataclass
class ScoringWeights:
    """Configuration for keyword scoring weights."""
    tfidf: float = 0.55  # Increased: prioritize keywords that actually appear in posting
    section: float = 0.25  # Unchanged: section placement still matters
    role: float = 0.2  # Decreased: prevent role weight from overriding TF-IDF


@dataclass
class RoleWeights:
    """Configuration for role-based keyword weights."""
    core: float = 1.2
    important: float = 0.6
    culture: float = 0.3


@dataclass
class BuzzwordConfig:
    """Configuration for buzzword detection and penalties."""
    penalty: float = 0.7
    executive_penalty: float = 0.8
    executive_boost: float = 1.15
    junk_penalty: float = 0.1  # Heavy penalty for meaningless fragments
    
    # 30-term generic PM buzzwords
    buzzwords: Set[str] = field(default_factory=lambda: {
        'vision', 'strategy', 'strategic', 'roadmap', 'delivery', 'execution', 
        'discovery', 'innovation', 'data-driven', 'metrics', 'kpis', 'scalable', 
        'alignment', 'ownership', 'stakeholders', 'go-to-market', 'collaboration', 
        'agile', 'sprint', 'backlog', 'prioritization', 'user-centric', 
        'customer-centric', 'outcomes', 'best practices', 'cross-functional', 
        'communication', 'leadership', 'fast-paced', 'results-oriented', 
        'growth hacking', 'roi', 'north star', 'market research', 'ecosystem'
    })
    
    # Overused executive buzzwords that should be penalized
    executive_buzzwords: Set[str] = field(default_factory=lambda: {
        'thought leadership', 'best-in-class', 'world-class', 'cutting-edge', 'bleeding-edge',
        'paradigm shift', 'game-changer', 'disruptive', 'revolutionary', 'transformational',
        'synergies', 'low-hanging fruit', 'move the needle', 'boil the ocean', 'circle back',
        'touch base', 'drill down', 'deep dive', 'take offline', 'leverage synergies',
        'actionable insights', 'holistic approach', 'end-to-end solution', 'turn-key',
        'enterprise-grade', 'mission-critical', 'scalable solution', 'robust framework',
        'seamless integration', 'optimize efficiency', 'maximize roi', 'drive value'
    })
    
    # Authentic executive terms
    executive_vocabulary: Set[str] = field(default_factory=lambda: {
        'p&l', 'p&l responsibility', 'revenue ownership', 'business outcomes', 
        'portfolio management', 'cross-functional leadership', 'organizational design',
        'board reporting', 'investor relations', 'market expansion', 'acquisition integration',
        'team scaling', 'hiring plans', 'culture building', 'succession planning',
        'executive presence', 'strategic partnerships', 'competitive positioning',
        'go-to-market execution', 'budget ownership', 'headcount planning',
        'performance management', 'talent development', 'executive coaching',
        'vp of product', 'director of product', 'head of product', 'chief product officer',
        'product portfolio', 'platform strategy', 'product vision', 'product leadership',
        'executive team', 'leadership team', 'senior leadership', 'c-suite'
    })
    
    # Minimum content quality requirements
    min_meaningful_words: int = 1  # Must have at least 1 meaningful word
    min_chars_per_word: int = 3    # Words must be at least 3 characters


@dataclass
class SectionConfig:
    """Configuration for section-based scoring."""
    patterns: Dict[str, str] = field(default_factory=lambda: {
        'title': r'^.*?(director|vp|vice president|head of|lead|manager).*$',
        'requirements': r'(what you.ll need|what we.re looking for|what you bring|requirements|qualifications|must have|experience|skills)',
        'responsibilities': r'(what you.ll do|what you.ll be doing|responsibilities|role|opportunity|day to day)',
        'company': r'(about|why join|benefits|culture|perks|our mission)'
    })
    
    boosts: Dict[str, float] = field(default_factory=lambda: {
        'title': 1.0,
        'requirements': 0.8,
        'responsibilities': 0.8,
        'company': 0.3
    })


@dataclass
class KnockoutConfig:
    """Configuration for knockout detection."""
    max_knockouts: int = 5
    confidence_threshold: float = 0.6
    hard_pattern_weight: float = 0.6
    medium_pattern_weight: float = 0.3
    years_high_role_weight: float = 0.4
    degree_high_role_weight: float = 0.4
    required_language_weight: float = 0.2
    
    # Hard knockout patterns (strong indicators)
    hard_patterns: List[str] = field(default_factory=lambda: [
        # Education degrees (actual degree requirements)
        r'bachelor\'?s?\s*degree',
        r'master\'?s?\s*degree',
        r'\bmba\b',
        r'\bphd\b',
        r'\b(bs|ms|ba|ma)\s+(degree|in)',
        r'degree\s+in\s+\w+',  # "degree in Business"
        # Handle slash notation and "in field" format
        r'bachelor\'?s?(?:[\s/]|in|degree)',  # "bachelors/masters" or "bachelors in"
        r'master\'?s?(?:[\s/]|in|degree)',    # "masters/bachelors" or "masters in"
        r'bachelor\'?s?/master\'?s?',          # "bachelors/masters" explicit
        r'(bachelor\'?s?|master\'?s?)\s+in\s+\w+',  # "bachelors in Computer Science"
        
        # Travel requirements
        r'(extensive|significant|frequent).*travel',
        r'travel.*required',
        r'willing to travel',
        r'travel.*\d+%',  # "travel 50%"
        r'up to \d+%.*travel',  # "up to 50% travel"
        
        # Specific job title requirements when mentioned as requirements
        r'(director|vp|vice\s+president|chief|head)\s+(of\s+)?(product|marketing)',
    ])
    
    # Medium knockout patterns (moderate indicators)
    medium_patterns: List[str] = field(default_factory=lambda: [
        # Required/preferred language with education
        r'(required|preferred|must\s+have).*\b(degree|education|bachelor|master|mba)',
        r'\b(degree|bachelor|master|mba).*(required|preferred)',
    ])
    
    # Soft skill exclusions (should not be knockouts)
    soft_skill_exclusions: List[str] = field(default_factory=lambda: [
        r'leadership\s+style',
        r'communication\s+skills',
        r'strategic\s+thinking',
        r'problem\s+solving',
        r'team\s+player',
        r'passion',
        r'enthusiasm',
        r'mindset',
        r'empathy',
        r'collaborative',
        r'innovative',
        r'customer-obsessed',
        r'results-oriented',
        r'data-driven',
        r'fast-paced'
    ])
    
    # Years-based knockout patterns
    years_patterns: List[str] = field(default_factory=lambda: [
        r'\d+\+?\s*years?',           # "5+ years", "8 years"
        r'\d+\s*[-–]\s*\d+\s*years?', # "5-7 years", "3–5 years"
        r'minimum\s+\d+\s*years?',    # "minimum 3 years"
        r'\d+\s*years?\s*minimum',    # "3 years minimum"
        # Spelled-out numbers (1-20 years)
        r'(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty)\+?\s*years?',
        r'(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty)\s*[-–]\s*(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty)\s*years?',
        r'minimum\s+(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty)\s*years?',
        r'(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty)\s*years?\s*minimum',
    ])
    
    # Preferred requirement indicators
    preferred_indicators: List[str] = field(default_factory=lambda: [
        'preferred', 'plus', 'bonus', 'nice to have', 'advantage', 
        'desirable', 'beneficial', 'would be great', 'a plus but not required'
    ])


@dataclass
class ClusteringConfig:
    """Configuration for keyword clustering."""
    similarity_threshold: float = 0.5
    median_multiplier: float = 1.2
    min_keywords: int = 10
    distance_threshold: float = 0.5  # AgglomerativeClustering distance threshold


@dataclass
class InjectionConfig:
    """Configuration for resume injection analysis."""
    similarity_threshold: float = 0.7
    high_similarity_threshold: float = 0.8
    low_similarity_threshold: float = 0.5
    min_word_length: int = 3


@dataclass
class OutputConfig:
    """Configuration for output formatting."""
    max_top_keywords: int = 5
    max_knockouts: int = 5
    
    # Compound boosting multipliers
    compound_multipliers: Dict[str, float] = field(default_factory=lambda: {
        'saas': 1.5,
        'product management': 1.3,
        'b2b': 1.2,
        'api': 1.2,
        'platform': 1.2,
        'growth': 1.1,
        'leadership': 1.1,
        'strategy': 1.1,
        'data': 1.1,
        'analytics': 1.1
    })


# Global configuration instance
@dataclass
class Config:
    """Master configuration class."""
    scoring: ScoringWeights = field(default_factory=ScoringWeights)
    roles: RoleWeights = field(default_factory=RoleWeights)
    buzzwords: BuzzwordConfig = field(default_factory=BuzzwordConfig)
    sections: SectionConfig = field(default_factory=SectionConfig)
    knockouts: KnockoutConfig = field(default_factory=KnockoutConfig)
    clustering: ClusteringConfig = field(default_factory=ClusteringConfig)
    injection: InjectionConfig = field(default_factory=InjectionConfig)
    output: OutputConfig = field(default_factory=OutputConfig)


# Default configuration instance
DEFAULT_CONFIG = Config()


def get_config() -> Config:
    """Get the default configuration instance."""
    return DEFAULT_CONFIG


def validate_config(config: Config) -> None:
    """Validate configuration parameters."""
    assert 0 < config.scoring.tfidf <= 1, "TF-IDF weight must be between 0 and 1"
    assert 0 < config.scoring.section <= 1, "Section weight must be between 0 and 1"
    assert 0 < config.scoring.role <= 1, "Role weight must be between 0 and 1"
    assert config.scoring.tfidf + config.scoring.section + config.scoring.role <= 1, "Total weights must not exceed 1"
    
    assert 0 < config.clustering.similarity_threshold <= 1, "Clustering threshold must be between 0 and 1"
    assert 0 < config.knockouts.confidence_threshold <= 1, "Knockout confidence threshold must be between 0 and 1"
    
    # Validate patterns compile correctly
    for pattern in config.knockouts.hard_patterns:
        re.compile(pattern)
    for pattern in config.knockouts.medium_patterns:
        re.compile(pattern)
    for pattern in config.knockouts.soft_skill_exclusions:
        re.compile(pattern)
    for pattern in config.knockouts.years_patterns:
        re.compile(pattern)
    
    for pattern in config.sections.patterns.values():
        re.compile(pattern)