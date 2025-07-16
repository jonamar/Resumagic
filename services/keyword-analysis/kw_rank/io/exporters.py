"""
Export module for keyword analysis.

Handles generation of analysis files, checklists, and other output formats.
"""

import json
from pathlib import Path


def save_keyword_analysis(knockout_requirements, top_skills, canonical_keywords, output_path):
    """Save keyword analysis to JSON file."""
    analysis_data = {
        "knockout_requirements": knockout_requirements,
        "skills_ranked": top_skills,
        "metadata": {
            "total_keywords_processed": len(canonical_keywords),
            "knockout_count": len(knockout_requirements),
            "skills_count": len(top_skills),
            "generated_at": None  # Could add timestamp if needed
        }
    }
    
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(analysis_data, f, indent=2)
    
    return output_path


def generate_knockout_checklist(knockout_requirements):
    """Generate checklist section for knockout requirements."""
    if not knockout_requirements:
        return ""
    
    checklist = "## 🎯 Knockout Requirements\n"
    checklist += "*These are critical qualifications that must be addressed in your resume.*\n\n"
    
    for req in knockout_requirements:
        kw_text = req['kw']
        score = req['score']
        knockout_type = req.get('knockout_type', 'required')
        
        type_suffix = " (preferred)" if knockout_type == 'preferred' else ""
        checklist += f"- [ ] **{kw_text}** (score: {score}){type_suffix}\n"
        
        # Add injection points if available
        if 'injection_points' in req and req['injection_points']:
            for point in req['injection_points']:
                similarity = point['similarity']
                icon = point['icon']
                text = point['text']
                context = point['context']
                checklist += f"\n  [ ] ({similarity}) {icon} \"{text}\" [{context}]\n"
    
    return checklist + "\n\n"


def generate_skills_checklist(top_skills):
    """Generate checklist section for top skills."""
    if not top_skills:
        return ""
    
    skills_count = len(top_skills)
    checklist = f"## 🏆 Top {skills_count} Skills\n"
    checklist += "*These are the highest-priority skills to emphasize in your resume.*\n\n"
    
    for skill in top_skills:
        kw_text = skill['kw']
        score = skill['score']
        aliases = skill.get('aliases', [])
        
        # Format aliases
        alias_text = ""
        if aliases:
            alias_text = f" (aliases: {', '.join(aliases)})"
        
        checklist += f"- [ ] **{kw_text}** (score: {score}){alias_text}\n"
        
        # Add injection points if available
        if 'injection_points' in skill and skill['injection_points']:
            for point in skill['injection_points']:
                similarity = point['similarity']
                icon = point['icon']
                text = point['text']
                context = point['context']
                
                # Extract meaningful context parts
                context_parts = context.split(' - ')
                if len(context_parts) >= 2:
                    company = context_parts[0]
                    # Get position or highlight number
                    if 'bullet' in point['location']:
                        location_part = point['location'].split('[')[1].split(']')[0]
                        context_short = f"{company}, bullet {int(location_part) + 1}"
                    elif 'sentence' in point['location']:
                        sentence_num = point['location'].split('sentence ')[1].split(')')[0]
                        context_short = f"{company}, sentence {sentence_num}"
                    else:
                        context_short = company
                else:
                    context_short = context
                
                checklist += f"\n  [ ] ({similarity}) {icon} \"{text}\" [{context_short}]\n"
        
        checklist += "\n"
    
    return checklist


def generate_usage_notes():
    """Generate usage notes section for the checklist."""
    return """## 📝 Usage Notes

- **Knockout Requirements**: Ensure these appear prominently in your experience section
- **Skills**: Work these naturally into job descriptions and achievements
- **Aliases**: Use variety - don't repeat the same keyword phrase
- **Buzzwords**: Use sparingly and in context, not as standalone terms

"""


def generate_keyword_checklist(knockout_requirements, top_skills, output_path):
    """Generate and save keyword checklist markdown file."""
    checklist_content = """# Keyword Optimization Checklist

Use this checklist during resume optimization to ensure critical keywords are included and well-placed.

"""
    
    # Add knockout requirements section
    checklist_content += generate_knockout_checklist(knockout_requirements)
    
    # Add top skills section
    checklist_content += generate_skills_checklist(top_skills)
    
    # Add usage notes
    checklist_content += generate_usage_notes()
    
    # Add injection points legend if there are any injection points
    has_injection_points = any(
        'injection_points' in item and item['injection_points'] 
        for item in knockout_requirements + top_skills
    )
    
    if has_injection_points:
        checklist_content += """---

### 🎯 Injection Point Legend
- ✅ **Already contains keyword**: Content already includes this keyword
- 🟠 **May need short phrase**: Content is related, consider adding keyword phrase
- 💡 **Suggest adding new bullet**: Create new bullet point featuring this keyword

*Numbers in parentheses show semantic similarity scores (0.0-1.0)*
"""
    
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(checklist_content)
    
    return output_path


def save_output_files(knockout_requirements, top_skills, canonical_keywords, args):
    """Save canonical keyword analysis and checklist files."""
    # Get the working directory (assumes keywords.json is in inputs/)
    inputs_dir = Path(args.keywords_file).parent
    working_dir = inputs_dir.parent / "working"
    
    # Ensure working directory exists
    working_dir.mkdir(exist_ok=True)
    
    # Save analysis file
    analysis_file = working_dir / "keyword_analysis.json"
    save_keyword_analysis(knockout_requirements, top_skills, canonical_keywords, analysis_file)
    
    # Save checklist file
    checklist_file = working_dir / "keyword-checklist.md"
    generate_keyword_checklist(knockout_requirements, top_skills, checklist_file)
    
    return analysis_file, checklist_file