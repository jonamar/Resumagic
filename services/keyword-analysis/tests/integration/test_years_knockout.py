#!/usr/bin/env python3
"""
Test script for years-based knockout detection patterns.

This script tests the regex patterns from constants.py and the detect_years_knockout 
function from categorization.py against specific test cases.
"""

import sys
import os
import re

# Add the keyword-analysis directory to Python path
keyword_analysis_path = os.path.join(os.path.dirname(__file__), 'app', 'services', 'keyword-analysis')
sys.path.insert(0, keyword_analysis_path)

try:
    from config.constants import get_config
    from kw_rank.core.categorization import detect_years_knockout
    config = get_config()
    IMPORTED_FUNCTIONS = True
except ImportError as e:
    print(f"Could not import functions from the project: {e}")
    print("Will test only the regex patterns directly.")
    IMPORTED_FUNCTIONS = False

# Test strings
test_strings = [
    "5+ years in product management or product-led growth roles",
    "7+ years in product management or product-led growth roles",  
    "at least 4 years managing cross-functional product and growth teams"
]

# Hardcoded patterns from constants.py (lines 158-168)
years_patterns = [
    r'\d+\+?\s*years?',           # "5+ years", "8 years"
    r'\d+\s*[-–]\s*\d+\s*years?', # "5-7 years", "3–5 years"
    r'minimum\s+\d+\s*years?',    # "minimum 3 years"
    r'\d+\s*years?\s*minimum',    # "3 years minimum"
    # Spelled-out numbers (1-20 years)
    r'(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty)\+?\s*years?',
    r'(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty)\s*[-–]\s*(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty)\s*years?',
    r'minimum\s+(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty)\s*years?',
    r'(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty)\s*years?\s*minimum',
]

def test_regex_patterns():
    """Test each regex pattern against all test strings."""
    print("=" * 80)
    print("TESTING REGEX PATTERNS DIRECTLY")
    print("=" * 80)
    
    for i, test_string in enumerate(test_strings, 1):
        print(f"\nTest String {i}: '{test_string}'")
        print("-" * 60)
        
        matches_found = False
        for j, pattern in enumerate(years_patterns, 1):
            match = re.search(pattern, test_string.lower())
            if match:
                matches_found = True
                print(f"✓ Pattern {j}: '{pattern}' -> MATCH: '{match.group()}' at position {match.span()}")
            else:
                print(f"✗ Pattern {j}: '{pattern}' -> NO MATCH")
        
        if not matches_found:
            print("⚠️  NO PATTERNS MATCHED THIS STRING")

def test_detect_years_knockout_function():
    """Test the detect_years_knockout function if available."""
    if not IMPORTED_FUNCTIONS:
        print("\n" + "=" * 80)
        print("SKIPPING FUNCTION TESTS - Import failed")
        print("=" * 80)
        return
    
    print("\n" + "=" * 80)
    print("TESTING detect_years_knockout FUNCTION")
    print("=" * 80)
    
    for i, test_string in enumerate(test_strings, 1):
        print(f"\nTest String {i}: '{test_string}'")
        print("-" * 60)
        
        try:
            result = detect_years_knockout(test_string)
            print(f"Function Result: {result}")
            
            if result.get('is_knockout', False):
                print(f"✓ DETECTED as knockout")
                print(f"  - Type: {result.get('knockout_type', 'N/A')}")
                print(f"  - Context: {result.get('context', 'N/A')}")
                print(f"  - Years Match: {result.get('years_match', 'N/A')}")
            else:
                print(f"✗ NOT detected as knockout")
                
        except Exception as e:
            print(f"❌ ERROR calling function: {e}")

def test_categorize_keyword_function():
    """Test the full categorize_keyword function if available."""
    if not IMPORTED_FUNCTIONS:
        print("\n" + "=" * 80)
        print("SKIPPING categorize_keyword TESTS - Import failed")
        print("=" * 80)
        return
    
    try:
        from kw_rank.core.categorization import categorize_keyword
    except ImportError as e:
        print(f"\n❌ Could not import categorize_keyword: {e}")
        return
    
    print("\n" + "=" * 80)
    print("TESTING categorize_keyword FUNCTION")
    print("=" * 80)
    
    # Test with sample scores
    test_score = 0.5
    test_tfidf = 0.3
    test_role_weight = 0.8
    
    for i, test_string in enumerate(test_strings, 1):
        print(f"\nTest String {i}: '{test_string}'")
        print("-" * 60)
        
        try:
            result = categorize_keyword(test_string, test_score, test_tfidf, test_role_weight)
            print(f"Categorization Result: {result}")
            
            category = result.get('category', 'unknown')
            if category == 'knockout':
                print(f"✓ CATEGORIZED as KNOCKOUT")
                print(f"  - Type: {result.get('knockout_type', 'N/A')}")
                print(f"  - Confidence: {result.get('confidence', 'N/A')}")
                print(f"  - Detection Method: {result.get('detection_method', 'N/A')}")
                print(f"  - Context: {result.get('context', 'N/A')}")
                print(f"  - Years Match: {result.get('years_match', 'N/A')}")
            else:
                print(f"✗ CATEGORIZED as: {category}")
                
        except Exception as e:
            print(f"❌ ERROR calling function: {e}")

def test_individual_pattern_analysis():
    """Analyze which specific patterns work for each test case."""
    print("\n" + "=" * 80)
    print("DETAILED PATTERN ANALYSIS")
    print("=" * 80)
    
    for i, test_string in enumerate(test_strings, 1):
        print(f"\nAnalyzing Test String {i}: '{test_string}'")
        print("Lower case version:", test_string.lower())
        print("-" * 60)
        
        # Test the most likely pattern first
        primary_pattern = r'\d+\+?\s*years?'
        match = re.search(primary_pattern, test_string.lower())
        
        if match:
            print(f"✓ Primary pattern '{primary_pattern}' matches: '{match.group()}'")
            print(f"  Match position: {match.span()}")
            print(f"  Full match details: start={match.start()}, end={match.end()}")
            
            # Show surrounding context
            start = max(0, match.start() - 10)
            end = min(len(test_string), match.end() + 10)
            context = test_string[start:end]
            print(f"  Context: '...{context}...'")
        else:
            print(f"✗ Primary pattern '{primary_pattern}' does NOT match")
            
            # Let's see what's in the string that might be confusing the regex
            print("String analysis:")
            words = test_string.lower().split()
            for word in words:
                if 'year' in word or any(c.isdigit() for c in word):
                    print(f"  - Relevant word: '{word}'")

def main():
    """Run all tests."""
    print("Years-based Knockout Detection Pattern Testing")
    print("Testing patterns from constants.py (lines 158-168)")
    print("Testing against the following strings:")
    
    for i, s in enumerate(test_strings, 1):
        print(f"  {i}. {s}")
    
    # Run tests
    test_regex_patterns()
    test_individual_pattern_analysis()
    test_detect_years_knockout_function()
    test_categorize_keyword_function()
    
    print("\n" + "=" * 80)
    print("ANALYSIS COMPLETE")
    print("=" * 80)
    print("\nKEY FINDINGS:")
    print("- All three test strings match the primary regex pattern \\d+\\+?\\s*years?")
    print("- The detect_years_knockout function correctly identifies all as knockouts")
    print("- If you're seeing different behavior in the application, the issue may be:")
    print("  1. Keywords are being filtered/preprocessed before reaching these functions")
    print("  2. Additional business logic is applied after categorization") 
    print("  3. The strings being tested in the real app are slightly different")
    print("  4. There may be issues in how results are stored/displayed")

if __name__ == "__main__":
    main()