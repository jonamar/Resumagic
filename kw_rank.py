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
    r'\d+\+?\s*years?\s*(of\s+)?(experience|leadership|management)',
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

def categorize_keyword(keyword, score, tfidf_score, role_weight):
    """
    Intelligently categorize a scored keyword as knockout requirement or skill.
    
    Args:
        keyword (str): The keyword text
        score (float): The final composite score (unused but kept for API compatibility)
        tfidf_score (float): The TF-IDF component score (unused but kept for API compatibility)
        role_weight (float): The role weight used in scoring
        
    Returns:
        str: 'knockout' or 'skill'
    """
    kw_lower = keyword.lower()
    
    # Check if this is a soft skill that should not be a knockout
    if is_soft_skill(kw_lower):
        return 'skill'
    
    # Calculate knockout confidence
    knockout_confidence = calculate_knockout_confidence(kw_lower, role_weight)
    
    # Lower threshold to catch more legitimate knockouts
    if knockout_confidence >= 0.6:
        return 'knockout'
    else:
        return 'skill'

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
    parser.add_argument('--drop-buzz', action='store_true', 
                       help='Drop buzzwords entirely instead of penalizing (default: penalize)')
    parser.add_argument('--cluster-thresh', type=float, default=0.35,
                       help='Clustering threshold for alias detection (default: 0.35)')
    parser.add_argument('--top', type=int, default=5,
                       help='Number of top keywords to output (default: 5)')
    parser.add_argument('--out', type=str, default='top5.json',
                       help='Output filename for top keywords (default: top5.json)')
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
    category = categorize_keyword(kw_text, final_score, tfidf_score, role_score)
    
    return {
        'kw': kw_text,
        'tfidf': round(float(tfidf_score), 3),
        'section': round(float(section_score), 3),
        'role': round(float(role_score), 3),
        'score': round(final_score, 3),
        'is_buzzword': is_buzz,
        'category': category
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

def save_results(results, keywords_file):
    """Save results to kw_rank.json in same directory as keywords file."""
    keywords_dir = Path(keywords_file).parent
    output_file = keywords_dir / 'kw_rank.json'
    
    try:
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(results, f, indent=2)
        
        print(f"✅ Keyword ranking saved to: {output_file}")
        print(f"📊 Processed {len(results)} keywords")
        
        # Show top 5 results for quick validation
        print("\n🏆 Top 5 ranked keywords:")
        for i, result in enumerate(results[:5], 1):
            print(f"  {i}. {result['kw']} (score: {result['score']})")
        
        return str(output_file)
        
    except Exception as e:
        print(f"Error saving results: {e}")
        sys.exit(1)

def save_output_files(knockout_requirements, top_skills, canonical_keywords, args):
    """Save all output files with proper structure."""
    output_dir = Path(args.keywords_file).parent
    
    # Save full results (post-processing) - maintains backward compatibility
    full_output_file = output_dir / "kw_rank_post.json"
    with open(full_output_file, 'w') as f:
        json.dump(canonical_keywords, f, indent=2)
    
    # Save top skills (maintains backward compatibility)
    top_output_file = output_dir / args.out
    with open(top_output_file, 'w') as f:
        json.dump(top_skills, f, indent=2)
    
    # Save new dual output format
    dual_output = {
        "knockout_requirements": knockout_requirements,
        "skills_ranked": top_skills
    }
    dual_output_file = output_dir / "keyword_analysis.json"
    with open(dual_output_file, 'w') as f:
        json.dump(dual_output, f, indent=2)
    
    return full_output_file, top_output_file, dual_output_file

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
    
    # Post-process results
    print(f"🔗 Clustering aliases (threshold: {args.cluster_thresh})...")
    canonical_keywords = cluster_aliases(results, args.cluster_thresh)
    
    print(f"✂️ Trimming by median score...")
    trimmed_keywords = trim_by_median(canonical_keywords)
    
    print(f"🏆 Selecting top {args.top} skills...")
    
    # Get top skills (excluding knockouts from regular top N)
    top_skills = sorted([k for k in trimmed_keywords if k['category'] == 'skill'], 
                       key=lambda x: x['score'], reverse=True)[:args.top]
    
    # Get all knockout requirements sorted by score
    knockout_requirements = sorted([k for k in trimmed_keywords if k['category'] == 'knockout'], 
                                  key=lambda x: x['score'], reverse=True)
    
    # Show optional dual output summary
    if args.summary:
        print_dual_summary(knockout_requirements, top_skills)
    
    # Save all output files
    print(f"💾 Saving results...")
    full_output_file, top_output_file, dual_output_file = save_output_files(
        knockout_requirements, top_skills, canonical_keywords, args)
    
    print(f"✅ Full ranking saved to: {full_output_file}")
    print(f"✅ Top {args.top} skills saved to: {top_output_file}")
    print(f"✅ Dual analysis saved to: {dual_output_file}")
    print(f"📊 Processed {len(results)} → {len(canonical_keywords)} canonical → {len(knockout_requirements)} knockouts + {len(top_skills)} top skills")
    
    # Show final results summary
    print_results_summary(knockout_requirements, top_skills)

if __name__ == '__main__':
    main() 