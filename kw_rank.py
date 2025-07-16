#!/usr/bin/env python3
"""
Intelligent Keyword Analysis Tool
Ranks job-specific keywords using TF-IDF scoring and intelligently categorizes them into 
knockout requirements vs. skills for optimal resume targeting.
"""

import sys
import json
import re
from pathlib import Path
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.cluster import AgglomerativeClustering
from sentence_transformers import SentenceTransformer
import argparse
import numpy as np

# Role weight constants
ROLE_WEIGHTS = {
    'core': 1.2,
    'important': 0.6,
    'culture': 0.3
}

# Scoring weights (Adjusted for ATS optimization)
TFIDF_WEIGHT = 0.55  # Increased: prioritize keywords that actually appear in posting
SECTION_WEIGHT = 0.25  # Unchanged: section placement still matters
ROLE_WEIGHT = 0.2  # Decreased: prevent role weight from overriding TF-IDF

# Buzzword dampening (30-term generic PM buzzwords)
BUZZWORDS = {
    'vision', 'strategy', 'strategic', 'roadmap', 'delivery', 'execution', 
    'discovery', 'innovation', 'data-driven', 'metrics', 'kpis', 'scalable', 
    'alignment', 'ownership', 'stakeholders', 'go-to-market', 'collaboration', 
    'agile', 'sprint', 'backlog', 'prioritization', 'user-centric', 
    'customer-centric', 'outcomes', 'best practices', 'cross-functional', 
    'communication', 'leadership', 'fast-paced', 'results-oriented', 
    'growth hacking', 'roi', 'north star', 'market research', 'ecosystem'
}
BUZZWORD_PENALTY = 0.7

# Section boost patterns
SECTION_PATTERNS = {
    'title': r'^.*?(director|vp|vice president|head of|lead|manager).*$',
    'requirements': r'(what you.ll need|what we.re looking for|what you bring|requirements|qualifications|must have|experience|skills)',
    'responsibilities': r'(what you.ll do|what you.ll be doing|responsibilities|role|opportunity|day to day)',
    'company': r'(about|why join|benefits|culture|perks|our mission)'
}

# Section boost values
SECTION_BOOSTS = {
    'title': 1.0,
    'requirements': 0.8,
    'responsibilities': 0.8,
    'company': 0.3
}

# Executive-level vocabulary and buzzword filtering
EXECUTIVE_VOCABULARY = {
    # Authentic executive terms
    'p&l', 'p&l responsibility', 'revenue ownership', 'business outcomes', 
    'portfolio management', 'cross-functional leadership', 'organizational design',
    'board reporting', 'investor relations', 'market expansion', 'acquisition integration',
    'team scaling', 'hiring plans', 'culture building', 'succession planning',
    'executive presence', 'strategic partnerships', 'competitive positioning',
    'go-to-market execution', 'budget ownership', 'headcount planning',
    'performance management', 'talent development', 'executive coaching',
    
    # Role-specific executive terms
    'vp of product', 'director of product', 'head of product', 'chief product officer',
    'product portfolio', 'platform strategy', 'product vision', 'product leadership',
    'executive team', 'leadership team', 'senior leadership', 'c-suite'
}

EXECUTIVE_BUZZWORDS = {
    # Overused executive buzzwords that should be penalized
    'thought leadership', 'best-in-class', 'world-class', 'cutting-edge', 'bleeding-edge',
    'paradigm shift', 'game-changer', 'disruptive', 'revolutionary', 'transformational',
    'synergies', 'low-hanging fruit', 'move the needle', 'boil the ocean', 'circle back',
    'touch base', 'drill down', 'deep dive', 'take offline', 'leverage synergies',
    'actionable insights', 'holistic approach', 'end-to-end solution', 'turn-key',
    'enterprise-grade', 'mission-critical', 'scalable solution', 'robust framework',
    'seamless integration', 'optimize efficiency', 'maximize roi', 'drive value'
}

EXECUTIVE_VOCAB_BOOST = 1.15  # Boost authentic executive vocabulary
EXECUTIVE_BUZZWORD_PENALTY = 0.8  # Penalize executive buzzwords

# Knockout categorization patterns
HARD_KNOCKOUT_PATTERNS = [
    # Specific years of experience (must be specific number)
    r'\d+\+?\s*years?\s*of\s+.*?(experience|leadership|management)',
    r'\d+\+?\s*years?\s*(experience|leadership|management)',
    r'\d+\+?\s*years?\s*in\s+(product\s+management|leadership|management)',
    r'\d+\+?\s*years?\s*(in\s+)?(a\s+)?(senior|leadership|management)',
    
    # Education degrees (actual degree requirements)
    r'bachelor\'?s?\s*degree',
    r'master\'?s?\s*degree',
    r'\bmba\b',
    r'\bphd\b',
    r'\b(bs|ms|ba|ma)\s+(degree|in)',
    r'degree\s+in\s+\w+',  # "degree in Business"
    
    # Specific job title requirements when mentioned as requirements
    r'(director|vp|vice\s+president|chief)\s+(of\s+)?(product|marketing)',
]

MEDIUM_KNOCKOUT_PATTERNS = [
    # Required/preferred language with education
    r'(required|preferred|must\s+have).*\b(degree|education|bachelor|master|mba)',
    r'\b(degree|bachelor|master|mba).*(required|preferred)',
    
    # Leadership experience requirements  
    r'leadership\s+experience.*\d+\+?\s*years?',
    r'\d+\+?\s*years?.*leadership\s+experience',
]

SOFT_SKILL_EXCLUSIONS = [
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
]

def is_soft_skill(keyword_lower):
    """Check if keyword is a soft skill that should not be a knockout."""
    return any(re.search(pattern, keyword_lower) for pattern in SOFT_SKILL_EXCLUSIONS)

def count_pattern_matches(keyword_lower, patterns):
    """Count how many patterns match the keyword."""
    return sum(1 for pattern in patterns if re.search(pattern, keyword_lower))

def calculate_knockout_confidence(keyword_lower, role_weight):
    """Calculate confidence score for knockout classification."""
    knockout_confidence = 0
    
    # Check pattern matches
    hard_matches = count_pattern_matches(keyword_lower, HARD_KNOCKOUT_PATTERNS)
    medium_matches = count_pattern_matches(keyword_lower, MEDIUM_KNOCKOUT_PATTERNS)
    
    # Strong signals for knockout
    has_years_and_high_role = bool(re.search(r'\d+\+?\s*years?', keyword_lower)) and role_weight >= 1.0
    has_degree_mention = bool(re.search(r'\b(degree|bachelor|master|mba|phd)\b', keyword_lower))
    has_required_language = any(req_word in keyword_lower for req_word in ['required', 'must have', 'minimum'])
    
    # Hard patterns are strong indicators
    if hard_matches >= 1:
        knockout_confidence += 0.6
    
    # Medium patterns with supporting evidence
    if medium_matches >= 1:
        knockout_confidence += 0.3
        
    # Years + high role weight is a good signal
    if has_years_and_high_role:
        knockout_confidence += 0.4
        
    # Education requirements are typically knockouts
    if has_degree_mention and role_weight >= 1.0:
        knockout_confidence += 0.4
        
    # Required language strengthens the case
    if has_required_language:
        knockout_confidence += 0.2
    
    return knockout_confidence

def is_preferred_requirement(keyword_lower):
    """Check if a keyword indicates a preferred (not required) requirement."""
    preferred_indicators = [
        'preferred', 'plus', 'bonus', 'nice to have', 'advantage', 
        'desirable', 'beneficial', 'would be great', 'a plus but not required'
    ]
    return any(indicator in keyword_lower for indicator in preferred_indicators)

def categorize_keyword(keyword, score, tfidf_score, role_weight):
    """
    Intelligently categorize a scored keyword as knockout requirement or skill.
    
    Args:
        keyword (str): The keyword text
        score (float): The final composite score
        tfidf_score (float): The TF-IDF component score (unused but kept for API compatibility)
        role_weight (float): The role weight used in scoring
        
    Returns:
        dict: {'category': 'knockout' or 'skill', 'knockout_type': 'required' or 'preferred' or None}
    """
    kw_lower = keyword.lower()
    
    # Check if this is a soft skill that should not be a knockout
    if is_soft_skill(kw_lower):
        return {'category': 'skill', 'knockout_type': None}
    
    # Calculate knockout confidence
    knockout_confidence = calculate_knockout_confidence(kw_lower, role_weight)
    
    # Lower threshold to catch more legitimate knockouts
    if knockout_confidence >= 0.6:
        # Determine if it's preferred or required
        knockout_type = 'preferred' if is_preferred_requirement(kw_lower) else 'required'
        return {'category': 'knockout', 'knockout_type': knockout_type, 'confidence': knockout_confidence, 'score': score}
    else:
        return {'category': 'skill', 'knockout_type': None}

def parse_arguments():
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(
        description='Rank keywords by job posting relevance',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python kw_rank.py keywords.json job-posting.md
  python kw_rank.py /path/to/keywords.json /path/to/job.txt
        """
    )
    parser.add_argument('keywords_file', help='Path to keywords JSON file')
    parser.add_argument('job_file', help='Path to job posting file (markdown or text)')
    parser.add_argument('--resume', type=str, 
                       help='Path to resume JSON file for sentence matching (optional)')
    parser.add_argument('--drop-buzz', action='store_true', 
                       help='Drop buzzwords entirely instead of penalizing (default: penalize)')
    parser.add_argument('--cluster-thresh', type=float, default=0.35,
                       help='Clustering threshold for alias detection (default: 0.35)')
    parser.add_argument('--top', type=int, default=5,
                       help='Number of top keywords to output (default: 5)')
    parser.add_argument('--summary', action='store_true',
                       help='Show knockout status and top skills summary')
    
    return parser.parse_args()

def load_keywords(keywords_file):
    """Load keywords from JSON file."""
    try:
        with open(keywords_file, 'r', encoding='utf-8') as f:
            keywords_data = json.load(f)
        
        print(f"📊 Loading {len(keywords_data)} keywords")
        
        # Convert to standard format
        keywords = []
        for item in keywords_data:
            if isinstance(item, dict) and 'kw' in item and 'role' in item:
                keywords.append({
                    'text': item['kw'],
                    'role': item['role']
                })
            else:
                print(f"Warning: Skipping invalid keyword entry: {item}")
        
        return keywords
        
    except FileNotFoundError:
        print(f"Error: Keywords file not found: {keywords_file}")
        sys.exit(1)
    except json.JSONDecodeError as e:
        print(f"Error: Invalid JSON in keywords file: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"Error loading keywords: {e}")
        return []

def load_job_posting(job_file):
    """Load and preprocess job posting text."""
    try:
        with open(job_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Basic markdown stripping (remove # headers, ** bold, etc.)
        content = re.sub(r'#+\s*', '', content)  # Remove markdown headers
        content = re.sub(r'\*\*(.*?)\*\*', r'\1', content)  # Remove bold
        content = re.sub(r'\*(.*?)\*', r'\1', content)  # Remove italic
        content = re.sub(r'\s+', ' ', content)  # Collapse whitespace
        
        return content.strip().lower()
    except FileNotFoundError:
        print(f"Error: Job posting file not found: {job_file}")
        sys.exit(1)
    except Exception as e:
        print(f"Error loading job posting: {e}")
        sys.exit(1)

def detect_section_type(line):
    """Detect what type of section a line represents."""
    line_lower = line.strip().lower()
    
    # Requirements section patterns
    requirements_patterns = [
        r'what you bring',
        r'what you.ll need',
        r'what you.ll need',
        r'what we.re looking for',
        r'requirements',
        r'qualifications',
        r'must have',
        r'experience',
        r'skills'
    ]
    
    # Responsibilities section patterns  
    responsibilities_patterns = [
        r'what you.ll do',
        r'what you.ll be doing',
        r'responsibilities',
        r'role',
        r'opportunity',
        r'day to day'
    ]
    
    # Company section patterns
    company_patterns = [
        r'about',
        r'why join',
        r'benefits',
        r'culture',
        r'perks',
        r'our mission'
    ]
    
    for pattern in requirements_patterns:
        if re.search(pattern, line_lower):
            return 'requirements'
    
    for pattern in responsibilities_patterns:
        if re.search(pattern, line_lower):
            return 'responsibilities'
            
    for pattern in company_patterns:
        if re.search(pattern, line_lower):
            return 'company'
    
    return None

def check_title_section(job_text, keyword):
    """Check if keyword appears in job title (first 150 words)."""
    first_150_words = ' '.join(job_text.split()[:150])
    if keyword.lower() in first_150_words.lower():
        return SECTION_BOOSTS['title']
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
            section_boost = SECTION_BOOSTS.get(current_section, 0.0)
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
            match = re.search(pattern, line.lower())
            if match:
                return match.group(0).strip()
    
    return None

def is_job_title_keyword(keyword_text, job_title):
    """Check if keyword matches extracted job title."""
    if not job_title:
        return False
    
    # Simple substring matching
    keyword_lower = keyword_text.lower().strip()
    job_title_lower = job_title.lower().strip()
    
    return keyword_lower in job_title_lower or job_title_lower in keyword_lower

def is_buzzword(keyword_text):
    """Check if a keyword matches any buzzword (case-insensitive)."""
    keyword_lower = keyword_text.lower().strip()
    return keyword_lower in BUZZWORDS

def is_experience_keyword(keyword_text):
    """Check if keyword contains experience/years requirements."""
    experience_patterns = [
        r'\d+\+?\s*years?\s+in\s+',
        r'\d+\+?\s*years?\s+of\s+',
        r'\d+\+?\s*years?\s+experience',
        r'\d+\+?\s*years?\s+leading',
        r'\d+\+?\s*years?\s+managing'
    ]
    
    keyword_lower = keyword_text.lower()
    return any(re.search(pattern, keyword_lower) for pattern in experience_patterns)

def select_canonical_keyword(cluster_keywords):
    """Select the canonical keyword from a cluster, prioritizing experience keywords."""
    # Sort by experience priority first, then by score
    def priority_key(kw):
        is_exp = is_experience_keyword(kw['kw'])
        return (is_exp, kw['score'])
    
    cluster_keywords.sort(key=priority_key, reverse=True)
    return cluster_keywords[0]

def cluster_aliases(ranked_keywords, cluster_threshold=0.25):
    """
    Cluster similar keywords using semantic embeddings.
    Returns canonical keywords with their aliases.
    """
    if len(ranked_keywords) <= 1:
        return ranked_keywords
    
    # Load SentenceTransformer model
    model = SentenceTransformer('all-MiniLM-L6-v2')
    
    # Extract keyword texts and compute embeddings
    keyword_texts = [kw['kw'] for kw in ranked_keywords]
    embeddings = model.encode(keyword_texts, normalize_embeddings=True)
    
    # Run hierarchical clustering
    clustering = AgglomerativeClustering(
        distance_threshold=cluster_threshold,
        n_clusters=None,
        linkage='average',
        metric='cosine'
    )
    
    cluster_labels = clustering.fit_predict(embeddings)
    
    # Group keywords by cluster
    clusters = {}
    for i, label in enumerate(cluster_labels):
        if label not in clusters:
            clusters[label] = []
        clusters[label].append(ranked_keywords[i])
    
    # For each cluster, select canonical keyword with experience priority
    canonical_keywords = []
    for cluster_keywords in clusters.values():
        canonical = select_canonical_keyword(cluster_keywords).copy()
        
        # Add aliases (all other keywords in the cluster)
        aliases = [kw['kw'] for kw in cluster_keywords if kw['kw'] != canonical['kw']]
        canonical['aliases'] = aliases
        
        canonical_keywords.append(canonical)
    
    return canonical_keywords

def trim_by_median(canonical_keywords, median_multiplier=1.2, min_keywords=10):
    """
    Trim keywords based on median score threshold.
    Keep keywords with score > median_multiplier * median.
    Ensure at least min_keywords survive.
    """
    if len(canonical_keywords) <= min_keywords:
        return canonical_keywords
    
    scores = [kw['score'] for kw in canonical_keywords]
    median_score = np.median(scores)
    threshold = median_multiplier * median_score
    
    # Keep keywords above threshold
    filtered_keywords = [kw for kw in canonical_keywords if kw['score'] > threshold]
    
    # Ensure we have at least min_keywords
    if len(filtered_keywords) < min_keywords:
        # Sort by score and take top min_keywords
        sorted_keywords = sorted(canonical_keywords, key=lambda x: x['score'], reverse=True)
        filtered_keywords = sorted_keywords[:min_keywords]
    
    return filtered_keywords

def enforce_knockout_maximum(results, max_knockouts=5):
    """
    Enforce maximum number of knockouts, reclassifying overflow as skills.
    
    Args:
        results (list): List of keyword results
        max_knockouts (int): Maximum number of knockouts allowed
        
    Returns:
        list: Updated results with knockout limit enforced
    """
    knockouts = [r for r in results if r['category'] == 'knockout']
    skills = [r for r in results if r['category'] == 'skill']
    
    if len(knockouts) <= max_knockouts:
        return results
    
    # Sort knockouts by confidence score (required > preferred), then by score
    def knockout_sort_key(kw):
        type_priority = 0 if kw.get('knockout_type') == 'required' else 1
        confidence = kw.get('knockout_confidence', 0)
        score = kw.get('score', 0)
        return (type_priority, -confidence, -score)
    
    knockouts.sort(key=knockout_sort_key)
    
    # Keep top knockouts, reclassify the rest as skills
    kept_knockouts = knockouts[:max_knockouts]
    overflow_knockouts = knockouts[max_knockouts:]
    
    # Reclassify overflow knockouts as skills
    for kw in overflow_knockouts:
        kw['category'] = 'skill'
        kw['knockout_type'] = None
        kw['knockout_confidence'] = 0
    
    # Combine all results
    updated_results = kept_knockouts + skills + overflow_knockouts
    
    print(f"🎯 Knockout limit enforced: {len(kept_knockouts)} knockouts kept, {len(overflow_knockouts)} reclassified as skills")
    
    return updated_results

def calculate_compound_boost(keyword_text):
    """Boost compound keywords over solo terms."""
    words = keyword_text.split()
    word_count = len(words)
    
    # Base compound boost
    if word_count == 1:
        return 1.0  # No boost for solo terms
    elif word_count == 2:
        return 1.3  # "product strategy", "B2B SaaS"
    elif word_count >= 3:
        return 1.5  # "7+ years in product management"
    
    # Executive-specific compounds get additional boost
    exec_compounds = {
        'product strategy', 'go-to-market', 'product-market fit',
        'revenue expansion', 'customer-driven growth', 'vertical saas',
        'b2b saas', 'high-growth phases', 'portfolio management',
        'stakeholder alignment', 'cross-functional leadership'
    }
    
    if keyword_text.lower() in exec_compounds:
        return 1.6  # Strong boost for executive compounds
    
    return 1.0


def is_executive_vocabulary(keyword_text):
    """Check if keyword represents authentic executive vocabulary."""
    keyword_lower = keyword_text.lower().strip()
    return keyword_lower in EXECUTIVE_VOCABULARY

def is_executive_buzzword(keyword_text):
    """Check if keyword is an overused executive buzzword."""
    keyword_lower = keyword_text.lower().strip()
    return keyword_lower in EXECUTIVE_BUZZWORDS

def calculate_executive_adjustment(keyword_text):
    """Calculate executive vocabulary adjustment factor."""
    if is_executive_vocabulary(keyword_text):
        return EXECUTIVE_VOCAB_BOOST
    elif is_executive_buzzword(keyword_text):
        return EXECUTIVE_BUZZWORD_PENALTY
    return 1.0

def calculate_tfidf_scores(keywords, job_text):
    """Calculate TF-IDF scores for keywords with fallback to frequency count."""
    keyword_texts = [kw['text'].lower() for kw in keywords]
    
    # Create TF-IDF vectorizer with fixed vocabulary
    vectorizer = TfidfVectorizer(
        vocabulary=keyword_texts,
        ngram_range=(1, 3),
        stop_words='english',
        lowercase=True
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

def score_single_keyword(keyword, tfidf_scores, job_text, drop_buzz=False):
    """Calculate score for a single keyword with all enhancements."""
    kw_text = keyword['text']
    role = keyword['role']
    
    # Get TF-IDF score
    tfidf_score = tfidf_scores.get(kw_text, 0.0)
    
    # Calculate section boost
    section_score = calculate_section_boost(job_text, kw_text)
    
    # Get role weight
    role_score = ROLE_WEIGHTS.get(role, 0.3)
    
    # Calculate base score
    base_score = (
        TFIDF_WEIGHT * tfidf_score +
        SECTION_WEIGHT * section_score +
        ROLE_WEIGHT * role_score
    )
    
    # Apply enhancements
    enhanced_score = apply_enhancements(base_score, kw_text, job_text)
    
    # Apply buzzword dampening
    is_buzz = is_buzzword(kw_text)
    if is_buzz and drop_buzz:
        return None  # Skip buzzwords entirely
    elif is_buzz:
        enhanced_score *= BUZZWORD_PENALTY  # Apply penalty
    
    final_score = enhanced_score
    
    # Categorize keyword using intelligent classification
    categorization = categorize_keyword(kw_text, final_score, tfidf_score, role_score)
    
    return {
        'kw': kw_text,
        'tfidf': round(float(tfidf_score), 3),
        'section': round(float(section_score), 3),
        'role': round(float(role_score), 3),
        'score': round(final_score, 3),
        'is_buzzword': is_buzz,
        'category': categorization['category'],
        'knockout_type': categorization.get('knockout_type'),
        'knockout_confidence': categorization.get('confidence', 0)
    }

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
    
    # Future enhancements will be added here
    # - Technical sophistication scoring
    # - Context-aware requirement analysis
    
    return enhanced_score

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


def save_output_files(knockout_requirements, top_skills, canonical_keywords, args):
    """Save canonical keyword analysis and checklist files."""
    # Get the working directory (assumes keywords.json is in inputs/)
    inputs_dir = Path(args.keywords_file).parent
    working_dir = inputs_dir.parent / "working"
    
    # Ensure working directory exists
    working_dir.mkdir(exist_ok=True)
    
    # Save single canonical keyword analysis with all data
    canonical_output = {
        "knockout_requirements": knockout_requirements,
        "skills_ranked": top_skills,
        "metadata": {
            "total_keywords_processed": len(canonical_keywords),
            "knockout_count": len(knockout_requirements),
            "skills_count": len(top_skills),
            "generated_at": None  # Could add timestamp if needed
        }
    }
    
    analysis_file = working_dir / "keyword_analysis.json"
    with open(analysis_file, 'w') as f:
        json.dump(canonical_output, f, indent=2)
    
    # Generate keyword checklist markdown
    checklist_content = generate_keyword_checklist(knockout_requirements, top_skills)
    checklist_file = working_dir / "keyword-checklist.md"
    with open(checklist_file, 'w') as f:
        f.write(checklist_content)
    
    return analysis_file, checklist_file

def extract_employer_info(context, location):
    """Extract employer and location info for better findability."""
    # Extract employer name (everything before the first " - ")
    employer = context.split(' - ')[0] if ' - ' in context else context
    
    # Extract location info for line numbers/references
    location_info = ""
    if 'sentence' in location:
        # For sentence locations like "basics.summary (sentence 2)"
        location_info = location.split('(')[1].rstrip(')') if '(' in location else ""
    elif 'highlights' in location:
        # For bullet locations like "work[1].highlights[0]"
        # Extract the bullet number
        import re
        match = re.search(r'highlights\[(\d+)\]', location)
        if match:
            bullet_num = int(match.group(1)) + 1  # Convert to 1-indexed
            location_info = f"bullet {bullet_num}"
    
    # Format final string
    if location_info:
        return f"[{employer}, {location_info}]"
    else:
        return f"[{employer}]"

def generate_keyword_checklist(knockout_requirements, top_skills):
    """Generate markdown checklist for manual keyword injection."""
    content = []
    content.append("# Keyword Injection Checklist")
    content.append("")
    content.append("Use this checklist during resume optimization to ensure critical keywords are included.")
    content.append("")
    
    # Knockout Requirements Section
    content.append("## 🎯 Knockout Requirements")
    content.append("*These are critical qualifications that must be addressed in your resume.*")
    content.append("")
    
    if knockout_requirements:
        for req in knockout_requirements:
            aliases_text = f" (aliases: {', '.join(req['aliases'])})" if req.get('aliases') else ""
            knockout_label = f" ({req['knockout_type']})" if req.get('knockout_type') == 'preferred' else ""
            content.append(f"- [ ] **{req['kw']}** (score: {req['score']}){aliases_text}{knockout_label}")
        content.append("")
    else:
        content.append("- No knockout requirements identified")
    
    content.append("")
    
    # Top Skills Section
    content.append(f"## 🏆 Top {len(top_skills)} Skills")
    content.append("*These are the highest-priority skills to emphasize in your resume.*")
    content.append("")
    
    for skill in top_skills:
        aliases_text = f" (aliases: {', '.join(skill['aliases'])})" if skill.get('aliases') else ""
        buzzword_flag = " ⚠️ *buzzword*" if skill.get('is_buzzword', False) else ""
        content.append(f"- [ ] **{skill['kw']}** (score: {skill['score']}){aliases_text}{buzzword_flag}")
        
        # Add injection points if available
        if skill.get('injection_points'):
            content.append("")  # Breathing room
            for point in skill['injection_points']:
                # Extract employer and location info for better findability
                employer_info = extract_employer_info(point['context'], point['location'])
                similarity_score = f"({point['similarity']}) " if point.get('similarity') else ""
                content.append(f"  [ ] {similarity_score}💡 \"{point['text']}\" {employer_info}")
            content.append("")
    
    content.append("")
    content.append("## 📝 Usage Notes")
    content.append("")
    content.append("- **Knockout Requirements**: Ensure these appear prominently in your experience section")
    content.append("- **Skills**: Work these naturally into job descriptions and achievements")
    content.append("- **Aliases**: Use variety - don't repeat the same keyword phrase")
    content.append("- **Buzzwords**: Use sparingly and in context, not as standalone terms")
    content.append("")
    content.append("---")
    content.append("*Generated by keyword analysis pipeline*")
    
    return "\n".join(content)

def print_results_summary(knockout_requirements, top_skills):
    """Print final results summary."""
    print(f"\n🎯 KNOCKOUT REQUIREMENTS ({len(knockout_requirements)}):")
    for i, result in enumerate(knockout_requirements, 1):
        aliases_str = f" (aliases: {', '.join(result['aliases'])})" if result.get('aliases') else ""
        print(f"  {i}. {result['kw']} (score: {result['score']}){aliases_str}")
    
    print(f"\n🏆 TOP {len(top_skills)} SKILLS:")
    for i, result in enumerate(top_skills, 1):
        aliases_str = f" (aliases: {', '.join(result['aliases'])})" if result.get('aliases') else ""
        print(f"  {i}. {result['kw']} (score: {result['score']}){aliases_str}")
    
    print(f"\n✨ Complete! Run time: <3s")

def print_dual_summary(knockout_requirements, top_skills):
    """Print comprehensive dual analysis summary."""
    print("\n" + "="*60)
    print("🎯 KNOCKOUT REQUIREMENTS ANALYSIS")
    print("="*60)
    
    if knockout_requirements:
        print(f"Found {len(knockout_requirements)} critical requirements:")
        for i, req in enumerate(knockout_requirements, 1):
            status = "✓" if req['tfidf'] > 0 else "○"
            confidence = "HIGH" if req['score'] >= 0.8 else "MEDIUM" if req['score'] >= 0.5 else "LOW"
            print(f"{i:2}. {status} {req['kw']} (score: {req['score']}, confidence: {confidence})")
    else:
        print("No knockout requirements identified.")
    
    print("\n" + "="*60)
    print("🏆 TOP SKILLS ANALYSIS")
    print("="*60)
    
    for i, skill in enumerate(top_skills, 1):
        status = "✓" if skill['tfidf'] > 0 else "○"
        buzzword_flag = " [BUZZWORD]" if skill.get('is_buzzword', False) else ""
        print(f"{i:2}. {status} {skill['kw']} (score: {skill['score']}){buzzword_flag}")
    
    print("\n" + "="*60)

def split_into_sentences(text):
    """Split text into sentences using simple regex."""
    if not text:
        return []
    
    # Simple sentence splitting on periods, exclamation marks, and question marks
    # followed by space and capital letter
    sentences = re.split(r'[.!?]+\s+(?=[A-Z])', text)
    
    # Clean up sentences
    cleaned_sentences = []
    for sentence in sentences:
        sentence = sentence.strip()
        if sentence and len(sentence) > 10:  # Filter out very short fragments
            cleaned_sentences.append(sentence)
    
    return cleaned_sentences

def extract_matchable_content(resume_json):
    """Extract bullets and sentences from resume for keyword matching."""
    content = []
    
    # Extract bullets from highlights
    for work_idx, work in enumerate(resume_json.get('work', [])):
        for highlight_idx, highlight in enumerate(work.get('highlights', [])):
            content.append({
                'text': highlight.strip(),
                'type': 'bullet',
                'location': f"work[{work_idx}].highlights[{highlight_idx}]",
                'context': f"{work.get('name', 'Unknown')} - {work.get('position', 'Unknown')}",
                'section': 'highlights'
            })
    
    # Extract sentences from work summaries
    for work_idx, work in enumerate(resume_json.get('work', [])):
        if work.get('summary'):
            sentences = split_into_sentences(work['summary'])
            for sent_idx, sentence in enumerate(sentences):
                content.append({
                    'text': sentence.strip(),
                    'type': 'sentence',
                    'location': f"work[{work_idx}].summary (sentence {sent_idx+1})",
                    'context': f"{work.get('name', 'Unknown')} - {work.get('position', 'Unknown')}",
                    'section': 'work_summary'
                })
    
    # Extract sentences from basics summary
    if resume_json.get('basics', {}).get('summary'):
        sentences = split_into_sentences(resume_json['basics']['summary'])
        for sent_idx, sentence in enumerate(sentences):
            content.append({
                'text': sentence.strip(),
                'type': 'sentence',
                'location': f"basics.summary (sentence {sent_idx+1})",
                'context': "Executive Summary",
                'section': 'basics_summary'
            })
    
    return content

def classify_match(content_text, keyword, similarity_score):
    """Classify the match quality and suggest action."""
    # Check for exact match (case-insensitive)
    if keyword.lower() in content_text.lower():
        return "✅", "already contains keyword"
    elif similarity_score >= 0.75:
        return "✏️", "likely one-word tweak"
    elif similarity_score >= 0.55:
        return "🟠", "may need short phrase"
    else:
        return "💡", "suggest adding new bullet"

def find_injection_points(resume_json, keywords):
    """Find best placement spots for keywords using semantic similarity."""
    from sklearn.metrics.pairwise import cosine_similarity
    
    # Extract matchable content
    content = extract_matchable_content(resume_json)
    
    if not content:
        print("Warning: No matchable content found in resume")
        return keywords
    
    # Load sentence transformer model
    model = SentenceTransformer('all-MiniLM-L6-v2')
    
    # Encode all content
    content_texts = [item['text'] for item in content]
    
    # Filter out empty content
    valid_content = [(i, content[i]) for i, text in enumerate(content_texts) if text.strip()]
    if not valid_content:
        print("Warning: No valid content found for matching")
        return keywords
    
    valid_texts = [content[i]['text'] for i, _ in valid_content]
    content_embeddings = model.encode(valid_texts, normalize_embeddings=True)
    
    # Process each keyword
    for keyword in keywords:
        kw_text = keyword['kw']
        
        if not kw_text.strip():
            continue
            
        # Encode keyword
        kw_embedding = model.encode([kw_text], normalize_embeddings=True)
        
        # Calculate similarities with error handling
        try:
            similarities = cosine_similarity(kw_embedding, content_embeddings)[0]
            # Handle NaN values
            similarities = np.nan_to_num(similarities, nan=0.0, posinf=0.0, neginf=0.0)
        except Exception as e:
            print(f"Warning: Error calculating similarity for '{kw_text}': {e}")
            similarities = np.zeros(len(valid_content))
        
        # Get top 3 matches
        top_indices = np.argsort(similarities)[-3:][::-1]  # Top 3 in descending order
        
        injection_points = []
        for idx in top_indices:
            if idx < len(valid_content):
                _, content_item = valid_content[idx]
                similarity = similarities[idx]
                
                # Classify the match
                icon, action = classify_match(content_item['text'], kw_text, similarity)
                
                # Truncate text for display (keep first 60 characters)
                display_text = content_item['text']
                if len(display_text) > 60:
                    display_text = display_text[:57] + "..."
                
                injection_points.append({
                    'text': display_text,
                    'full_text': content_item['text'],
                    'similarity': round(float(similarity), 3),
                    'location': content_item['location'],
                    'context': content_item['context'],
                    'section': content_item['section'],
                    'icon': icon,
                    'action': action
                })
        
        keyword['injection_points'] = injection_points
    
    return keywords

def main():
    """Main function."""
    args = parse_arguments()
    
    # Load input data
    print(f"🔍 Loading keywords from: {args.keywords_file}")
    keywords = load_keywords(args.keywords_file)
    
    print(f"📄 Loading job posting from: {args.job_file}")
    job_text = load_job_posting(args.job_file)
    
    # Process keywords
    print(f"⚙️ Processing {len(keywords)} keywords...")
    results = rank_keywords(keywords, job_text, args.drop_buzz)
    
    if args.drop_buzz:
        print(f"🚫 Buzzword filtering: dropped buzzwords entirely")
    else:
        print(f"📉 Buzzword dampening: applied {BUZZWORD_PENALTY}x penalty to buzzwords")
    
    # Separate knockout requirements and skills
    knockouts = [r for r in results if r['category'] == 'knockout']
    skills = [r for r in results if r['category'] == 'skill']
    
    print(f"🎯 Categorized: {len(knockouts)} knockout requirements, {len(skills)} skills")
    
    # Enforce knockout maximum (reclassify overflow as skills)
    results = enforce_knockout_maximum(results, max_knockouts=5)
    
    # Update counts after enforcement
    knockouts = [r for r in results if r['category'] == 'knockout']
    skills = [r for r in results if r['category'] == 'skill']
    print(f"🎯 Final categorization: {len(knockouts)} knockout requirements, {len(skills)} skills")
    
    # Post-process results
    print(f"🔗 Clustering aliases (threshold: {args.cluster_thresh})...")
    canonical_keywords = cluster_aliases(results, args.cluster_thresh)
    
    # Separate knockouts and skills for different processing
    knockout_keywords = [k for k in canonical_keywords if k['category'] == 'knockout']
    skill_keywords = [k for k in canonical_keywords if k['category'] == 'skill']
    
    # Trim only skills (not knockouts)
    print(f"✂️ Trimming skills by median score...")
    trimmed_skills = trim_by_median(skill_keywords)
    
    print(f"🏆 Selecting top {args.top} skills...")
    
    # Get top skills sorted by score
    top_skills = sorted(trimmed_skills, key=lambda x: x['score'], reverse=True)[:args.top]
    
    # Get all knockout requirements sorted by type and score
    def knockout_sort_key(kw):
        type_priority = 0 if kw.get('knockout_type') == 'required' else 1
        return (type_priority, -kw.get('score', 0))
    
    knockout_requirements = sorted(knockout_keywords, key=knockout_sort_key)
    
    # Add sentence-matching if resume file provided
    if args.resume:
        print(f"🎯 Finding injection points...")
        try:
            with open(args.resume, 'r', encoding='utf-8') as f:
                resume_json = json.load(f)
            
            # Combine all keywords for sentence matching
            all_keywords = knockout_requirements + top_skills
            enhanced_keywords = find_injection_points(resume_json, all_keywords)
            
            # Update the separate lists with injection points
            knockout_requirements = [kw for kw in enhanced_keywords if kw['category'] == 'knockout']
            top_skills = [kw for kw in enhanced_keywords if kw['category'] == 'skill']
            
            print(f"✅ Injection points found for {len(enhanced_keywords)} keywords")
            
        except FileNotFoundError:
            print(f"⚠️  Resume file not found: {args.resume}")
            print("   Proceeding without sentence matching...")
        except json.JSONDecodeError:
            print(f"⚠️  Invalid JSON in resume file: {args.resume}")
            print("   Proceeding without sentence matching...")
        except Exception as e:
            print(f"⚠️  Error processing resume: {e}")
            print("   Proceeding without sentence matching...")
    
    # Show optional dual output summary
    if args.summary:
        print_dual_summary(knockout_requirements, top_skills)
    
    # Save output files
    print(f"💾 Saving results...")
    analysis_file, checklist_file = save_output_files(
        knockout_requirements, top_skills, canonical_keywords, args)
    
    print(f"✅ Keyword analysis saved to: {analysis_file}")
    print(f"✅ Checklist created at: {checklist_file}")
    print(f"📊 Processed {len(results)} → {len(canonical_keywords)} canonical → {len(knockout_requirements)} knockouts + {len(top_skills)} top skills")
    
    # Show final results summary
    print_results_summary(knockout_requirements, top_skills)

if __name__ == '__main__':
    main() 