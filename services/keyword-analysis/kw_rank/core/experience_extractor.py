"""
Experience Requirements Extractor

Directly extracts years-based experience requirements from job postings 
to ensure accuracy before keyword analysis processing.
"""

import re
from typing import List, Dict, Tuple
from dataclasses import dataclass


@dataclass
class ExperienceRequirement:
    """Represents an extracted experience requirement."""
    full_text: str
    years: str
    context: str
    is_minimum: bool = True
    role_type: str = "core"


class ExperienceExtractor:
    """Extracts years-based experience requirements directly from job text."""
    
    def __init__(self):
        # Enhanced patterns for experience extraction
        self.experience_patterns = [
            # Standard patterns: "7+ years", "5-8 years", "minimum 4 years"
            r'(\d+)\+?\s*years?\s+(in|of|with|as|managing|leading|doing|performing|working|experience)\s+([^.]{10,100})',
            r'(\d+)\s*[-–]\s*(\d+)\s*years?\s+(in|of|with|as|managing|leading|doing|performing|working|experience)\s+([^.]{10,100})',
            r'(minimum|at least|minimum of)\s+(\d+)\+?\s*years?\s+(in|of|with|as|managing|leading|doing|performing|working|experience)\s+([^.]{10,100})',
            
            # Reverse patterns: "experience in X for 7+ years"
            r'experience\s+(in|with|as|managing|leading|doing|performing|working)\s+([^,]{5,50})[,.]?\s*for\s+(\d+)\+?\s*years?',
            
            # Complex patterns with embedded years
            r'([^.]{5,100})\s+(?:with|including|having)\s+(?:at least\s+)?(\d+)\+?\s*years?\s+(in|of|with|as|managing|leading)',
        ]
        
        # Product/leadership specific terms that indicate senior requirements
        self.senior_terms = [
            'product management', 'product-led growth', 'product strategy',
            'cross-functional', 'leadership', 'managing teams', 'leading teams',
            'product development', 'product marketing', 'growth teams'
        ]
    
    def extract_experience_requirements(self, job_text: str) -> List[ExperienceRequirement]:
        """
        Extract all years-based experience requirements from job text.
        
        Args:
            job_text: Raw job posting text
            
        Returns:
            List of ExperienceRequirement objects
        """
        requirements = []
        
        for pattern in self.experience_patterns:
            matches = re.finditer(pattern, job_text, re.IGNORECASE | re.MULTILINE)
            
            for match in matches:
                req = self._process_match(match, job_text)
                if req and self._is_valid_requirement(req):
                    requirements.append(req)
        
        # Deduplicate similar requirements
        return self._deduplicate_requirements(requirements)
    
    def _process_match(self, match: re.Match, full_text: str) -> ExperienceRequirement:
        """Process a regex match into an ExperienceRequirement."""
        groups = match.groups()
        
        # Extract years (first numeric group)
        years = None
        for group in groups:
            if group and group.isdigit():
                years = group
                break
        
        if not years:
            return None
            
        # Get full matched text with some context
        start = max(0, match.start() - 20)
        end = min(len(full_text), match.end() + 50)
        full_context = full_text[start:end].strip()
        
        # Determine if this is a senior/leadership requirement
        role_type = "core" if any(term in match.group().lower() for term in self.senior_terms) else "functional_skills"
        
        return ExperienceRequirement(
            full_text=match.group().strip(),
            years=years + "+",
            context=full_context,
            is_minimum=True,
            role_type=role_type
        )
    
    def _is_valid_requirement(self, req: ExperienceRequirement) -> bool:
        """Validate that this is a meaningful experience requirement."""
        if not req or not req.years:
            return False
            
        # Filter out very short or generic requirements
        if len(req.full_text) < 15:
            return False
            
        # Must contain meaningful experience terms
        experience_terms = ['years', 'experience', 'background', 'managing', 'leading', 'working']
        if not any(term in req.full_text.lower() for term in experience_terms):
            return False
            
        return True
    
    def _deduplicate_requirements(self, requirements: List[ExperienceRequirement]) -> List[ExperienceRequirement]:
        """Remove duplicate or very similar requirements."""
        if not requirements:
            return []
        
        # Sort by length (longer requirements usually more specific)
        requirements.sort(key=lambda x: len(x.full_text), reverse=True)
        
        unique_requirements = []
        
        for req in requirements:
            is_duplicate = False
            
            for existing in unique_requirements:
                # Check for substantial overlap in content
                req_words = set(req.full_text.lower().split())
                existing_words = set(existing.full_text.lower().split())
                
                overlap = len(req_words & existing_words) / len(req_words | existing_words)
                
                if overlap > 0.6:  # 60% word overlap threshold
                    is_duplicate = True
                    break
            
            if not is_duplicate:
                unique_requirements.append(req)
        
        return unique_requirements
    
    def convert_to_keywords(self, requirements: List[ExperienceRequirement]) -> List[Dict]:
        """Convert experience requirements to keyword format."""
        keywords = []
        
        for req in requirements:
            keywords.append({
                "kw": req.full_text,
                "role": req.role_type,
                "source": "experience_extractor",
                "years": req.years,
                "context": req.context
            })
        
        return keywords