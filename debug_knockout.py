#!/usr/bin/env python3
"""Debug script for knockout detection analysis"""

import json
from pathlib import Path
from kw_rank import (
    load_keywords, load_job_posting, rank_keywords, categorize_keyword,
    calculate_knockout_confidence, is_soft_skill, ROLE_WEIGHTS
)

def debug_keyword_categorization():
    """Debug the categorization of all keywords"""
    # Load test data
    data_dir = Path("/Users/jonamar/Documents/resumagic/data/applications/nicejob-director-product")
    keywords_file = data_dir / "inputs/keywords.json"
    job_file = data_dir / "inputs/job-posting.md"
    
    keywords = load_keywords(str(keywords_file))
    job_text = load_job_posting(str(job_file))
    
    # Get all scored keywords
    results = rank_keywords(keywords, job_text)
    
    print("=" * 80)
    print("KEYWORD CATEGORIZATION DEBUG")
    print("=" * 80)
    print(f"Total keywords processed: {len(results)}")
    
    knockouts = []
    skills = []
    
    for result in results:
        keyword = result['kw']
        score = result['score']
        tfidf = result['tfidf']
        role_weight = result['role']
        category = result['category']
        
        # Calculate knockout confidence manually
        knockout_confidence = calculate_knockout_confidence(keyword.lower(), role_weight)
        is_soft = is_soft_skill(keyword.lower())
        
        print(f"\nKeyword: {keyword}")
        print(f"  Role weight: {role_weight}")
        print(f"  Score: {score}")
        print(f"  TF-IDF: {tfidf}")
        print(f"  Knockout confidence: {knockout_confidence:.3f}")
        print(f"  Is soft skill: {is_soft}")
        print(f"  Category: {category}")
        
        if category == 'knockout':
            knockouts.append(result)
        else:
            skills.append(result)
    
    print(f"\n" + "=" * 80)
    print(f"SUMMARY:")
    print(f"  Knockouts: {len(knockouts)}")
    print(f"  Skills: {len(skills)}")
    
    # Show all core keywords and their categorization
    print(f"\n" + "=" * 80)
    print("CORE KEYWORDS ANALYSIS:")
    print("=" * 80)
    
    core_keywords = [k for k in keywords if k['role'] == 'core']
    print(f"Total core keywords: {len(core_keywords)}")
    
    for core_kw in core_keywords:
        # Find the corresponding result
        result = next((r for r in results if r['kw'] == core_kw['text']), None)
        if result:
            knockout_confidence = calculate_knockout_confidence(core_kw['text'].lower(), ROLE_WEIGHTS['core'])
            is_soft = is_soft_skill(core_kw['text'].lower())
            
            print(f"\n{core_kw['text']}:")
            print(f"  Category: {result['category']}")
            print(f"  Score: {result['score']}")
            print(f"  TF-IDF: {result['tfidf']}")
            print(f"  Knockout confidence: {knockout_confidence:.3f}")
            print(f"  Is soft skill: {is_soft}")
            print(f"  Should be knockout: {knockout_confidence >= 0.6 and not is_soft}")

if __name__ == "__main__":
    debug_keyword_categorization()