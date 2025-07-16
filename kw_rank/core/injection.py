"""
Injection module for keyword analysis.

Handles resume parsing, sentence matching, and injection point detection
using semantic similarity.
"""

import numpy as np
from sentence_transformers import SentenceTransformer
from config.constants import get_config

config = get_config()


def extract_matchable_content(resume_json):
    """
    Extract all matchable content from resume JSON with location tracking.
    
    Args:
        resume_json (dict): Resume data structure
        
    Returns:
        list: List of content items with location, context, and section info
    """
    content = []
    
    # Helper function to add content with metadata
    def add_content(text, location, context, section):
        if text and text.strip():
            content.append({
                'text': text.strip(),
                'location': location,
                'context': context,
                'section': section
            })
    
    # Extract from basics
    if 'basics' in resume_json:
        basics = resume_json['basics']
        
        # Summary (split into sentences)
        if 'summary' in basics and basics['summary']:
            sentences = basics['summary'].split('. ')
            for i, sentence in enumerate(sentences, 1):
                if sentence.strip():
                    add_content(
                        sentence.strip(),
                        f"basics.summary (sentence {i})",
                        "Executive Summary",
                        "basics_summary"
                    )
    
    # Extract from work experience
    if 'work' in resume_json:
        for work_idx, work in enumerate(resume_json['work']):
            company = work.get('company', f'Company {work_idx + 1}')
            position = work.get('position', 'Position')
            context = f"{company} - {position}"
            
            # Work summary (split into sentences)
            if 'summary' in work and work['summary']:
                sentences = work['summary'].split('. ')
                for sentence_idx, sentence in enumerate(sentences, 1):
                    if sentence.strip():
                        add_content(
                            sentence.strip(),
                            f"work[{work_idx}].summary (sentence {sentence_idx})",
                            context,
                            "work_summary"
                        )
            
            # Work highlights/achievements
            if 'highlights' in work:
                for highlight_idx, highlight in enumerate(work['highlights']):
                    if highlight.strip():
                        add_content(
                            highlight.strip(),
                            f"work[{work_idx}].highlights[{highlight_idx}]",
                            context,
                            "highlights"
                        )
    
    # Extract from education
    if 'education' in resume_json:
        for edu_idx, edu in enumerate(resume_json['education']):
            institution = edu.get('institution', f'Institution {edu_idx + 1}')
            degree = edu.get('studyType', 'Degree')
            context = f"{institution} - {degree}"
            
            if 'summary' in edu and edu['summary']:
                add_content(
                    edu['summary'],
                    f"education[{edu_idx}].summary",
                    context,
                    "education"
                )
    
    # Extract from skills (if they have descriptions)
    if 'skills' in resume_json:
        for skill_idx, skill in enumerate(resume_json['skills']):
            skill_name = skill.get('name', f'Skill {skill_idx + 1}')
            
            if 'summary' in skill and skill['summary']:
                add_content(
                    skill['summary'],
                    f"skills[{skill_idx}].summary",
                    skill_name,
                    "skills"
                )
    
    return content


def classify_match(content_text, keyword_text, similarity_score):
    """
    Classify the match and suggest action based on similarity score.
    
    Args:
        content_text (str): The resume content text
        keyword_text (str): The keyword being matched
        similarity_score (float): Similarity score between content and keyword
        
    Returns:
        tuple: (icon, action_description)
    """
    # Check if keyword already appears in content (exact or partial match)
    content_lower = content_text.lower()
    keyword_lower = keyword_text.lower()
    
    # Split keyword into words for partial matching
    keyword_words = [word for word in keyword_lower.split() if len(word) >= config.injection.min_word_length]
    
    # Check for exact matches
    if keyword_lower in content_lower:
        return "✅", "already contains keyword"
    
    # Check for partial matches (most keyword words present)
    if keyword_words:
        matches = sum(1 for word in keyword_words if word in content_lower)
        match_ratio = matches / len(keyword_words)
        
        if match_ratio >= 0.7:  # 70% of keyword words present
            return "✅", "already contains keyword"
    
    # Classify based on similarity score
    if similarity_score >= config.injection.high_similarity_threshold:
        return "✅", "already contains keyword"
    elif similarity_score >= config.injection.similarity_threshold:
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