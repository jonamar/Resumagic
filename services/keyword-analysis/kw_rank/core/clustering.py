"""
Clustering module for keyword analysis.

Handles semantic clustering, alias generation, and similarity calculations
for grouping related keywords.
"""

import re
import numpy as np
from sklearn.cluster import AgglomerativeClustering
from sentence_transformers import SentenceTransformer
from config.constants import get_config

config = get_config()


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


def trim_by_median(canonical_keywords, median_multiplier=None, min_keywords=None):
    """
    Trim keywords based on median score threshold.
    Only keeps keywords that score above median * multiplier.
    
    Args:
        canonical_keywords (list): Keywords to trim
        median_multiplier (float): Multiplier for median threshold
        min_keywords (int): Minimum keywords to keep regardless of score
        
    Returns:
        list: Trimmed keyword list
    """
    if median_multiplier is None:
        median_multiplier = config.clustering.median_multiplier
    if min_keywords is None:
        min_keywords = config.clustering.min_keywords
    
    if len(canonical_keywords) <= min_keywords:
        return canonical_keywords
    
    # Calculate median score
    scores = [kw['score'] for kw in canonical_keywords]
    median_score = np.median(scores)
    threshold = median_score * median_multiplier
    
    # Keep keywords above threshold, but ensure minimum count
    above_threshold = [kw for kw in canonical_keywords if kw['score'] >= threshold]
    
    # If we don't have enough above threshold, take top min_keywords
    if len(above_threshold) < min_keywords:
        sorted_keywords = sorted(canonical_keywords, key=lambda x: x['score'], reverse=True)
        return sorted_keywords[:min_keywords]
    
    return above_threshold


def calculate_semantic_similarity(text1, text2):
    """Calculate semantic similarity between two texts."""
    model = SentenceTransformer('all-MiniLM-L6-v2')
    embeddings = model.encode([text1, text2], normalize_embeddings=True)
    
    # Calculate cosine similarity
    similarity = np.dot(embeddings[0], embeddings[1])
    return float(similarity)