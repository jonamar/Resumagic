#!/usr/bin/env python3
"""Debug script for trimming and clustering analysis"""

import json
from pathlib import Path
from kw_rank import (
    load_keywords, load_job_posting, rank_keywords, cluster_aliases, 
    trim_by_median, ROLE_WEIGHTS
)

def debug_trimming_pipeline():
    """Debug the trimming and clustering pipeline"""
    # Load test data
    data_dir = Path("/Users/jonamar/Documents/resumagic/data/applications/nicejob-director-product")
    keywords_file = data_dir / "inputs/keywords.json"
    job_file = data_dir / "inputs/job-posting.md"
    
    keywords = load_keywords(str(keywords_file))
    job_text = load_job_posting(str(job_file))
    
    # Get all scored keywords
    results = rank_keywords(keywords, job_text)
    
    print("=" * 80)
    print("BEFORE CLUSTERING AND TRIMMING")
    print("=" * 80)
    
    knockouts = [r for r in results if r['category'] == 'knockout']
    skills = [r for r in results if r['category'] == 'skill']
    
    print(f"Total results: {len(results)}")
    print(f"Knockouts: {len(knockouts)}")
    print(f"Skills: {len(skills)}")
    
    print("\nKnockouts found:")
    for kw in knockouts:
        print(f"  - {kw['kw']} (score: {kw['score']})")
    
    print("\n" + "=" * 80)
    print("AFTER CLUSTERING")
    print("=" * 80)
    
    # Cluster aliases
    canonical_keywords = cluster_aliases(results, 0.35)
    
    knockout_canonical = [k for k in canonical_keywords if k['category'] == 'knockout']
    skill_canonical = [k for k in canonical_keywords if k['category'] == 'skill']
    
    print(f"Total canonical: {len(canonical_keywords)}")
    print(f"Knockout canonical: {len(knockout_canonical)}")
    print(f"Skill canonical: {len(skill_canonical)}")
    
    print("\nKnockout canonical keywords:")
    for kw in knockout_canonical:
        aliases_str = f" (aliases: {kw['aliases']})" if kw['aliases'] else ""
        print(f"  - {kw['kw']} (score: {kw['score']}){aliases_str}")
    
    print("\n" + "=" * 80)
    print("AFTER TRIMMING")
    print("=" * 80)
    
    # Trim by median
    trimmed_keywords = trim_by_median(canonical_keywords)
    
    knockout_trimmed = [k for k in trimmed_keywords if k['category'] == 'knockout']
    skill_trimmed = [k for k in trimmed_keywords if k['category'] == 'skill']
    
    print(f"Total trimmed: {len(trimmed_keywords)}")
    print(f"Knockout trimmed: {len(knockout_trimmed)}")
    print(f"Skill trimmed: {len(skill_trimmed)}")
    
    print("\nFinal knockout keywords:")
    for kw in knockout_trimmed:
        aliases_str = f" (aliases: {kw['aliases']})" if kw['aliases'] else ""
        print(f"  - {kw['kw']} (score: {kw['score']}){aliases_str}")
    
    # Show what was trimmed out
    print("\n" + "=" * 80)
    print("TRIMMED OUT ANALYSIS")
    print("=" * 80)
    
    trimmed_out = [k for k in canonical_keywords if k not in trimmed_keywords]
    knockout_trimmed_out = [k for k in trimmed_out if k['category'] == 'knockout']
    
    print(f"Total trimmed out: {len(trimmed_out)}")
    print(f"Knockouts trimmed out: {len(knockout_trimmed_out)}")
    
    if knockout_trimmed_out:
        print("\nKnockouts that were trimmed out:")
        for kw in knockout_trimmed_out:
            aliases_str = f" (aliases: {kw['aliases']})" if kw['aliases'] else ""
            print(f"  - {kw['kw']} (score: {kw['score']}){aliases_str}")
    
    # Show median calculation
    scores = [kw['score'] for kw in canonical_keywords]
    import numpy as np
    median_score = np.median(scores)
    threshold = 1.2 * median_score
    
    print(f"\nMedian score: {median_score:.3f}")
    print(f"Threshold (1.2 * median): {threshold:.3f}")
    print(f"Keywords above threshold: {len([k for k in canonical_keywords if k['score'] > threshold])}")
    
    # Show actual threshold-based filtering
    above_threshold = [k for k in canonical_keywords if k['score'] > threshold]
    print(f"\nKeywords above threshold by category:")
    knockout_above = [k for k in above_threshold if k['category'] == 'knockout']
    skill_above = [k for k in above_threshold if k['category'] == 'skill']
    print(f"  Knockouts: {len(knockout_above)}")
    print(f"  Skills: {len(skill_above)}")

if __name__ == "__main__":
    debug_trimming_pipeline()