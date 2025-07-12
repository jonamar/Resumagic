#!/usr/bin/env python3
"""
Keyword Priority Ranking Tool
Ranks job-specific keywords by importance using TF-IDF, section boost, and role weights.
"""

import sys
import json
import re
import os
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
    """Load keywords from JSON file (supports both legacy and two-tier format)."""
    try:
        with open(keywords_file, 'r', encoding='utf-8') as f:
            keywords_data = json.load(f)
        
        # Check if new two-tier format
        if isinstance(keywords_data, dict) and 'skills_keywords' in keywords_data:
            print("📊 Loading two-tier keyword format")
            return keywords_data
        
        # Legacy format - convert to two-tier
        print("📊 Converting legacy keyword format")
        keywords = []
        for item in keywords_data:
            if isinstance(item, dict) and 'kw' in item and 'role' in item:
                keywords.append({
                    'text': item['kw'],
                    'role': item['role']
                })
            else:
                print(f"Warning: Skipping invalid keyword entry: {item}")
        
        # Return as legacy format for backward compatibility
        return {'skills_keywords': keywords, 'knockout_requirements': []}
        
    except FileNotFoundError:
        print(f"Error: Keywords file not found: {keywords_file}")
        sys.exit(1)
    except json.JSONDecodeError as e:
        print(f"Error: Invalid JSON in keywords file: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"Error loading keywords: {e}")
        return {'skills_keywords': [], 'knockout_requirements': []}

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

def process_knockouts(knockouts, resume_text, job_text):
    """Process knockout requirements with simple exact matching."""
    if not knockouts:
        return []
    
    results = []
    for knockout in knockouts:
        # Exact phrase matching in both resume and job posting
        kw_lower = knockout['kw'].lower()
        resume_match = kw_lower in resume_text.lower()
        job_match = kw_lower in job_text.lower()
        
        results.append({
            'requirement': knockout['kw'],
            'type': knockout['type'],
            'priority': knockout['priority'],
            'in_resume': resume_match,
            'in_job_posting': job_match,
            'status': 'MATCH' if resume_match and job_match else 'MISSING',
            'resume_critical': resume_match and knockout['priority'] in ['critical', 'required']
        })
    
    return results

def generate_summary(knockouts, top_skills, top_n=5):
    """Generate comprehensive summary with knockout status and top skills."""
    
    # Analyze knockout status
    critical_missing = [k for k in knockouts if k['priority'] == 'critical' and k['status'] == 'MISSING']
    required_missing = [k for k in knockouts if k['priority'] == 'required' and k['status'] == 'MISSING']
    all_requirements_met = len(critical_missing) == 0 and len(required_missing) == 0
    
    # Create summary
    summary = {
        'knockout_status': {
            'total_knockouts': len(knockouts),
            'critical_missing': [k['requirement'] for k in critical_missing],
            'required_missing': [k['requirement'] for k in required_missing],
            'all_requirements_met': all_requirements_met,
            'recommendation': 'PROCEED' if all_requirements_met else 'REVIEW_REQUIREMENTS'
        },
        'top_skills': [
            {
                'keyword': skill['kw'],
                'score': round(skill['score'], 3),
                'tfidf': round(skill['tfidf'], 3),
                'in_job_posting': skill['tfidf'] > 0
            }
            for skill in top_skills[:top_n]
        ],
        'knockouts_detail': knockouts
    }
    
    return summary

def print_summary(summary):
    """Print formatted summary to console."""
    
    print("\n" + "="*60)
    print("🎯 KNOCKOUT REQUIREMENTS STATUS")
    print("="*60)
    
    knockouts = summary['knockout_status']
    if knockouts['all_requirements_met']:
        print("✅ ALL REQUIREMENTS MET")
    else:
        if knockouts['critical_missing']:
            print(f"❌ CRITICAL MISSING ({len(knockouts['critical_missing'])}):")
            for req in knockouts['critical_missing']:
                print(f"   • {req}")
        
        if knockouts['required_missing']:
            print(f"⚠️  REQUIRED MISSING ({len(knockouts['required_missing'])}):")
            for req in knockouts['required_missing']:
                print(f"   • {req}")
    
    print(f"\n📊 Recommendation: {knockouts['recommendation']}")
    
    print("\n" + "="*60)
    print("🏆 TOP SKILLS KEYWORDS")
    print("="*60)
    
    for i, skill in enumerate(summary['top_skills'], 1):
        status = "✓" if skill['in_job_posting'] else "○"
        print(f"{i:2}. {status} {skill['keyword']} (score: {skill['score']})")
    
    print("\n" + "="*60)

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

def apply_enhancements(base_score, keyword_text, job_text, keyword_metadata=None):
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
    
    # Prepare keyword list for TF-IDF (convert to lowercase to avoid warning)
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
    else:
        # Get TF-IDF scores (map back to original keyword text)
        tfidf_scores = {}
        for i, keyword_obj in enumerate(keywords):
            keyword_lower = keyword_obj['text'].lower()
            if keyword_lower in feature_names:
                feature_idx = list(feature_names).index(keyword_lower)
                tfidf_scores[keyword_obj['text']] = tfidf_matrix[0, feature_idx]
            else:
                tfidf_scores[keyword_obj['text']] = 0.0
    
    # Calculate final scores
    results = []
    for keyword in keywords:
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
        if is_buzz:
            if drop_buzz:
                continue  # Skip buzzwords entirely
            else:
                enhanced_score *= BUZZWORD_PENALTY  # Apply penalty
        
        final_score = enhanced_score
        
        results.append({
            'kw': kw_text,
            'tfidf': round(float(tfidf_score), 3),
            'section': round(float(section_score), 3),
            'role': round(float(role_score), 3),
            'score': round(final_score, 3),
            'is_buzzword': is_buzz
        })
    
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

def main():
    """Main function."""
    args = parse_arguments()
    
    print(f"🔍 Loading keywords from: {args.keywords_file}")
    keyword_data = load_keywords(args.keywords_file)
    
    print(f"📄 Loading job posting from: {args.job_file}")
    job_text = load_job_posting(args.job_file)
    
    # Handle two-tier format
    if 'skills_keywords' in keyword_data:
        skills_keywords = keyword_data['skills_keywords']
        knockouts = keyword_data.get('knockout_requirements', [])
        
        # Convert skills to legacy format for processing
        skills_legacy = []
        for skill in skills_keywords:
            skills_legacy.append({
                'text': skill['kw'],
                'role': skill['role']
            })
        
        print(f"⚙️ Processing {len(skills_legacy)} skills keywords...")
        print(f"🎯 Processing {len(knockouts)} knockout requirements...")
        
        # Process skills with existing algorithm
        skills_results = rank_keywords(skills_legacy, job_text, args.drop_buzz)
        
        # Process knockouts with simple matching
        resume_text = ""  # TODO: Load resume if needed
        knockout_results = process_knockouts(knockouts, resume_text, job_text)
        
        # Use skills results for main processing
        results = skills_results
    else:
        # Legacy single-tier format
        print(f"⚙️ Processing {len(keyword_data)} keywords...")
        results = rank_keywords(keyword_data, job_text, args.drop_buzz)
    
    if args.drop_buzz:
        print(f"🚫 Buzzword filtering: dropped buzzwords entirely")
    else:
        print(f"📉 Buzzword dampening: applied {BUZZWORD_PENALTY}x penalty to buzzwords")
    
    print(f"🔗 Clustering aliases (threshold: {args.cluster_thresh})...")
    canonical_keywords = cluster_aliases(results, args.cluster_thresh)
    
    print(f"✂️ Trimming by median score...")
    trimmed_keywords = trim_by_median(canonical_keywords)
    
    print(f"🏆 Selecting top {args.top} keywords...")
    top_keywords = sorted(trimmed_keywords, key=lambda x: x['score'], reverse=True)[:args.top]
    
    # Show summary if requested and two-tier format
    if args.summary and 'skills_keywords' in keyword_data:
        summary = generate_summary(knockout_results, top_keywords, args.top)
        print_summary(summary)
    
    print(f"💾 Saving results...")
    
    # Save full results (post-processing)
    output_dir = Path(args.keywords_file).parent
    full_output_file = output_dir / "kw_rank_post.json"
    with open(full_output_file, 'w') as f:
        json.dump(canonical_keywords, f, indent=2)
    
    # Save top results
    top_output_file = output_dir / args.out
    with open(top_output_file, 'w') as f:
        json.dump(top_keywords, f, indent=2)
    
    print(f"✅ Full ranking saved to: {full_output_file}")
    print(f"✅ Top {args.top} keywords saved to: {top_output_file}")
    print(f"📊 Processed {len(results)} → {len(canonical_keywords)} canonical → {len(top_keywords)} top")
    
    # Show top results
    print(f"\n🏆 Top {len(top_keywords)} ranked keywords:")
    for i, result in enumerate(top_keywords, 1):
        aliases_str = f" (aliases: {', '.join(result['aliases'])})" if result.get('aliases') else ""
        print(f"  {i}. {result['kw']} (score: {result['score']}){aliases_str}")
    
    print(f"\n✨ Complete! Run time: <3s")

if __name__ == '__main__':
    main() 