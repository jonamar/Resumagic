#!/usr/bin/env node

import fs from 'fs';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface Keyword {
  kw: string;
  [key: string]: any; // Allow additional properties
}

interface KeywordAnalysis {
  knockout_requirements?: Keyword[];
  skills_ranked?: Keyword[];
  [key: string]: any; // Allow additional properties
}

interface PriorityKeywords {
  all_priorities: Keyword[];
  hr_keywords: Keyword[];
  technical_keywords: Keyword[];
  design_keywords: Keyword[];
  finance_keywords: Keyword[];
  ceo_keywords: Keyword[];
  team_keywords: Keyword[];
}

interface DomainAssignments {
  hr: Keyword[];
  technical: Keyword[];
  design: Keyword[];
  finance: Keyword[];
  ceo: Keyword[];
  team: Keyword[];
}

class KeywordExtractor {
  private baseDir: string;

  constructor() {
    this.baseDir = __dirname;
  }

  extractPriorityKeywords(keywordAnalysisPath: string): PriorityKeywords {
    const analysis: KeywordAnalysis = JSON.parse(fs.readFileSync(keywordAnalysisPath, 'utf8'));
        
    // Get all knockouts + top 5 skills (max 7 total)
    const knockouts = analysis.knockout_requirements || [];
    const topSkills = (analysis.skills_ranked || []).slice(0, 5);
        
    const allPriorities = [...knockouts, ...topSkills];
        
    return {
      all_priorities: allPriorities,
      hr_keywords: this.filterForHR(allPriorities),
      technical_keywords: this.filterForTechnical(allPriorities),
      design_keywords: this.filterForDesign(allPriorities),
      finance_keywords: this.filterForFinance(allPriorities),
      ceo_keywords: this.filterForCEO(allPriorities),
      team_keywords: this.filterForTeam(allPriorities),
    };
  }

  // Semantic domain keywords for similarity matching
  getDomainKeywords(): Record<string, string[]> {
    return {
      hr: [
        'experience', 'years of experience', 'leadership experience', 'team management',
        'people management', 'hiring', 'recruitment', 'cultural fit', 'collaboration',
        'communication skills', 'travel requirements', 'work experience', 'career progression',
        'progressive experience', 'product manager experience', 'manager experience', 'up to 50%',
      ],
      technical: [
        'computer science', 'engineering', 'software development', 'technical skills',
        'programming', 'architecture', 'system design', 'agile methodologies',
        'technical leadership', 'saas development', 'web development', 'mobile development',
        'technical depth', 'coding', 'algorithms', 'data structures',
      ],
      design: [
        'user experience', 'user interface', 'design systems', 'user research',
        'usability', 'design thinking', 'user-centered design', 'visual design',
        'interaction design', 'design collaboration', 'product design', 'design tools',
        'user journey', 'wireframes', 'prototyping', 'accessibility', 'product vision',
        'product strategy', 'design strategy', 'product roadmap', 'user-centered product',
        'product craft', 'design leadership',
      ],
      finance: [
        'budget management', 'financial planning', 'roi', 'revenue growth', 'cost management',
        'financial metrics', 'business impact', 'unit economics', 'saas metrics',
        'investment', 'resource allocation', 'financial analysis', 'profitability',
        'product investment', 'financial targets', 'revenue strategy', 'product profitability',
        'business growth', 'market expansion', 'pricing strategy',
      ],
      ceo: [
        'product strategy', 'business strategy', 'product vision', 'strategic thinking',
        'market analysis', 'product roadmap', 'business impact', 'stakeholder management',
        'executive leadership', 'strategic planning', 'vision alignment', 'product management',
        'business development', 'competitive analysis', 'market positioning', 'organizational growth',
      ],
      team: [
        'mentorship', 'coaching', 'team development', 'performance management',
        'leadership development', 'career growth', 'team collaboration', 'management skills',
        'people development', 'leadership style', 'direct reports', 'team building',
        'people leadership', 'team management', 'high-performing team', 'product management team',
        'leadership experience', 'management experience', 'team scaling',
      ],
    };
  }

  // Simple semantic similarity using word overlap and context
  // TODO: Replace with SentenceTransformer embeddings for production
  // Uses SentenceTransformer('all-MiniLM-L6-v2') model
  // Encodes keywords into 384-dimensional embeddings
  // Performs cosine similarity instead of word overlap
  // Current implementation is a placeholder for easy integration
  calculateSimilarity(keyword: string, domainKeywords: string[]): number {
    const keywordLower = keyword.toLowerCase();
    const keywordWords = keywordLower.split(/\s+/);
        
    let maxSimilarity = 0;
        
    for (const domainKeyword of domainKeywords) {
      const domainWords = domainKeyword.toLowerCase().split(/\s+/);
            
      // Calculate word overlap score
      const intersection = keywordWords.filter(word => 
        domainWords.some(domainWord => 
          word.includes(domainWord) || domainWord.includes(word),
        ),
      );
            
      const similarity = intersection.length / Math.max(keywordWords.length, domainWords.length);
      maxSimilarity = Math.max(maxSimilarity, similarity);
    }
        
    return maxSimilarity;
  }

  // Assign keywords to domains based on semantic similarity
  assignToDomains(keywords: Keyword[]): DomainAssignments {
    const domainKeywords = this.getDomainKeywords();
    const assignments: DomainAssignments = { hr: [], technical: [], design: [], finance: [], ceo: [], team: [] };
        
    for (const keyword of keywords) {
      const similarities = {
        hr: this.calculateSimilarity(keyword.kw, domainKeywords.hr),
        technical: this.calculateSimilarity(keyword.kw, domainKeywords.technical),
        design: this.calculateSimilarity(keyword.kw, domainKeywords.design),
        finance: this.calculateSimilarity(keyword.kw, domainKeywords.finance),
        ceo: this.calculateSimilarity(keyword.kw, domainKeywords.ceo),
        team: this.calculateSimilarity(keyword.kw, domainKeywords.team),
      };
            
      // Assign to domain with highest similarity (threshold 0.25)
      const maxSimilarity = Math.max(...Object.values(similarities));
      if (maxSimilarity >= 0.25) {
        const bestDomain = Object.entries(similarities)
          .find(([domain, score]) => score === maxSimilarity)?.[0] as keyof DomainAssignments;
        if (bestDomain) {
          assignments[bestDomain].push(keyword);
        }
      }
    }
        
    return assignments;
  }

  filterForHR(keywords: Keyword[]): Keyword[] {
    const assignments = this.assignToDomains(keywords);
    return assignments.hr;
  }

  filterForTechnical(keywords: Keyword[]): Keyword[] {
    const assignments = this.assignToDomains(keywords);
    return assignments.technical;
  }

  filterForDesign(keywords: Keyword[]): Keyword[] {
    const assignments = this.assignToDomains(keywords);
    return assignments.design;
  }
    
  filterForFinance(keywords: Keyword[]): Keyword[] {
    const assignments = this.assignToDomains(keywords);
    return assignments.finance;
  }
    
  filterForCEO(keywords: Keyword[]): Keyword[] {
    const assignments = this.assignToDomains(keywords);
    return assignments.ceo;
  }
    
  filterForTeam(keywords: Keyword[]): Keyword[] {
    const assignments = this.assignToDomains(keywords);
    return assignments.team;
  }

  generateContextPrompt(keywords: Keyword[]): string {
    if (keywords.length === 0) {
      return '';
    }
        
    const keywordList = keywords.map(kw => `"${kw.kw}"`).join(', ');
        
    return `
## Priority Focus Areas:
Pay special attention to how the candidate addresses these key requirements: ${keywordList}

## Company Context Considerations:
Consider the size, stage, and industry context of this organization when evaluating:
- Does the candidate's experience scale match your company's current needs?
- Are their past company contexts relevant preparation for your organizational complexity?
- Do their leadership experiences align with your current operational requirements?
`;
  }
}

// Export for use in other modules
export default KeywordExtractor;

// Test function if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const extractor = new KeywordExtractor();
  const keywordPath = path.join(__dirname, 'application-materials', 'keyword_analysis.json');
    
  const result = extractor.extractPriorityKeywords(keywordPath);
    
  // Debug similarity scores
  const domainKeywords = extractor.getDomainKeywords();
    
  result.all_priorities.forEach(kw => {
    const similarities = {
      hr: extractor.calculateSimilarity(kw.kw, domainKeywords.hr),
      technical: extractor.calculateSimilarity(kw.kw, domainKeywords.technical),
      design: extractor.calculateSimilarity(kw.kw, domainKeywords.design),
      finance: extractor.calculateSimilarity(kw.kw, domainKeywords.finance),
      ceo: extractor.calculateSimilarity(kw.kw, domainKeywords.ceo),
      team: extractor.calculateSimilarity(kw.kw, domainKeywords.team),
    };
  });
}
