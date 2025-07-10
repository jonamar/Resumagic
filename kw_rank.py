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
import argparse

# Role weight constants
ROLE_WEIGHTS = {
    'core': 1.0,
    'important': 0.6,
    'culture': 0.3
}

# Scoring weights
TFIDF_WEIGHT = 0.6
SECTION_WEIGHT = 0.25
ROLE_WEIGHT = 0.15

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
    
    return parser.parse_args()

def load_keywords(keywords_file):
    """Load keywords from JSON file."""
    try:
        with open(keywords_file, 'r', encoding='utf-8') as f:
            keywords_data = json.load(f)
        
        # Convert to list of keyword objects with role and text
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
        sys.exit(1)

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

def calculate_section_boost(job_text, keyword):
    """Calculate section boost score for a keyword based on where it appears."""
    boost_score = 0.0
    
    # Split job text into lines for section analysis
    lines = job_text.split('\n')
    
    # Check title (first 150 words)
    first_150_words = ' '.join(job_text.split()[:150])
    if keyword.lower() in first_150_words:
        boost_score = max(boost_score, SECTION_BOOSTS['title'])
    
    # Check each line against section patterns
    for line in lines:
        line = line.strip().lower()
        if keyword.lower() in line:
            for section_name, pattern in SECTION_PATTERNS.items():
                if re.search(pattern, line, re.IGNORECASE):
                    boost_score = max(boost_score, SECTION_BOOSTS[section_name])
                    break
    
    return boost_score

def rank_keywords(keywords, job_text):
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
        
        # Calculate final score
        final_score = (
            TFIDF_WEIGHT * tfidf_score +
            SECTION_WEIGHT * section_score +
            ROLE_WEIGHT * role_score
        )
        
        results.append({
            'kw': kw_text,
            'tfidf': round(float(tfidf_score), 3),
            'section': round(float(section_score), 3),
            'role': round(float(role_score), 3),
            'score': round(final_score, 3)
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
    keywords = load_keywords(args.keywords_file)
    
    print(f"📄 Loading job posting from: {args.job_file}")
    job_text = load_job_posting(args.job_file)
    
    print(f"⚙️ Processing {len(keywords)} keywords...")
    results = rank_keywords(keywords, job_text)
    
    print(f"💾 Saving results...")
    output_file = save_results(results, args.keywords_file)
    
    print(f"\n✨ Complete! Run time: <2s")

if __name__ == '__main__':
    main() 