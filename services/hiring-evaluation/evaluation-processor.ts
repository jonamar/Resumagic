/**
 * Evaluation Processing Function
 * Processes 6-persona hiring evaluation results and generates accurate Markdown summaries
 */

interface EvaluationCriterion {
  score: number;
  reasoning: string;
}

interface Evaluation {
  persona: string;
  scores: Record<string, EvaluationCriterion>;
  overall_assessment?: {
    persona_score?: number;
    recommendation?: string;
  };
}

interface ProcessedPersonaData {
  persona: string;
  criterionNames: string[];
  criterionScores: number[];
  calculatedAverage: number;
  llmAverage: number | null;
  weight: number;
  recommendation: string;
}

interface AssessmentLevel {
  level: string;
  emoji: string;
  recommendation: string;
}

interface QualitativeInsights {
  strengths: Array<{
    persona: string;
    insight: string;
    score: number;
  }>;
  concerns: Array<{
    persona: string;
    insight: string;
    score: number;
  }>;
  specificExamples: string[];
  consensusThemes: Array<{
    theme: string;
    evaluations: Array<{
      persona: string;
      criterion: string;
      reasoning: string;
    }>;
  }>;
}

interface Insights {
  strongest: string;
  strongestScore: number;
  weakest: string;
  weakestScore: number;
  variance: number;
  consensusLevel: string;
  qualitative: QualitativeInsights;
}

class EvaluationProcessor {
  private weights: Record<string, number>;
  private thresholds: Record<string, number>;

  constructor() {
    // Persona weights for composite scoring
    this.weights = {
      'HR Manager': 0.20,
      'Director of Engineering': 0.15,
      'Director of Design': 0.15,
      'Finance Director': 0.20,
      'CEO': 0.20,
      'Senior Product Manager': 0.10,
    };

    // Score thresholds for assessment
    this.thresholds = {
      exceptional: 8.5,
      viable: 8.0,
      belowViable: 7.0,
      weak: 5.0,
    };
  }

  /**
     * Process array of evaluation JSON objects into Markdown summary
     * @param {Array} evaluations - Array of 6 evaluation JSON objects
     * @param {string} candidateName - Name of the candidate
     * @returns {string} Formatted Markdown summary
     */
  processEvaluations(evaluations: Evaluation[], candidateName = 'Candidate'): string {
    if (!evaluations || evaluations.length !== 6) {
      throw new Error('Expected exactly 6 evaluation objects');
    }

    const processedData = this.extractAndCalculateScores(evaluations);
    const finalScore = this.calculateWeightedComposite(processedData);
    const assessment = this.getAssessmentLevel(finalScore);
    const insights = this.generateInsights(processedData, evaluations);

    return this.generateMarkdownSummary(candidateName, finalScore, assessment, processedData, insights);
  }

  /**
     * Extract sub-scores and calculate accurate persona averages
     * @param {Array} evaluations - Raw evaluation objects
     * @returns {Array} Processed data with accurate calculations
     */
  extractAndCalculateScores(evaluations: Evaluation[]): ProcessedPersonaData[] {
    return evaluations.map(evaluation => {
      const personaName = this.extractPersonaName(evaluation.persona);
      const scores = evaluation.scores;
            
      // Extract individual criterion scores
      const criterionScores = Object.values(scores).map(criterion => criterion.score);
            
      // Calculate accurate average (ignore LLM's math)
      const calculatedAverage = criterionScores.reduce((sum, score) => sum + score, 0) / criterionScores.length;
            
      // Get criterion names for display
      const criterionNames = Object.keys(scores);

      return {
        persona: personaName,
        criterionNames,
        criterionScores,
        calculatedAverage: Math.round(calculatedAverage * 100) / 100, // Round to 2 decimals
        llmAverage: evaluation.overall_assessment?.persona_score || null,
        weight: this.weights[personaName] || 0,
        recommendation: evaluation.overall_assessment?.recommendation || 'Unknown',
      };
    });
  }

  /**
     * Extract clean persona name from full persona string
     * @param {string} personaString - Full persona description
     * @returns {string} Clean persona name
     */
  extractPersonaName(personaString: string): string {
    if (personaString.includes('HR Manager')) {
      return 'HR Manager';
    }
    if (personaString.includes('Director of Engineering')) {
      return 'Director of Engineering';
    }
    if (personaString.includes('Director of Design')) {
      return 'Director of Design';
    }
    if (personaString.includes('Finance Director')) {
      return 'Finance Director';
    }
    if (personaString.includes('CEO')) {
      return 'CEO';
    }
    if (personaString.includes('Senior Product Manager')) {
      return 'Senior Product Manager';
    }
    return personaString; // Fallback
  }

  /**
     * Calculate weighted composite score
     * @param {Array} processedData - Processed evaluation data
     * @returns {number} Final weighted score
     */
  calculateWeightedComposite(processedData: ProcessedPersonaData[]): number {
    const weightedSum = processedData.reduce((sum, persona) => {
      return sum + (persona.calculatedAverage * persona.weight);
    }, 0);
        
    return Math.round(weightedSum * 100) / 100; // Round to 2 decimals
  }

  /**
     * Determine assessment level based on score
     * @param {number} score - Final composite score
     * @returns {Object} Assessment details
     */
  getAssessmentLevel(score: number): AssessmentLevel {
    if (score >= this.thresholds.exceptional) {
      return { level: 'Exceptional Candidate', emoji: '🌟', recommendation: 'Strong hire recommendation' };
    } else if (score >= this.thresholds.viable) {
      return { level: 'Viable Candidate', emoji: '✅', recommendation: 'Competitive candidate' };
    } else if (score >= this.thresholds.belowViable) {
      return { level: 'Below Viable', emoji: '⚠️', recommendation: 'Some strengths but significant gaps' };
    } else if (score >= this.thresholds.weak) {
      return { level: 'Weak Candidate', emoji: '❌', recommendation: 'Not recommended' };
    } else {
      return { level: 'Poor Candidate', emoji: '🚫', recommendation: 'Strong rejection' };
    }
  }

  /**
     * Generate insights based on score patterns and qualitative feedback
     * @param {Array} processedData - Processed evaluation data
     * @param {Array} evaluations - Original evaluation objects with reasoning
     * @returns {Object} Insights object
     */
  generateInsights(processedData: ProcessedPersonaData[], evaluations: Evaluation[]): Insights {
    const scores = processedData.map(p => p.calculatedAverage);
    const maxScore = Math.max(...scores);
    const minScore = Math.min(...scores);
    const variance = maxScore - minScore;

    // Find strongest and weakest personas
    const strongest = processedData.find(p => p.calculatedAverage === maxScore);
    const weakest = processedData.find(p => p.calculatedAverage === minScore);

    // Determine consensus level
    let consensusLevel;
    if (variance <= 0.5) {
      consensusLevel = 'High';
    } else if (variance <= 1.0) {
      consensusLevel = 'Medium';
    } else {
      consensusLevel = 'Low';
    }

    // Extract qualitative insights
    const qualitativeInsights = this.extractQualitativeInsights(evaluations, processedData);

    return {
      strongest: strongest.persona,
      strongestScore: strongest.calculatedAverage,
      weakest: weakest.persona,
      weakestScore: weakest.calculatedAverage,
      variance: Math.round(variance * 100) / 100,
      consensusLevel,
      qualitative: qualitativeInsights,
    };
  }

  /**
     * Extract and organize qualitative insights from reasoning text
     * @param {Array} evaluations - Original evaluation objects
     * @param {Array} processedData - Processed evaluation data for scoring context
     * @returns {Object} Organized qualitative insights
     */
  extractQualitativeInsights(evaluations: Evaluation[], processedData: ProcessedPersonaData[]): QualitativeInsights {
    const strengths = [];
    const concerns = [];
    const specificExamples = [];
    const themeMap = new Map();

    evaluations.forEach((evaluation, index) => {
      const persona = processedData[index].persona;
      const scores = evaluation.scores;

      // Extract reasoning from each criterion
      Object.entries(scores).forEach(([criterion, data]) => {
        const reasoning = data.reasoning || '';
        const score = data.score;

        // Extract key insights based on actual reasoning sentiment, not just score
        const sentimentType = this.detectReasoningSentiment(reasoning);
                
        if (score >= 8 || sentimentType === 'positive') {
          const insight = this.extractKeyInsight(reasoning, 'positive');
          if (insight) {
            strengths.push({
              theme: this.categorizeTheme(criterion),
              insight: insight,
              persona: persona,
              score: score,
            });
          }
        } else if (score <= 5 && sentimentType === 'negative') {
          const insight = this.extractKeyInsight(reasoning, 'negative');
          if (insight) {
            concerns.push({
              theme: this.categorizeTheme(criterion),
              insight: insight,
              persona: persona,
              score: score,
            });
          }
        }

        // Extract specific examples (numbers, companies, achievements)
        const examples = this.extractSpecificExamples(reasoning);
        if (examples.length > 0) {
          specificExamples.push(...examples);
        }

        // Track themes for consensus analysis
        const theme = this.categorizeTheme(criterion);
        if (!themeMap.has(theme)) {
          themeMap.set(theme, []);
        }
        themeMap.get(theme).push({ persona, score, reasoning });
      });
    });

    // Analyze consensus themes
    const consensusThemes = this.analyzeConsensusThemes(themeMap);

    return {
      strengths: this.dedupAndRankInsights(strengths),
      concerns: this.dedupAndRankInsights(concerns),
      specificExamples: [...new Set(specificExamples)].slice(0, 5), // Top 5 unique examples
      consensusThemes: consensusThemes,
    };
  }

  /**
     * Detect sentiment of reasoning text
     * @param {string} reasoning - Reasoning text to analyze
     * @returns {string} 'positive', 'negative', or 'neutral'
     */
  detectReasoningSentiment(reasoning) {
    if (!reasoning) {
      return 'neutral';
    }
        
    const text = reasoning.toLowerCase();
        
    // Strong positive indicators
    const positiveWords = [
      'strong', 'excellent', 'exceptional', 'proven', 'successful', 'effective', 
      'demonstrates', 'achieved', 'aligns well', 'good', 'solid', 'experience',
      'track record', 'proficiency', 'relevant', 'capabilities', 'foundation',
    ];
        
    // Strong negative indicators  
    const negativeWords = [
      'lacks', 'limited', 'missing', 'insufficient', 'concerns', 'gap', 'weak',
      'no evidence', 'does not', 'cannot', 'unclear', 'inadequate', 'poor',
    ];
        
    const positiveCount = positiveWords.filter(word => text.includes(word)).length;
    const negativeCount = negativeWords.filter(word => text.includes(word)).length;
        
    if (positiveCount > negativeCount && positiveCount > 0) {
      return 'positive';
    } else if (negativeCount > positiveCount && negativeCount > 0) {
      return 'negative';
    }
        
    return 'neutral';
  }

  /**
     * Extract key insight from reasoning text
     * @param {string} reasoning - Reasoning text
     * @param {string} type - 'positive' or 'negative'
     * @returns {string|null} Extracted insight
     */
  extractKeyInsight(reasoning, type) {
    if (!reasoning || reasoning.length < 20) {
      return null;
    }

    // Split into sentences and find the most informative one
    const sentences = reasoning.split(/[.!?]+/).filter(s => s.trim().length > 15);
        
    if (type === 'positive') {
      // Look for positive indicators
      const positiveWords = ['strong', 'excellent', 'exceptional', 'proven', 'successful', 'effective', 'demonstrates', 'achieved'];
      const positiveSentence = sentences.find(s => 
        positiveWords.some(word => s.toLowerCase().includes(word)),
      );
      return positiveSentence ? positiveSentence.trim() : sentences[0]?.trim();
    } else {
      // Look for negative indicators
      const negativeWords = ['lacks', 'limited', 'missing', 'insufficient', 'concerns', 'gap', 'weak', 'no evidence'];
      const negativeSentence = sentences.find(s => 
        negativeWords.some(word => s.toLowerCase().includes(word)),
      );
      return negativeSentence ? negativeSentence.trim() : sentences[0]?.trim();
    }
  }

  /**
     * Extract specific examples (numbers, companies, achievements)
     * @param {string} reasoning - Reasoning text
     * @returns {Array} Array of specific examples
     */
  extractSpecificExamples(reasoning) {
    const examples = [];
        
    // Extract monetary values
    const moneyMatches = reasoning.match(/CAD?\s*\$[\d.,]+[MBK]?/gi);
    if (moneyMatches) {
      examples.push(...moneyMatches);
    }

    // Extract percentages
    const percentMatches = reasoning.match(/\d+(\.\d+)?%/g);
    if (percentMatches) {
      examples.push(...percentMatches);
    }

    // Extract large numbers with context
    const numberMatches = reasoning.match(/\b\d{1,3}[,\d]*\+?\s*(?:users|engineers|artists|deployments|companies|years)\b/gi);
    if (numberMatches) {
      examples.push(...numberMatches);
    }

    // Extract company names
    const companyMatches = reasoning.match(/\b(?:Meta|Google|Apple|Microsoft|Amazon|Spotify|Airbnb|Netflix|Tesla|Uber|LinkedIn|Twitter|Facebook|Instagram|WhatsApp|YouTube|TikTok|Snapchat|Pinterest|Reddit|Slack|Zoom|Shopify|Square|PayPal|Stripe|Salesforce|Oracle|SAP|Adobe|IBM|Intel|NVIDIA|AMD|Qualcomm|Cisco|VMware|ServiceNow|Workday|Atlassian|MongoDB|Snowflake|Datadog|Splunk|CrowdStrike|Okta|Twilio|SendGrid|Mailchimp|HubSpot|Zendesk|Freshworks|Canva|Figma|Notion|Airtable|Asana|Trello|Monday|GitLab|GitHub|BitBucket|Jenkins|Docker|Kubernetes|AWS|Azure|GCP|Heroku|Vercel|Netlify|CloudFlare|DigitalOcean|Linode|Vultr)\b/gi);
    if (companyMatches) {
      examples.push(...companyMatches);
    }

    return examples.slice(0, 3); // Limit per reasoning block
  }

  /**
     * Categorize criterion into broader themes
     * @param {string} criterion - Criterion name
     * @returns {string} Theme category
     */
  categorizeTheme(criterion) {
    const themeMap = {
      'experience_match': 'Experience',
      'cultural_fit': 'Culture',
      'qualification_alignment': 'Qualifications',
      'communication_skills': 'Communication',
      'technical_depth': 'Technical',
      'architecture_thinking': 'Technical',
      'problem_solving': 'Problem Solving',
      'technical_leadership': 'Leadership',
      'user_centered_thinking': 'User Focus',
      'design_collaboration': 'Collaboration',
      'product_craft': 'Product Quality',
      'cross_functional_leadership': 'Leadership',
      'business_impact_roi': 'Business Impact',
      'financial_acumen': 'Business Acumen',
      'resource_management': 'Management',
      'growth_strategy': 'Strategy',
      'strategic_vision_execution': 'Strategy',
      'leadership_culture_fit': 'Leadership',
      'market_customer_focus': 'Market Understanding',
      'organizational_impact': 'Organizational',
      'management_mentorship': 'Management',
      'communication_collaboration': 'Collaboration',
      'practical_leadership': 'Leadership',
      'professional_development': 'Development',
    };
        
    return themeMap[criterion] || 'Other';
  }

  /**
     * Analyze consensus across themes
     * @param {Map} themeMap - Map of themes to evaluations
     * @returns {Array} Consensus analysis
     */
  analyzeConsensusThemes(themeMap) {
    const consensus = [];
        
    themeMap.forEach((evaluations, theme) => {
      if (evaluations.length >= 3) { // Theme mentioned by 3+ personas
        const scores = evaluations.map(e => e.score);
        const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
        const variance = Math.max(...scores) - Math.min(...scores);
                
        const level = variance <= 1 ? 'Strong consensus' : variance <= 2 ? 'Moderate consensus' : 'Mixed opinions';
        const sentiment = avgScore >= 7 ? '✅' : avgScore >= 5 ? '⚠️' : '❌';
                
        consensus.push({
          theme,
          level,
          sentiment,
          avgScore: Math.round(avgScore * 10) / 10,
          personaCount: evaluations.length,
        });
      }
    });
        
    return consensus.sort((a, b) => b.personaCount - a.personaCount);
  }

  /**
     * Deduplicate and rank insights
     * @param {Array} insights - Array of insights
     * @returns {Array} Top ranked unique insights
     */
  dedupAndRankInsights(insights) {
    // Remove very similar insights
    const unique = [];
    insights.forEach(insight => {
      const isDuplicate = unique.some(existing => 
        this.calculateSimilarity(insight.insight, existing.insight) > 0.7,
      );
      if (!isDuplicate) {
        unique.push(insight);
      }
    });
        
    // Sort by score (highest first for strengths, lowest first for concerns)
    return unique.sort((a, b) => b.score - a.score).slice(0, 5);
  }

  /**
     * Calculate text similarity (simple word overlap)
     * @param {string} text1 - First text
     * @param {string} text2 - Second text
     * @returns {number} Similarity score 0-1
     */
  calculateSimilarity(text1, text2) {
    const words1 = new Set(text1.toLowerCase().split(/\W+/));
    const words2 = new Set(text2.toLowerCase().split(/\W+/));
    const intersection = new Set([...words1].filter(word => words2.has(word)));
    const union = new Set([...words1, ...words2]);
    return intersection.size / union.size;
  }

  /**
     * Generate formatted Markdown summary
     * @param {string} candidateName - Candidate name
     * @param {number} finalScore - Calculated final score
     * @param {Object} assessment - Assessment level details
     * @param {Array} processedData - Processed evaluation data
     * @param {Object} insights - Generated insights
     * @returns {string} Formatted Markdown
     */
  generateMarkdownSummary(candidateName: string, finalScore: number, assessment: AssessmentLevel, processedData: ProcessedPersonaData[], insights: Insights): string {
    let markdown = `# Candidate Evaluation Summary: ${candidateName}\n\n`;
        
    // Overall Result
    markdown += '## Overall Result\n';
    markdown += `**Final Score: ${finalScore}/10** - ${assessment.level} ${assessment.emoji}\n\n`;
        
    // Detailed Breakdown Table
    markdown += '## Detailed Breakdown\n\n';
    markdown += '| Persona | Criterion 1 | Criterion 2 | Criterion 3 | Criterion 4 | **Avg** | Weight | **Weighted** |\n';
    markdown += '|---------|-------------|-------------|-------------|-------------|---------|--------|--------------|\n';
        
    processedData.forEach(persona => {
      const scores = persona.criterionScores.map(s => s.toString()).join(' | ');
      const weightedScore = Math.round(persona.calculatedAverage * persona.weight * 100) / 100;
      const weightPercent = Math.round(persona.weight * 100) + '%';
            
      markdown += `| ${persona.persona} | ${scores} | **${persona.calculatedAverage}** | ${weightPercent} | **${weightedScore}** |\n`;
    });
        
    markdown += `| | | | | | | **Total** | **${finalScore}** |\n\n`;
        
    // Key Insights
    markdown += '## Key Insights\n';
    markdown += `- **Strongest Evaluation**: ${insights.strongest} (${insights.strongestScore}/10)\n`;
    markdown += `- **Areas of Concern**: ${insights.weakest} (${insights.weakestScore}/10)\n`;
    markdown += `- **Consensus Level**: ${insights.consensusLevel} (${insights.variance} point variance)\n`;
    markdown += `- **Assessment**: ${assessment.recommendation}\n\n`;

    // Qualitative Insights
    if (insights.qualitative) {
      markdown += '## Qualitative Insights\n\n';
            
      // Strengths Highlighted
      if (insights.qualitative.strengths.length > 0) {
        markdown += '### Strengths Highlighted\n';
        insights.qualitative.strengths.forEach(strength => {
          markdown += `- **${strength.theme}**: "${strength.insight}" (${strength.persona})\n`;
        });
        markdown += '\n';
      }
            
      // Concerns Raised
      if (insights.qualitative.concerns.length > 0) {
        markdown += '### Concerns Raised\n';
        insights.qualitative.concerns.forEach(concern => {
          markdown += `- **${concern.theme}**: "${concern.insight}" (${concern.persona})\n`;
        });
        markdown += '\n';
      }
            
      // Specific Examples
      if (insights.qualitative.specificExamples.length > 0) {
        markdown += '### Key Achievements/Metrics\n';
        insights.qualitative.specificExamples.forEach(example => {
          markdown += `- ${example}\n`;
        });
        markdown += '\n';
      }
            
      // Consensus Themes
      if (insights.qualitative.consensusThemes.length > 0) {
        markdown += '### Consensus Themes\n';
        insights.qualitative.consensusThemes.forEach(theme => {
          markdown += `- ${theme.sentiment} **${theme.theme}**: ${theme.level} (${theme.personaCount} personas, avg ${theme.avgScore}/10)\n`;
        });
        markdown += '\n';
      }
    }
        
    // Recommendations by Persona
    markdown += '## Persona Recommendations\n';
    processedData.forEach(persona => {
      markdown += `- **${persona.persona}**: ${persona.recommendation}\n`;
    });
        
    return markdown;
  }
}

// Example usage function
function processEvaluationResults(evaluationsArray: Evaluation[], candidateName: string): string {
  const processor = new EvaluationProcessor();
  return processor.processEvaluations(evaluationsArray, candidateName);
}

export { EvaluationProcessor, processEvaluationResults };

// If running directly, provide usage example
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('Evaluation Processor created successfully!');
  console.log("Usage: import { processEvaluationResults } from './evaluation-processor.js';");
  console.log("const summary = processEvaluationResults(evaluationsArray, 'Candidate Name');");
}
