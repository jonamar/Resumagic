#!/usr/bin/env node
// @ts-nocheck

import fs from 'fs';
import http from 'http';

// Keyword extraction interfaces based on actual data structures
interface KeywordItem {
  kw: string;
  role: 'core' | 'industry_experience' | 'functional_skills' | 'culture';
  source?: string;
  originalYears?: string;
  originalDescription?: string;
}

interface KeywordSet {
  keywords: KeywordItem[];
}

interface ExperienceMatch {
  years: string;
  description: string;
  confidence: number;
}

class KeywordExtractionService {
  private ollamaUrl: string;
  private modelName: string;

  constructor() {
    this.ollamaUrl = 'http://localhost:11434';
    this.modelName = 'dolphin3:latest';
  }

  async extractKeywords(jobPostingPath: string, outputPath: string): Promise<KeywordSet> {
    try {
      console.log('🔍 Loading job posting...');
      const jobPosting = fs.readFileSync(jobPostingPath, 'utf8');
            
      console.log('🤖 Extracting keywords with Dolphin...');
      const prompt = this.buildExtractionPrompt(jobPosting);
      const response = await this.callOllama(prompt);
      const keywords = this.parseJSON(response);
            
      console.log('🔧 Validating and fixing experience requirements...');
      const validatedKeywords = this.validateExperienceRequirements(keywords, jobPosting);
      const cleanedKeywords = this.stripDegreesNotInPosting(validatedKeywords, jobPosting);
            
      console.log('💾 Saving keywords...');
      fs.writeFileSync(outputPath, JSON.stringify(cleanedKeywords, null, 2));
            
      console.log(`✅ Keywords extracted and saved to: ${outputPath}`);
      console.log(`📊 Extracted ${cleanedKeywords.keywords.length} keywords`);
            
      // Summary
      const categories = cleanedKeywords.keywords.reduce<Record<KeywordItem['role'], number>>((acc, kw) => {
        const current = acc[kw.role] ?? 0;
        acc[kw.role] = current + 1;
        return acc;
      }, { core: 0, industry_experience: 0, functional_skills: 0, culture: 0 });
            
      console.log('📋 Category breakdown:');
      Object.entries(categories).forEach(([role, count]) => {
        console.log(`  - ${role}: ${count} keywords`);
      });
            
      return validatedKeywords;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('❌ Keyword extraction failed:', message);
      throw new Error(message);
    }
  }

  validateExperienceRequirements(keywords: KeywordSet, jobPosting: string): KeywordSet {
    console.log('  🔍 Extracting experience requirements from job posting...');
        
    // Extract all experience requirements directly from job posting
    const experiencePatterns = [
      // Standard patterns: "7+ years", "5-8 years", "minimum 4 years"
      /(\d+)\+?\s*years?\s+(?:of\s+|in\s+|with\s+|as\s+|managing\s+|leading\s+)?([^.]{15,150})/gi,
      /(minimum|at least|minimum of)\s+(\d+)\+?\s*years?\s+(?:of\s+|in\s+|with\s+|as\s+|managing\s+|leading\s+)?([^.]{15,150})/gi,
      /(\d+)\s*[-–]\s*(\d+)\s*years?\s+(?:of\s+|in\s+|with\s+|as\s+|managing\s+|leading\s+)?([^.]{15,150})/gi,
    ];

    const directExtractions: KeywordItem[] = [];
        
    for (const pattern of experiencePatterns) {
      let match;
      while ((match = pattern.exec(jobPosting)) !== null) {
        let years: string;
        let description: string;
                
        if (match[1] === 'minimum' || match[1] === 'at least' || match[1] === 'minimum of') {
          years = match[2];
          description = match[3];
        } else if (match[2] && !isNaN(match[2])) {
          // Range pattern like "5-8 years"
          years = match[1] + '-' + match[2];
          description = match[3];
        } else {
          years = match[1];
          description = match[2];
        }
                
        if (description && description.trim().length > 10) {
          const cleanDesc = description.trim()
            .replace(/[.,;:].*$/, '') // Remove everything after first punctuation
            .replace(/\s+/g, ' ')      // Normalize whitespace
            .trim();
                    
          const fullRequirement = `${years}+ years ${cleanDesc}`;
                    
          directExtractions.push({
            kw: fullRequirement,
            role: 'core',
            source: 'direct_extraction',
            originalYears: years,
            originalDescription: cleanDesc,
          });
        }
      }
    }
        
    if (directExtractions.length > 0) {
      console.log(`  ✅ Found ${directExtractions.length} experience requirements directly`);
            
      // Find and replace/add experience requirements
      const result: KeywordSet = { keywords: [...keywords.keywords] };
      const experienceKeywords = new Set<string>();
            
      // Remove LLM-extracted experience requirements that might be corrupted
      result.keywords = result.keywords.filter(kw => {
        const isExperienceKeyword = /\d+\+?\s*years?\s+(?:in|of|with|as|managing|leading)/i.test(kw.kw);
        if (isExperienceKeyword) {
          experienceKeywords.add(kw.kw.toLowerCase());
          console.log(`  🗑️  Removing potentially corrupted: "${kw.kw}"`);
          return false;
        }
        return true;
      });
            
      // Add direct extractions
      for (const extraction of directExtractions) {
        if (!experienceKeywords.has(extraction.kw.toLowerCase())) {
          result.keywords.push(extraction);
          console.log(`  ✅ Added validated requirement: "${extraction.kw}"`);
        }
      }
            
      return result;
    } else {
      console.log('  ℹ️  No experience requirements found to validate');
      return keywords;
    }
  }

  // New: strict validator to strip degree requirements not present in posting
  stripDegreesNotInPosting(keywords: KeywordSet, jobPosting: string): KeywordSet {
    const degreeRegex = /(degree|bachelor|master|mba|phd|computer\s+science)/i;
    const postingHasDegree = degreeRegex.test(jobPosting);
    if (postingHasDegree) {
      return keywords;
    }
    const filtered = {
      keywords: keywords.keywords.filter(k => {
        const isDegree = degreeRegex.test(k.kw);
        return !isDegree;
      }),
    };
    if (filtered.keywords.length !== keywords.keywords.length) {
      console.log('  ✅ Removed degree keywords not present in posting');
    }
    return filtered;
  }

  buildExtractionPrompt(jobPosting: string): string {
    return `# Keyword Extraction Task

You are an expert at analyzing job postings and extracting the most important keywords for resume optimization. Your task is to read this job posting carefully and identify all the critical requirements, skills, and qualifications.

## Your Task:
1. Read the job posting thoroughly
2. Identify all important keywords and phrases
3. Keep related concepts together (e.g., "extensive travel up to 50%", "5+ years product management experience")
4. Categorize each keyword appropriately
5. Output structured JSON

## Categories (select only the MOST IMPORTANT keywords in each):
- **core**: Hard knockout requirements (education, years of experience, travel requirements, required certifications)
- **functional_skills**: Critical functional experience and methodologies (product management, agile, roadmap planning, P&L ownership, stakeholder management)
- **industry_experience**: Essential sector-specific experience (SaaS, GovTech, enterprise, B2B, fintech, healthcare)
- **culture**: Important cultural fit indicators (collaboration, innovation, startup environment)

## Guidelines:
- Keep numeric qualifiers with their context: "5+ years experience" not just "experience"
- Preserve complete requirement phrases when they appear in the posting
- Do NOT invent or include degree requirements unless the posting explicitly mentions them (e.g., "Bachelor's degree", "Master's", "MBA", "PhD", or specific field like "Computer Science").
- Include travel requirements with specifics: "extensive travel up to 50%"
- Capture both required and preferred qualifications
- Focus on concrete, actionable keywords that would appear on a resume

## Response Format:
You must respond with EXACTLY this JSON structure. Do not include any other text, explanation, or markdown:

{
  "keywords": [
    {"kw": "5+ years product management experience", "role": "core"},
    {"kw": "extensive travel up to 50%", "role": "core"},
    {"kw": "Agile methodologies", "role": "functional_skills"},
    {"kw": "product strategy", "role": "functional_skills"},
    {"kw": "stakeholder management", "role": "functional_skills"},
    {"kw": "B2B SaaS experience", "role": "industry_experience"},
    {"kw": "enterprise software", "role": "industry_experience"},
    {"kw": "collaborative environment", "role": "culture"},
    {"kw": "fast-paced startup", "role": "culture"}
  ]
}

## Job Posting:
${jobPosting}

Extract all important keywords from this job posting and categorize them appropriately. Focus on keywords that a candidate would need to include in their resume to match this role.`;
  }

  callOllama(prompt: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const postData = JSON.stringify({
        model: this.modelName,
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.1,  // Low temperature for consistent output
          top_p: 0.9,
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
          } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            reject(new Error(`Failed to parse Ollama response: ${message}`));
          }
        });
      });

      // Set a 3-minute timeout for keyword extraction
      req.setTimeout(180000, () => {
        req.destroy();
        reject(new Error('Request timeout after 3 minutes'));
      });

      req.on('error', (error: unknown) => {
        const message = error instanceof Error ? error.message : String(error);
        reject(new Error(`Ollama request failed: ${message}`));
      });

      req.write(postData);
      req.end();
    });
  }

  parseJSON(text: string): KeywordSet {
    try {
      // Remove <think> tags if present (some models use these)
      const cleanText = text.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
            
      // If the response is already clean JSON, try parsing it directly
      if (cleanText.startsWith('{') && cleanText.endsWith('}')) {
        try {
          return JSON.parse(cleanText);
        } catch {
          // Continue to other methods if direct parsing fails
        }
      }
            
      // Try markdown code blocks
      const jsonBlockMatch = cleanText.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonBlockMatch) {
        return JSON.parse(jsonBlockMatch[1]);
      }
            
      // Try any code blocks
      const codeBlockMatch = cleanText.match(/```\s*([\s\S]*?)\s*```/);
      if (codeBlockMatch) {
        return JSON.parse(codeBlockMatch[1]);
      }
            
      // Fallback: basic start/end extraction for nested JSON
      const jsonStart = cleanText.indexOf('{');
      const jsonEnd = cleanText.lastIndexOf('}') + 1;
            
      if (jsonStart !== -1 && jsonEnd > jsonStart) {
        const jsonStr = cleanText.substring(jsonStart, jsonEnd);
        return JSON.parse(jsonStr);
      }
            
      throw new Error('No valid JSON found in response');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Failed to parse JSON:', message);
      console.error('Response text (first 200 chars):', text.substring(0, 200));
      console.error('Response text (last 200 chars):', text.substring(Math.max(0, text.length - 200)));
      throw new Error(message);
    }
  }
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error('Usage: node keyword-extraction.js <job-posting.md> <output-keywords.json>');
    console.error('Example: node keyword-extraction.js /path/to/job-posting.md /path/to/keywords.json');
    process.exit(1);
  }
  const [jobPostingPath, outputPath] = args as [string, string];
  if (!fs.existsSync(jobPostingPath)) {
    console.error(`Error: Job posting file not found: ${jobPostingPath}`);
    process.exit(1);
  }
  const extractor = new KeywordExtractionService();
  extractor
    .extractKeywords(jobPostingPath, outputPath)
    .then(() => {
      console.log('🎉 Keyword extraction completed successfully!');
      process.exit(0);
    })
    .catch((error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      console.error('💥 Extraction failed:', message);
      process.exit(1);
    });
}

export default KeywordExtractionService;
