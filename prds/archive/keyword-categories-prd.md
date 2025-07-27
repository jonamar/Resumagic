⏺ PRD: Two-Tier Keyword Classification System

  Problem Statement

  Current keyword ranking mixes critical knockout requirements (job titles, years of experience, education) with skills-based
   keywords, leading to:
  - Binary pass/fail requirements competing with nuanced skills for ranking position
  - Unclear visibility into whether candidates meet hard requirements vs. skill preferences
  - Suboptimal ATS alignment where different requirement types need different matching strategies

  Solution

  Enhance existing unified scoring workflow with intelligent categorization:
  1. **Unified Scoring**: All keywords processed through robust TF-IDF ranking system (preserve current quality)
  2. **Intelligent Categorization**: Algorithmic post-scoring classification separates knockouts from skills
  3. **Dual Presentation**: Surface knockout requirements and ranked skills as complementary outputs

  Success Metrics

  - Primary: Clear separation of knockouts vs skills in top 5 analysis
  - Secondary: Improved keyword quality through focused ranking per category
  - Validation: Manual review shows knockout requirements are properly identified and don't compete with skills

  User Stories

  1. As a job applicant, I want to know which requirements are deal-breakers vs. nice-to-have skills
  2. As someone optimizing resumes, I want knockout requirements highlighted separately from ranked skills
  3. As someone testing the system, I want to quickly validate both knockout status and top skills

  Technical Implementation

  Enhanced Workflow
  ```
  Original Keywords → TF-IDF Scoring → Intelligent Categorization → Dual Output
  ```

  Categorization Logic
  ```python
  def categorize_scored_keyword(keyword, score, context):
      knockout_patterns = [
          r'\d+\+?\s*years?\s*(of\s+)?(experience|leadership)',
          r'(director|vp|chief|head\s+of|senior\s+director)', 
          r'(bachelor|master|mba|phd|degree)',
          r'required\s+(education|experience)'
      ]
      
      if matches_pattern(keyword) and high_confidence_signals(score, context):
          return 'knockout'
      return 'skill'
  ```

  Output Format
  ```json
  {
    "knockout_requirements": [
      {"kw": "VP of Product", "score": 0.95, "confidence": "high"},
      {"kw": "8+ years experience", "score": 0.87, "confidence": "medium"}
    ],
    "skills_ranked": [
      {"kw": "product strategy", "score": 0.84},
      {"kw": "B2B SaaS", "score": 0.79}
    ]
  }
  ```

  Testing Approach

  1. **Baseline Test**: Verify existing TF-IDF scoring quality maintained post-enhancement
  2. **Categorization Test**: Validate knockout vs skills separation accuracy across all 3 applications  
  3. **Quality Test**: Manual review of top 5 + knockouts - no degradation in current analysis
  4. **Edge Case Test**: Handle compound phrases like "5+ years product management experience"
  5. **Regression Test**: Ensure no breaking changes to current kw_rank.py workflow

  Definition of Done

  - Enhanced scoring system maintains existing ranking quality
  - Intelligent categorization accurately separates knockouts from skills
  - System handles new keywords without manual pre-categorization
  - Top 5 skills analysis unchanged in quality
  - Dual output clearly presents knockout requirements + ranked skills
  - No dependency on manual migration scripts or schema changes