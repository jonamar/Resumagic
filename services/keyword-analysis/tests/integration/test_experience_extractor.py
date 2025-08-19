#!/usr/bin/env python3
"""
Test the experience extractor on North One job posting
"""

import sys
import os
sys.path.append('/Users/jonamar/Documents/resumagic/app/services/keyword-analysis')

from kw_rank.core.experience_extractor import ExperienceExtractor

# Test text from North One job posting
test_text = """
**Experience in Product and Design Leadership:** 7+ years in product management or product-led growth roles, with at least 4 years managing cross-functional product and growth teams. Proven track record in a scaling B2B SaaS or FinTech, driving revenue and customer engagement through scalable product and growth initiatives.
"""

def main():
    extractor = ExperienceExtractor()
    
    print("=== Testing Experience Extractor ===")
    print(f"Input text: {test_text.strip()}")
    print()
    
    requirements = extractor.extract_experience_requirements(test_text)
    
    print(f"Found {len(requirements)} experience requirements:")
    print()
    
    for i, req in enumerate(requirements, 1):
        print(f"Requirement {i}:")
        print(f"  Full text: {req.full_text}")
        print(f"  Years: {req.years}")
        print(f"  Role type: {req.role_type}")
        print(f"  Context: {req.context}")
        print()
    
    # Convert to keyword format
    keywords = extractor.convert_to_keywords(requirements)
    
    print("=== As Keywords ===")
    for keyword in keywords:
        print(f"  {keyword}")

if __name__ == "__main__":
    main()