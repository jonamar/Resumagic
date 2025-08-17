"""
Categorization module for keyword analysis.

Handles knockout detection, keyword classification, and 
intelligent categorization of keywords into knockouts vs skills.
"""

import re
from config.constants import get_config

config = get_config()


def is_soft_skill(keyword_lower):
    """Check if keyword is a soft skill that should not be a knockout."""
    return any(re.search(pattern, keyword_lower) for pattern in config.knockouts.soft_skill_exclusions)


def count_pattern_matches(keyword_lower, patterns):
    """Count how many patterns match the keyword."""
    return sum(1 for pattern in patterns if re.search(pattern, keyword_lower))


def calculate_knockout_confidence(keyword_lower, role_weight):
    """Calculate confidence score for knockout classification."""
    knockout_confidence = 0
    
    # Check pattern matches
    hard_matches = count_pattern_matches(keyword_lower, config.knockouts.hard_patterns)
    medium_matches = count_pattern_matches(keyword_lower, config.knockouts.medium_patterns)
    
    # Strong signals for knockout
    has_years_and_high_role = bool(re.search(r'\d+\+?\s*years?', keyword_lower)) and role_weight >= 1.0
    has_degree_mention = bool(re.search(r'\b(degree|bachelor|master|mba|phd)\b', keyword_lower))
    has_required_language = any(req_word in keyword_lower for req_word in ['required', 'must have', 'minimum'])
    
    # Hard patterns are strong indicators
    if hard_matches >= 1:
        knockout_confidence += config.knockouts.hard_pattern_weight
    
    # Medium patterns with supporting evidence
    if medium_matches >= 1:
        knockout_confidence += config.knockouts.medium_pattern_weight
        
    # Years + high role weight is a good signal
    if has_years_and_high_role:
        knockout_confidence += config.knockouts.years_high_role_weight
        
    # Education requirements are typically knockouts
    if has_degree_mention and role_weight >= 1.0:
        knockout_confidence += config.knockouts.degree_high_role_weight
        
    # Required language strengthens the case
    if has_required_language:
        knockout_confidence += config.knockouts.required_language_weight
    
    return knockout_confidence


def is_preferred_requirement(keyword_lower):
    """Check if a keyword indicates a preferred (not required) requirement."""
    return any(indicator in keyword_lower for indicator in config.knockouts.preferred_indicators)


def extract_years_context(keyword, years_match):
    """
    Extract meaningful context around years mention.
    
    Args:
        keyword (str): The full keyword text
        years_match: The regex match object for years
        
    Returns:
        str: Extracted context around the years mention
    """
    start = max(0, years_match.start() - 30)
    end = min(len(keyword), years_match.end() + 30)
    context = keyword[start:end].strip()
    
    # Clean up context boundaries
    if start > 0 and not context.startswith(' '):
        # Find the start of the word
        words = context.split()
        if len(words) > 1:
            context = ' '.join(words[1:])
    
    if end < len(keyword) and not context.endswith(' '):
        # Find the end of the word
        words = context.split()
        if len(words) > 1:
            context = ' '.join(words[:-1])
    
    return context


def detect_years_knockout(keyword):
    """
    Enhanced years-based knockout detection with context extraction.
    
    Args:
        keyword (str): The keyword text to analyze
        
    Returns:
        dict: {'is_knockout': bool, 'knockout_type': str, 'context': str}
    """
    # Look for years patterns
    years_patterns = config.knockouts.years_patterns
    
    kw_lower = keyword.lower()
    years_match = None
    
    for pattern in years_patterns:
        match = re.search(pattern, kw_lower)
        if match:
            years_match = match
            break
    
    if not years_match:
        return {'is_knockout': False}
    
    # Extract context around the years mention
    context = extract_years_context(keyword, years_match)
    
    # Determine if preferred or required
    knockout_type = 'preferred' if any(word in kw_lower for word in ['preferred', 'nice to have', 'plus']) else 'required'
    
    return {
        'is_knockout': True,
        'knockout_type': knockout_type,
        'context': context,
        'years_match': years_match.group()
    }


def categorize_keyword(keyword, score, tfidf_score, role_weight):
    """
    Intelligently categorize keyword as knockout requirement or skill.
    
    Combines years-based detection with traditional knockout patterns for 
    comprehensive classification.
    
    Args:
        keyword (str): The keyword text
        score (float): The keyword's calculated score
        tfidf_score (float): TF-IDF score from job posting
        role_weight (float): Role importance weight
        
    Returns:
        dict: Category information with confidence scores
    """
    kw_lower = keyword.lower()
    
    # Skip soft skills from being considered knockouts
    if is_soft_skill(kw_lower):
        return {'category': 'skill'}
    
    # ENHANCED: Years-based knockout detection
    years_result = detect_years_knockout(keyword)
    if years_result['is_knockout']:
        return {
            'category': 'knockout',
            'knockout_type': years_result['knockout_type'],
            'confidence': 0.8,  # High confidence for years-based detection
            'detection_method': 'years_based',
            'context': years_result.get('context', ''),
            'years_match': years_result.get('years_match', '')
        }
    
    # EXISTING: Traditional knockout detection for non-years patterns
    knockout_confidence = calculate_knockout_confidence(kw_lower, role_weight)
    
    # Lower threshold to catch more legitimate knockouts
    if knockout_confidence >= config.knockouts.confidence_threshold:
        # Determine if it's preferred or required
        knockout_type = 'preferred' if is_preferred_requirement(kw_lower) else 'required'
        return {
            'category': 'knockout', 
            'knockout_type': knockout_type,
            'confidence': knockout_confidence,
            'detection_method': 'pattern_based'
        }
    
    # Default to skill if not identified as knockout
    return {'category': 'skill'}


def enforce_knockout_maximum(results, max_knockouts=None):
    """
    Enforce maximum number of knockout requirements by reclassifying 
    lower-scoring knockouts as skills.
    
    Args:
        results (list): List of keyword results
        max_knockouts (int): Maximum knockouts allowed (from config if None)
        
    Returns:
        list: Updated results with knockout limit enforced
    """
    if max_knockouts is None:
        max_knockouts = config.knockouts.max_knockouts
    
    # Separate knockouts and skills
    knockouts = [r for r in results if r['category'] == 'knockout']
    skills = [r for r in results if r['category'] == 'skill']
    
    # If we're within the limit, return as-is
    if len(knockouts) <= max_knockouts:
        return results
    
    # Sort knockouts by score (descending) to keep the highest-scoring ones
    knockouts.sort(key=lambda x: x['score'], reverse=True)
    
    # Keep top N knockouts, reclassify the rest as skills
    kept_knockouts = knockouts[:max_knockouts]
    overflow_knockouts = knockouts[max_knockouts:]
    
    # Reclassify overflow knockouts as skills
    for knockout in overflow_knockouts:
        knockout['category'] = 'skill'
        knockout['knockout_type'] = None
        knockout['knockout_confidence'] = 0
    
    # Combine and return
    updated_results = kept_knockouts + skills + overflow_knockouts
    
    print(f"🎯 Knockout limit enforced: {len(kept_knockouts)} knockouts kept, {len(overflow_knockouts)} reclassified as skills")
    
    return updated_results