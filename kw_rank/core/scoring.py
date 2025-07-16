"""
Scoring module for keyword analysis.

Handles TF-IDF calculation, role-based scoring, section boosts, 
and compound keyword prioritization.
"""

import re
from sklearn.feature_extraction.text import TfidfVectorizer
from config.constants import get_config

config = get_config()


def calculate_tfidf_scores(keywords, job_text):
    """Calculate TF-IDF scores for keywords with fallback to frequency count."""
    keyword_texts = [kw['text'].lower() for kw in keywords]
    
    # Create TF-IDF vectorizer with fixed vocabulary
    vectorizer = TfidfVectorizer(
        vocabulary=keyword_texts,
        lowercase=True,
        ngram_range=(1, 3),
        stop_words='english'
    )
    
    # Fit and transform the job posting
    try:
        tfidf_matrix = vectorizer.fit_transform([job_text])
        feature_names = vectorizer.get_feature_names_out()
    except Exception as e:
        print(f"Error in TF-IDF calculation: {e}")
        # Fallback to simple frequency count
        tfidf_scores = {}
        for keyword_obj in keywords:
            count = job_text.lower().count(keyword_obj['text'].lower())
            tfidf_scores[keyword_obj['text']] = min(count / 10.0, 1.0)  # Normalize to 0-1
        return tfidf_scores
    
    # Get TF-IDF scores (map back to original keyword text)
    tfidf_scores = {}
    for keyword_obj in keywords:
        keyword_lower = keyword_obj['text'].lower()
        if keyword_lower in feature_names:
            feature_idx = list(feature_names).index(keyword_lower)
            tfidf_scores[keyword_obj['text']] = tfidf_matrix[0, feature_idx]
        else:
            tfidf_scores[keyword_obj['text']] = 0.0
    
    return tfidf_scores


def get_role_weight(role):
    """Get role weight from configuration."""
    if role == 'core':
        return config.roles.core
    elif role == 'important':
        return config.roles.important
    else:
        return config.roles.culture


def calculate_base_score(tfidf_score, section_score, role_score):
    """Calculate base keyword score using configured weights."""
    return (
        config.scoring.tfidf * tfidf_score +
        config.scoring.section * section_score +
        config.scoring.role * role_score
    )


def detect_section_type(line):
    """Detect what type of section a line represents."""
    line_lower = line.strip().lower()
    
    # Use patterns from configuration
    for section_type, pattern in config.sections.patterns.items():
        if re.search(pattern, line_lower):
            return section_type
    
    return None


def check_title_section(job_text, keyword):
    """Check if keyword appears in job title (first 150 words)."""
    first_150_words = ' '.join(job_text.split()[:150])
    if keyword.lower() in first_150_words.lower():
        return config.sections.boosts['title']
    return 0.0


def calculate_section_boost(job_text, keyword):
    """Calculate section boost score for a keyword based on where it appears."""
    boost_score = 0.0
    
    # Check title section first
    boost_score = max(boost_score, check_title_section(job_text, keyword))
    
    # Analyze each line for section context
    lines = job_text.split('\n')
    current_section = 'company'  # Default section
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
            
        # Check if this line is a section header
        detected_section = detect_section_type(line)
        if detected_section:
            current_section = detected_section
        
        # Check if keyword appears in this line
        if keyword.lower() in line.lower():
            section_boost = config.sections.boosts.get(current_section, 0.0)
            boost_score = max(boost_score, section_boost)
    
    # Additional boost for requirement keywords (containing 'years' or 'experience')
    if 'years' in keyword.lower() or 'experience' in keyword.lower():
        boost_score = max(boost_score, 0.9)
    
    return boost_score


def extract_job_title(job_text):
    """Extract job title from posting header."""
    lines = job_text.split('\n')[:10]  # Check first 10 lines
    
    title_patterns = [
        r'(director|vp|vice president|head of|lead|manager|senior|principal)\s+.*?(product|engineering|growth)',
        r'(product|engineering|growth)\s+.*?(director|vp|vice president|head of|lead|manager)'
    ]
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
            
        for pattern in title_patterns:
            if re.search(pattern, line, re.IGNORECASE):
                return line
    
    return lines[0] if lines else ""


def is_job_title_keyword(keyword_text, job_title):
    """Check if keyword relates to the job title."""
    if not job_title:
        return False
    
    keyword_lower = keyword_text.lower().strip()
    job_title_lower = job_title.lower().strip()
    
    return keyword_lower in job_title_lower or job_title_lower in keyword_lower


def is_buzzword(keyword_text):
    """Check if a keyword matches any buzzword (case-insensitive)."""
    keyword_lower = keyword_text.lower().strip()
    return keyword_lower in config.buzzwords.buzzwords


def calculate_compound_boost(keyword_text):
    """Boost compound keywords over solo terms."""
    words = keyword_text.split()
    word_count = len(words)
    
    # Check for specific compound multipliers first
    keyword_lower = keyword_text.lower()
    for compound, multiplier in config.output.compound_multipliers.items():
        if compound in keyword_lower:
            return multiplier
    
    # Base compound boost based on word count
    if word_count == 1:
        return 1.0  # No boost for solo terms
    elif word_count == 2:
        return 1.3  # "product strategy", "B2B SaaS"
    elif word_count >= 3:
        return 1.5  # "7+ years in product management"
    
    return 1.0


def is_executive_vocabulary(keyword_text):
    """Check if keyword represents authentic executive vocabulary."""
    keyword_lower = keyword_text.lower().strip()
    return keyword_lower in config.buzzwords.executive_vocabulary


def is_executive_buzzword(keyword_text):
    """Check if keyword is an overused executive buzzword."""
    keyword_lower = keyword_text.lower().strip()
    return keyword_lower in config.buzzwords.executive_buzzwords


def calculate_executive_adjustment(keyword_text):
    """Calculate executive vocabulary adjustment factor."""
    if is_executive_vocabulary(keyword_text):
        return config.buzzwords.executive_boost
    elif is_executive_buzzword(keyword_text):
        return config.buzzwords.executive_penalty
    return 1.0


def apply_enhancements(base_score, keyword_text, job_text):
    """Single enhancement point for all future improvements."""
    enhanced_score = base_score
    
    # MVP: Job title boost
    job_title = extract_job_title(job_text)
    if job_title and is_job_title_keyword(keyword_text, job_title):
        enhanced_score *= 1.2
    
    # Enhancement 1: Compound keyword prioritization
    compound_multiplier = calculate_compound_boost(keyword_text)
    enhanced_score *= compound_multiplier
    
    # Enhancement 2: Executive-aware buzzword filtering
    executive_adjustment = calculate_executive_adjustment(keyword_text)
    enhanced_score *= executive_adjustment
    
    return enhanced_score


def apply_buzzword_filtering(enhanced_score, keyword_text, drop_buzz):
    """Apply buzzword filtering logic."""
    is_buzz = is_buzzword(keyword_text)
    if is_buzz and drop_buzz:
        return None, is_buzz  # Skip buzzwords entirely
    elif is_buzz:
        enhanced_score *= config.buzzwords.penalty  # Apply penalty
    
    return enhanced_score, is_buzz


def create_keyword_result(keyword_text, tfidf_score, section_score, role_score, final_score, is_buzz, categorization):
    """Create a keyword result object."""
    return {
        'kw': keyword_text,
        'tfidf': round(float(tfidf_score), 3),
        'section': round(float(section_score), 3),
        'role': round(float(role_score), 3),
        'score': round(final_score, 3),
        'is_buzzword': is_buzz,
        'category': categorization['category'],
        'knockout_type': categorization.get('knockout_type'),
        'knockout_confidence': categorization.get('confidence', 0)
    }


def score_single_keyword(keyword, tfidf_scores, job_text, drop_buzz=False):
    """Calculate score for a single keyword with all enhancements."""
    kw_text = keyword['text']
    role = keyword['role']
    
    # Get component scores
    tfidf_score = tfidf_scores.get(kw_text, 0.0)
    section_score = calculate_section_boost(job_text, kw_text)
    role_score = get_role_weight(role)
    
    # Calculate base score
    base_score = calculate_base_score(tfidf_score, section_score, role_score)
    
    # Apply enhancements
    enhanced_score = apply_enhancements(base_score, kw_text, job_text)
    
    # Apply buzzword filtering
    final_score, is_buzz = apply_buzzword_filtering(enhanced_score, kw_text, drop_buzz)
    if final_score is None:
        return None  # Buzzword was dropped
    
    # Import categorization function (will be moved to categorization module)
    from ..core.categorization import categorize_keyword
    categorization = categorize_keyword(kw_text, final_score, tfidf_score, role_score)
    
    return create_keyword_result(kw_text, tfidf_score, section_score, role_score, final_score, is_buzz, categorization)


def rank_keywords(keywords, job_text, drop_buzz=False):
    """Rank keywords using TF-IDF, section boost, and role weights."""
    
    # Calculate TF-IDF scores for all keywords
    tfidf_scores = calculate_tfidf_scores(keywords, job_text)
    
    # Score each keyword
    results = []
    for keyword in keywords:
        scored_keyword = score_single_keyword(keyword, tfidf_scores, job_text, drop_buzz)
        if scored_keyword is not None:  # None means buzzword was dropped
            results.append(scored_keyword)
    
    # Sort by final score (descending)
    results.sort(key=lambda x: x['score'], reverse=True)
    
    return results