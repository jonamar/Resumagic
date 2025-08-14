"""
Main orchestration module for keyword analysis.

Coordinates the entire keyword analysis workflow from input to output.
"""

import argparse
import json
from config.constants import get_config
from .io.loaders import load_keywords, load_job_posting
from .io.exporters import save_output_files
from .core.scoring import rank_keywords
from .core.categorization import enforce_knockout_maximum
from .core.clustering import cluster_aliases, trim_by_median
from .core.injection import find_injection_points
import re

config = get_config()


def parse_arguments():
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(description='Rank keywords using TF-IDF and role weights')
    parser.add_argument('keywords_file', help='Path to keywords JSON file')
    parser.add_argument('job_file', help='Path to job posting markdown file')
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


def apply_degree_guardrail(results):
    """Demote degree-related knockouts that are not present in the job posting (tfidf=0).

    Rationale: Degree requirements must be explicitly present in the job posting.
    Any seeded degree keyword with tfidf==0 should not be treated as a knockout.
    """
    degree_pattern = re.compile(r"\b(degree|bachelor|master|mba|phd|computer\s+science)\b", re.IGNORECASE)
    updated = []
    for item in results:
        if (
            item.get('category') == 'knockout'
            and float(item.get('tfidf', 0)) == 0.0
            and degree_pattern.search(item.get('kw', '')) is not None
        ):
            # Demote to skill
            demoted = item.copy()
            demoted['category'] = 'skill'
            demoted['knockout_type'] = None
            demoted['knockout_confidence'] = 0
            updated.append(demoted)
        else:
            updated.append(item)
    return updated


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


def print_dual_summary(knockout_requirements, top_skills):
    """Print optional dual output summary."""
    print("\n" + "="*50)
    print("DUAL OUTPUT SUMMARY")
    print("="*50)
    
    print(f"\nKNOCKOUT REQUIREMENTS ({len(knockout_requirements)}):")
    for i, req in enumerate(knockout_requirements, 1):
        confidence = req.get('knockout_confidence', 0)
        confidence_label = "HIGH" if confidence >= 0.8 else "MEDIUM" if confidence >= 0.5 else "LOW"
        print(f"  {i}. {req['kw']} (score: {req['score']}, confidence: {confidence_label})")
    
    print(f"\nTOP SKILLS ({len(top_skills)}):")
    for i, skill in enumerate(top_skills, 1):
        aliases = skill.get('aliases', [])
        alias_text = f" ({len(aliases)} aliases)" if aliases else ""
        print(f"  {i}. {skill['kw']} (score: {skill['score']}){alias_text}")


def print_results_summary(knockout_requirements, top_skills):
    """Print final results summary."""
    print(f"\n🎯 KNOCKOUT REQUIREMENTS ({len(knockout_requirements)}):")
    for i, req in enumerate(knockout_requirements, 1):
        print(f"  {i}. {req['kw']} (score: {req['score']})")
    
    print(f"\n🏆 TOP {len(top_skills)} SKILLS:")
    for i, skill in enumerate(top_skills, 1):
        aliases = skill.get('aliases', [])
        alias_text = f" (aliases: {', '.join(aliases)})" if aliases else ""
        print(f"  {i}. {skill['kw']} (score: {skill['score']}){alias_text}")
    
    print(f"\n✨ Complete! Run time: <3s")


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

    # Guardrail: demote degree knockouts not present in posting (tfidf==0)
    results = apply_degree_guardrail(results)
    
    # Process clustering and trimming
    canonical_keywords, knockout_keywords, trimmed_skills = process_clustering_and_trimming(results, args)
    
    # Select top results
    knockout_requirements, top_skills = select_top_results(knockout_keywords, trimmed_skills, args)
    
    # Process resume injection if provided
    knockout_requirements, top_skills = process_resume_injection(knockout_requirements, top_skills, args)
    
    # Save and display results
    save_and_display_results(knockout_requirements, top_skills, canonical_keywords, results, args)