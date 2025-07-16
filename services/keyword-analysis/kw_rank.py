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

# Import configuration
from config.constants import get_config, validate_config

# Initialize configuration
config = get_config()
validate_config(config)

# Legacy constants - will be removed in Phase 2
# These are kept temporarily for backwards compatibility during transition

# Executive vocabulary will be moved to configuration in Phase 2

# Knockout patterns will be moved to configuration in Phase 2

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

def extract_years_context(keyword, years_match):
    """
    Extract meaningful context around years mention.
    
    Args:
        keyword (str): The full keyword text
        years_match: The regex match object for years
        
    Returns:
        str: Extracted context around the years mention
    """
    # Get the position of the years match
    start_pos = years_match.start()
    end_pos = years_match.end()
    
    # Look for context after years
    after_years = keyword[end_pos:].strip()
    
    # Common context patterns
    context_patterns = [
        r'^\s*of\s+(.+?)(?:[.,;]|$|\s+and\s+|\s+or\s+|\s+but\s+|\s+with\s+|\s+while\s+|\s+across\s+)',
        r'^\s*in\s+(.+?)(?:[.,;]|$|\s+and\s+|\s+or\s+|\s+but\s+|\s+with\s+|\s+while\s+|\s+across\s+)',
        r'^\s+(.+?)(?:[.,;]|$|\s+and\s+|\s+or\s+|\s+but\s+|\s+with\s+|\s+while\s+|\s+across\s+)',
    ]
    
    for pattern in context_patterns:
        match = re.search(pattern, after_years, re.IGNORECASE)
        if match:
            context = match.group(1).strip()
            if context and len(context) > 2:  # Avoid single character matches
                return context
    
    # If no clear pattern, look for context before years (less common)
    before_years = keyword[:start_pos].strip()
    if before_years:
        # Look for action words before years
        action_match = re.search(r'(managing|leading|building|developing|working)\s+.*?$', before_years, re.IGNORECASE)
        if action_match:
            return action_match.group(0)
    
    # Fallback: return the portion after years up to punctuation
    fallback_match = re.search(r'^[^.,;]+', after_years)
    if fallback_match:
        return fallback_match.group(0).strip()
    
    return "experience"  # Default fallback

def categorize_keyword(keyword, score, tfidf_score, role_weight):
    """
    Intelligently categorize a scored keyword as knockout requirement or skill.
    Uses hybrid approach: enhanced years-based detection + traditional patterns.
    
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
    
    # NEW: Enhanced years-based knockout detection
    years_result = detect_years_knockout(keyword)
    if years_result['is_knockout']:
        return {
            'category': 'knockout', 
            'knockout_type': years_result['knockout_type'],
            'confidence': 1.0,  # High confidence for years-based
            'detection_method': 'years_based',
            'context': years_result['context']
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
            'detection_method': 'traditional',
            'score': score
        }
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
    parser.add_argument('--cluster-thresh', type=float, default=config.clustering.similarity_threshold,
                       help=f'Clustering threshold for alias detection (default: {config.clustering.similarity_threshold})')
    parser.add_argument('--top', type=int, default=config.output.max_top_keywords,
                       help=f'Number of top keywords to output (default: {config.output.max_top_keywords})')
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
    return keyword_lower in config.buzzwords.buzzwords

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

def enhance_keyword_texts(keyword_texts):
    """Enhance keyword texts for better semantic clustering."""
    enhanced_texts = []
    for text in keyword_texts:
        enhanced = text
        # Add context to scaling phrases to improve semantic similarity
        if any(scale_term in text.lower() for scale_term in ['scale', 'scaling', 'growth', 'expansion']):
            enhanced = f"{text} business growth scaling products"
        enhanced_texts.append(enhanced)
    return enhanced_texts

def perform_clustering(embeddings, cluster_threshold):
    """Perform hierarchical clustering on keyword embeddings."""
    clustering = AgglomerativeClustering(
        distance_threshold=cluster_threshold,
        n_clusters=None,
        linkage='average',
        metric='cosine'
    )
    return clustering.fit_predict(embeddings)

def group_keywords_by_cluster(ranked_keywords, cluster_labels):
    """Group keywords by their cluster labels."""
    clusters = {}
    for i, label in enumerate(cluster_labels):
        if label not in clusters:
            clusters[label] = []
        clusters[label].append(ranked_keywords[i])
    return clusters

def create_canonical_keywords(clusters):
    """Create canonical keywords with aliases from clusters."""
    canonical_keywords = []
    for cluster_keywords in clusters.values():
        canonical = select_canonical_keyword(cluster_keywords).copy()
        
        # Add aliases (all other keywords in the cluster)
        aliases = [kw['kw'] for kw in cluster_keywords if kw['kw'] != canonical['kw']]
        canonical['aliases'] = aliases
        
        canonical_keywords.append(canonical)
    
    return canonical_keywords

def cluster_aliases(ranked_keywords, cluster_threshold=None):
    """
    Cluster similar keywords using semantic embeddings.
    Returns canonical keywords with their aliases.
    """
    if len(ranked_keywords) <= 1:
        return ranked_keywords
    
    # Load SentenceTransformer model and extract texts
    model = SentenceTransformer('all-MiniLM-L6-v2')
    keyword_texts = [kw['kw'] for kw in ranked_keywords]
    
    # Enhance texts for better clustering
    enhanced_texts = enhance_keyword_texts(keyword_texts)
    embeddings = model.encode(enhanced_texts, normalize_embeddings=True)
    
    # Use configured threshold if not provided
    if cluster_threshold is None:
        cluster_threshold = config.clustering.distance_threshold
    
    # Perform clustering
    cluster_labels = perform_clustering(embeddings, cluster_threshold)
    
    # Group keywords by cluster
    clusters = group_keywords_by_cluster(ranked_keywords, cluster_labels)
    
    # Create canonical keywords with aliases
    return create_canonical_keywords(clusters)

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
    
    # Categorize keyword using intelligent classification
    categorization = categorize_keyword(kw_text, final_score, tfidf_score, role_score)
    
    return create_keyword_result(kw_text, tfidf_score, section_score, role_score, final_score, is_buzz, categorization)

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

def prepare_resume_content(resume_json):
    """Extract and validate resume content for injection analysis."""
    content = extract_matchable_content(resume_json)
    
    if not content:
        print("Warning: No matchable content found in resume")
        return None, None
    
    # Filter out empty content
    valid_content = [(i, content[i]) for i, text in enumerate([item['text'] for item in content]) if text.strip()]
    if not valid_content:
        print("Warning: No valid content found for matching")
        return None, None
    
    return content, valid_content

def encode_content_embeddings(valid_content):
    """Encode resume content using sentence transformer."""
    model = SentenceTransformer('all-MiniLM-L6-v2')
    valid_texts = [content[i]['text'] for i, _ in valid_content]
    return model.encode(valid_texts, normalize_embeddings=True), model

def compute_keyword_similarities(keyword_text, content_embeddings, model):
    """Compute semantic similarities between keyword and content."""
    from sklearn.metrics.pairwise import cosine_similarity
    
    if not keyword_text.strip():
        return np.zeros(len(content_embeddings))
    
    # Encode keyword
    kw_embedding = model.encode([keyword_text], normalize_embeddings=True)
    
    # Calculate similarities with error handling
    try:
        similarities = cosine_similarity(kw_embedding, content_embeddings)[0]
        # Handle NaN values
        similarities = np.nan_to_num(similarities, nan=0.0, posinf=0.0, neginf=0.0)
    except Exception as e:
        print(f"Warning: Error calculating similarity for '{keyword_text}': {e}")
        similarities = np.zeros(len(content_embeddings))
    
    return similarities

def create_injection_point(content_item, similarity, keyword_text):
    """Create an injection point object with classification."""
    # Classify the match
    icon, action = classify_match(content_item['text'], keyword_text, similarity)
    
    # Truncate text for display (keep first 60 characters)
    display_text = content_item['text']
    if len(display_text) > 60:
        display_text = display_text[:57] + "..."
    
    return {
        'text': display_text,
        'full_text': content_item['text'],
        'similarity': round(float(similarity), 3),
        'location': content_item['location'],
        'context': content_item['context'],
        'section': content_item['section'],
        'icon': icon,
        'action': action
    }

def find_injection_points(resume_json, keywords):
    """Find best placement spots for keywords using semantic similarity."""
    # Prepare and validate content
    content, valid_content = prepare_resume_content(resume_json)
    if content is None:
        return keywords
    
    # Encode content embeddings
    content_embeddings, model = encode_content_embeddings(valid_content)
    
    # Process each keyword
    for keyword in keywords:
        kw_text = keyword['kw']
        
        # Compute similarities
        similarities = compute_keyword_similarities(kw_text, content_embeddings, model)
        
        # Get top 3 matches
        top_indices = np.argsort(similarities)[-3:][::-1]  # Top 3 in descending order
        
        injection_points = []
        for idx in top_indices:
            if idx < len(valid_content):
                _, content_item = valid_content[idx]
                similarity = similarities[idx]
                
                injection_point = create_injection_point(content_item, similarity, kw_text)
                injection_points.append(injection_point)
        
        keyword['injection_points'] = injection_points
    
    return keywords

def load_input_data(args):
    """Load keywords and job posting from input files."""
    print(f"🔍 Loading keywords from: {args.keywords_file}")
    keywords = load_keywords(args.keywords_file)
    
    print(f"📄 Loading job posting from: {args.job_file}")
    job_text = load_job_posting(args.job_file)
    
    return keywords, job_text

def process_keywords(keywords, job_text, args):
    """Process keywords and handle buzzword filtering."""
    print(f"⚙️ Processing {len(keywords)} keywords...")
    results = rank_keywords(keywords, job_text, args.drop_buzz)
    
    if args.drop_buzz:
        print(f"🚫 Buzzword filtering: dropped buzzwords entirely")
    else:
        print(f"📉 Buzzword dampening: applied {config.buzzwords.penalty}x penalty to buzzwords")
    
    return results

def categorize_and_enforce_limits(results):
    """Categorize keywords and enforce knockout limits."""
    # Separate knockout requirements and skills
    knockouts = [r for r in results if r['category'] == 'knockout']
    skills = [r for r in results if r['category'] == 'skill']
    
    print(f"🎯 Categorized: {len(knockouts)} knockout requirements, {len(skills)} skills")
    
    # Enforce knockout maximum (reclassify overflow as skills)
    results = enforce_knockout_maximum(results, max_knockouts=config.knockouts.max_knockouts)
    
    # Update counts after enforcement
    knockouts = [r for r in results if r['category'] == 'knockout']
    skills = [r for r in results if r['category'] == 'skill']
    print(f"🎯 Final categorization: {len(knockouts)} knockout requirements, {len(skills)} skills")
    
    return results

def process_clustering_and_trimming(results, args):
    """Handle clustering and trimming of skills."""
    print(f"🔗 Clustering aliases (threshold: {args.cluster_thresh})...")
    knockout_keywords = [k for k in results if k['category'] == 'knockout']
    skill_keywords = [k for k in results if k['category'] == 'skill']
    
    # Only cluster skills (knockouts remain unchanged - no aliases needed)
    clustered_skills = cluster_aliases(skill_keywords, args.cluster_thresh) if skill_keywords else []
    
    # Combine knockouts (unchanged) with clustered skills
    canonical_keywords = knockout_keywords + clustered_skills
    
    # Trim only skills (not knockouts)
    print(f"✂️ Trimming skills by median score...")
    trimmed_skills = trim_by_median(clustered_skills)
    
    return canonical_keywords, knockout_keywords, trimmed_skills

def select_top_results(knockout_keywords, trimmed_skills, args):
    """Select top skills and sort knockout requirements."""
    print(f"🏆 Selecting top {args.top} skills...")
    
    # Get top skills sorted by score
    top_skills = sorted(trimmed_skills, key=lambda x: x['score'], reverse=True)[:args.top]
    
    # Get all knockout requirements sorted by type and score
    def knockout_sort_key(kw):
        type_priority = 0 if kw.get('knockout_type') == 'required' else 1
        return (type_priority, -kw.get('score', 0))
    
    knockout_requirements = sorted(knockout_keywords, key=knockout_sort_key)
    
    return knockout_requirements, top_skills

def process_resume_injection(knockout_requirements, top_skills, args):
    """Process resume injection points if resume file provided."""
    if not args.resume:
        return knockout_requirements, top_skills
    
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
    
    return knockout_requirements, top_skills

def save_and_display_results(knockout_requirements, top_skills, canonical_keywords, results, args):
    """Save output files and display results."""
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

def main():
    """Main function orchestrating the keyword analysis workflow."""
    args = parse_arguments()
    
    # Load input data
    keywords, job_text = load_input_data(args)
    
    # Process keywords
    results = process_keywords(keywords, job_text, args)
    
    # Categorize and enforce limits
    results = categorize_and_enforce_limits(results)
    
    # Process clustering and trimming
    canonical_keywords, knockout_keywords, trimmed_skills = process_clustering_and_trimming(results, args)
    
    # Select top results
    knockout_requirements, top_skills = select_top_results(knockout_keywords, trimmed_skills, args)
    
    # Process resume injection if provided
    knockout_requirements, top_skills = process_resume_injection(knockout_requirements, top_skills, args)
    
    # Save and display results
    save_and_display_results(knockout_requirements, top_skills, canonical_keywords, results, args)

if __name__ == '__main__':
    main() 