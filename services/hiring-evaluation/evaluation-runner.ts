#!/usr/bin/env node

import fs from 'fs';
import path, { dirname } from 'path';
import http from 'http';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Core evaluation data structures based on actual Ollama responses
interface CriterionScore {
  score: number;
  reasoning: string;
}

interface PersonaEvaluation {
  persona: string;
  scores: Record<string, CriterionScore>;
  overall_assessment: {
    persona_score: number;
    recommendation: string;
  };
}

interface OllamaEvaluationResponse {
  evaluation_timestamp: string;
  model: string;
  candidate: string;
  evaluations: PersonaEvaluation[];
}

// Processed evaluation result
interface EvaluationResult {
  summary?: {
    composite_score?: number;
    overall_assessment?: string;
    key_recommendations?: string[];
  };
  composite_score?: number;
  matched_keywords?: string[];
  missing_keywords?: string[];
  key_strengths?: string[];
  personas?: string[];
  evaluations?: PersonaEvaluation[];
}

// Persona configuration from YAML files
interface PersonaCriterion {
  title: string;
  description: string;
  bullets: string[];
}

interface PersonaConfig {
  persona: {
    name: string;
    background: string[];
    evaluation_approach: string;
  };
  criteria: Record<string, PersonaCriterion>;
  evaluation: {
    focus: string;
    json_fields: string[];
  };
}

class EvaluationRunner {
  private baseDir: string;
  private applicationName: string;
  private ollamaUrl: string;
  private modelName: string;
  private fastModelName: string;
  private fastMode: boolean;
  private modelTemperatures: Record<string, number>;
  private personas: string[];
  private weights: Record<string, number>;
  constructor(applicationName = 'elovate-director-product-management') {
    this.baseDir = __dirname;
    this.applicationName = applicationName;
    this.ollamaUrl = 'http://localhost:11434';
    this.modelName = 'dolphin3:latest';        // Quality optimized: 170s, 9.0-10.0/10
    this.fastModelName = 'phi3:mini';           // Speed optimized: 140s, 7.0-8.0/10
    this.fastMode = false;
    // Per-model optimized temperature settings
    this.modelTemperatures = {
      'dolphin3:latest': 0.7,   // Higher temp for better variance in quality model
      'phi3:mini': 0.3,          // Lower temp for more focused output in fast model
    };
    this.personas = ['hr', 'technical', 'design', 'finance', 'ceo', 'team'];
    this.weights = {
      hr: 0.20,
      technical: 0.15,
      design: 0.15,
      finance: 0.20,
      ceo: 0.20,
      team: 0.10,
    };
  }

  setFastMode(enabled: boolean): void {
    this.fastMode = enabled;
    const selectedModel = enabled ? this.fastModelName : this.modelName;
    const temperature = this.modelTemperatures[selectedModel] || 0.1;
    console.log(`🚀 Fast mode ${enabled ? 'enabled' : 'disabled'}: using ${selectedModel} @ temperature ${temperature}`);
  }

  setModel(model: string): void {
    this.modelName = model;
    console.log(`🔧 Model set to: ${model}`);
  }

  loadFile(filePath: string): string {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      return content;
    } catch (error) {
      console.error(`Error loading file ${filePath}:`, error.message);
      throw error;
    }
  }

  saveFile(filePath: string, content: string): void {
    try {
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(filePath, content);
      console.log(`Saved: ${filePath}`);
    } catch (error) {
      console.error(`Error saving file ${filePath}:`, error.message);
      throw error;
    }
  }

  parseSimpleYaml(content: string): PersonaConfig {
    const data = { criteria: {} };
    const criteriaMatches = content.matchAll(/ {2}(\w+):\s*\n\s+title: "([^"]+)"/g);
    for (const match of criteriaMatches) {
      data.criteria[match[1]] = { title: match[2] };
    }
    return data;
  }

  callOllama(prompt: string, model: string = this.modelName, persona: string | null = null): Promise<string> {
    // Map persona keys to proper names for evaluation processor
    const personaNameMap = {
      'hr': 'HR Manager',
      'technical': 'Director of Engineering', 
      'design': 'Director of Design',
      'finance': 'Finance Director',
      'ceo': 'CEO',
      'team': 'Senior Product Manager',
    };

    const criteriaFields = {};
    const personaDisplayName = persona || 'Unknown';
        
    if (persona) {
      try {
        const yamlPath = path.join(__dirname, 'personas', `${persona}.yaml`);
        const personaData = this.parseSimpleYaml(fs.readFileSync(yamlPath, 'utf8'));
        const _personaDisplayName = personaNameMap[persona] || persona;
                
        // Build specific field properties for this persona
        for (const fieldName of Object.keys(personaData.criteria)) {
          criteriaFields[fieldName] = {
            type: 'object',
            properties: {
              score: { type: 'integer', minimum: 1, maximum: 10 },
              reasoning: { type: 'string', maxLength: 300 },
            },
            required: ['score', 'reasoning'],
          };
        }
      } catch (error) {
        console.log('Could not load persona criteria, using generic schema');
      }
    }

    // Define JSON schema for structured output (no persona field - we'll inject it)
    const evaluationSchema = {
      type: 'object',
      properties: {
        scores: {
          type: 'object',
          properties: criteriaFields,
          additionalProperties: false,
          required: Object.keys(criteriaFields),  // Require all criteria
        },
        overall_assessment: {
          type: 'object',
          properties: {
            persona_score: { type: 'number', minimum: 1.0, maximum: 10.0 },
            recommendation: { type: 'string', maxLength: 200 },
          },
          required: ['persona_score', 'recommendation'],
        },
      },
      required: ['scores', 'overall_assessment'],
    };

    return new Promise((resolve, reject) => {
      const selectedModel = this.fastMode ? this.fastModelName : model;
      // Get optimized temperature for the selected model
      const temperature = this.modelTemperatures[selectedModel] || 0.1;
            
      const postData = JSON.stringify({
        model: selectedModel,
        prompt: prompt,
        stream: false,
        format: evaluationSchema,
        options: {
          temperature: temperature,
          top_p: 0.9,
          repeat_penalty: 1.1,
          max_tokens: 4000,
          num_ctx: 12288,
        },
      });

      const options = {
        hostname: 'localhost',
        port: 11434,
        path: '/api/generate',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
        },
      };

      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          try {
            const response = JSON.parse(data);
            resolve(response.response);
          } catch (error) {
            reject(new Error(`Failed to parse Ollama response: ${error.message}`));
          }
        });
      });

      // Set a 5-minute timeout for complex evaluations
      req.setTimeout(300000, () => {
        req.destroy();
        reject(new Error('Request timeout after 5 minutes'));
      });

      req.on('error', (error) => {
        reject(new Error(`Ollama request failed: ${error.message}`));
      });

      req.write(postData);
      req.end();
    });
  }

  async loadApplicationMaterials() {
    const applicationPath = path.join(this.baseDir, '..', '..', '..', 'data', 'applications', this.applicationName);
    const jobPosting = await this.loadFile(path.join(applicationPath, 'inputs', 'job-posting.md'));
    const resumeRaw = await this.loadFile(path.join(applicationPath, 'inputs', 'resume.json'));
    const resume = JSON.parse(resumeRaw);
    return { jobPosting, resume };
  }

  async loadPrompt(persona: string, provider: string = 'claude'): Promise<string> {
    // Generate prompt from YAML configuration
    const { generatePrompt } = await import('./generate-prompt.js');
    return generatePrompt(persona);
  }

  async preparePrompt(persona: string, provider: string = 'claude'): Promise<string> {
    const { default: KeywordExtractor } = await import('./keyword-extractor.js');
    const extractor = new KeywordExtractor();
        
    const { jobPosting, resume } = await this.loadApplicationMaterials();
    const promptTemplate = await this.loadPrompt(persona, provider);
        
    // Extract keywords and generate persona-specific context
    const keywordPath = path.join(this.baseDir, '..', '..', '..', 'data', 'applications', this.applicationName, 'working', 'keyword_analysis.json');
    const keywords = extractor.extractPriorityKeywords(keywordPath);
        
    let personaContext = '';
    const keywordMap = {
      'hr': keywords.hr_keywords,
      'technical': keywords.technical_keywords,
      'design': keywords.design_keywords,
      'finance': keywords.finance_keywords,
      'ceo': keywords.ceo_keywords,
      'team': keywords.team_keywords,
    };
        
    if (keywordMap[persona]) {
      personaContext = extractor.generateContextPrompt(keywordMap[persona]);
    }
        
    // Replace placeholders
    const prompt = promptTemplate
      .replace('{job_posting}', jobPosting)
      .replace('{resume}', JSON.stringify(resume, null, 2))
      .replace('## Job Posting:', personaContext + '\n## Job Posting:');
        
    return prompt;
  }

  parseJSON(text: string): PersonaEvaluation {
    try {
      // Remove <think> tags if present
      const cleanText = text.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
            
      // If the response is already clean JSON, try parsing it directly
      if (cleanText.startsWith('{') && cleanText.endsWith('}')) {
        try {
          return JSON.parse(cleanText);
        } catch (e) {
          // Continue to other methods if direct parsing fails
        }
      }
            
      // Try markdown code blocks
      const jsonBlockMatch = cleanText.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonBlockMatch) {
        return JSON.parse(jsonBlockMatch[1]);
      }
            
      // Fallback: basic start/end extraction for nested JSON
      const jsonStart = cleanText.indexOf('{');
      const jsonEnd = cleanText.lastIndexOf('}') + 1;
            
      if (jsonStart !== -1 && jsonEnd > jsonStart) {
        const jsonStr = cleanText.substring(jsonStart, jsonEnd);
        return JSON.parse(jsonStr);
      }
            
      throw new Error('No valid JSON found in response');
    } catch (error) {
      console.error('Failed to parse JSON:', error.message);
      console.error('Response text (first 200 chars):', text.substring(0, 200));
      console.error('Response text (last 200 chars):', text.substring(Math.max(0, text.length - 200)));
      throw error;
    }
  }

  async evaluatePersona(persona: string, provider: string = 'ollama'): Promise<PersonaEvaluation> {
    console.log(`Evaluating ${persona} persona with ${provider}...`);
        
    try {
      const prompt = await this.preparePrompt(persona, provider);
            
      if (provider === 'ollama') {
        // DEBUG: Show exact prompt being sent
        console.log(`\n=== ${persona.toUpperCase()} PROMPT SENT ===`);
        console.log(prompt.substring(0, 500) + '...');
        console.log(`[Total prompt length: ${prompt.length} chars]`);
                
        const response = await this.callOllama(prompt, this.modelName, persona);
                
        // DEBUG: Show raw response received  
        console.log(`\n=== ${persona.toUpperCase()} RAW RESPONSE ===`);
        console.log(response);
        console.log(`=== END ${persona.toUpperCase()} RESPONSE ===\n`);
                
        const parsed = this.parseJSON(response);
                
        // Inject the correct persona name (system knows this, don't ask LLM)
        const personaNameMap = {
          'hr': 'HR Manager',
          'technical': 'Director of Engineering', 
          'design': 'Director of Design',
          'finance': 'Finance Director',
          'ceo': 'CEO',
          'team': 'Senior Product Manager',
        };
                
        parsed.persona = personaNameMap[persona] || persona;
        console.log('Parsed result:', JSON.stringify(parsed, null, 2));
        return parsed;
      } else {
        throw new Error(`Unsupported provider: ${provider}`);
      }
    } catch (error) {
      console.error(`Error evaluating ${persona} persona:`, error.message);
      throw error;
    }
  }

  calculatePersonaScore(scores: Record<string, CriterionScore>): number {
    if (!scores || typeof scores !== 'object') {
      console.error('Invalid scores object:', scores);
      throw new Error('Scores object is invalid');
    }
    const values = Object.values(scores).map(s => {
      if (!s || typeof s.score !== 'number') {
        console.error('Invalid score item:', s);
        throw new Error('Score item is invalid');
      }
      return s.score;
    });
    return values.reduce((sum, score) => sum + score, 0) / values.length;
  }

  calculateCompositeScore(evaluations: Record<string, PersonaEvaluation>): number {
    let composite = 0;
    for (const persona of this.personas) {
      const personaScore = this.calculatePersonaScore(evaluations[persona].scores);
      composite += personaScore * this.weights[persona];
    }
    return composite;
  }

  async runEvaluation(candidateName: string | null = null): Promise<EvaluationResult> {
    console.log('Starting candidate evaluation...');
        
    // Load application materials to get candidate name if not provided
    if (!candidateName) {
      const { resume } = await this.loadApplicationMaterials();
      candidateName = resume.basics?.name || 'Candidate';
    }
        
    console.log(`📋 Evaluating: ${candidateName}`);
        
    // Run all personas in parallel for faster evaluation
    console.log(`🚀 Running ${this.personas.length} persona evaluations in parallel...`);
        
    const evaluationPromises = this.personas.map(async (persona) => {
      try {
        console.log(`🔄 Starting ${persona} evaluation...`);
        const evaluation = await this.evaluatePersona(persona, 'ollama');
        console.log(`✓ ${persona} persona completed`);
        return evaluation;
      } catch (error) {
        console.error(`✗ ${persona} persona failed:`, error.message);
        throw new Error(`${persona} evaluation failed: ${error.message}`);
      }
    });
        
    const evaluations = await Promise.all(evaluationPromises);
        
    // Process results with our enhanced evaluation processor
    const { processEvaluationResults } = await import('./evaluation-processor.js');
    const summary = processEvaluationResults(evaluations, candidateName);
        
    // Save raw results
    const results = {
      evaluation_timestamp: new Date().toISOString(),
      model: this.modelName,
      candidate: candidateName,
      evaluations: evaluations,
    };
        
    const applicationPath = path.join(this.baseDir, '..', '..', '..', 'data', 'applications', this.applicationName);
        
    await this.saveFile(
      path.join(applicationPath, 'working', 'evaluation-results.json'),
      JSON.stringify(results, null, 2),
    );
        
    // Save markdown summary to working directory (not outputs)
    await this.saveFile(
      path.join(applicationPath, 'working', `${candidateName.toLowerCase().replace(/\s+/g, '-')}-evaluation.md`),
      summary,
    );
        
    console.log(`✅ Evaluation completed for ${candidateName}`);
    console.log(`📊 Results saved to data/applications/${this.applicationName}/working/evaluation-results.json`);
    console.log(`📝 Summary saved to data/applications/${this.applicationName}/working/${candidateName.toLowerCase().replace(/\s+/g, '-')}-evaluation.md`);
        
    return { rawResults: results, summary: summary };
  }

  // Main CLI interface
  async run(candidateName: string): Promise<void> {
    try {
      const results = await this.runEvaluation(candidateName);
      console.log('\n🎉 Evaluation completed successfully!');
      return results;
    } catch (error) {
      console.error('❌ Evaluation failed:', error.message);
      throw error;
    }
  }

}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const applicationName = process.argv[2] || 'elovate-director-product-management';
  const candidateName = process.argv[3];
    
  const evaluator = new EvaluationRunner(applicationName);
    
  evaluator.run(candidateName)
    .then(() => {
      console.log('✅ Process completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Process failed:', error.message);
      process.exit(1);
    });
}

export default EvaluationRunner;
