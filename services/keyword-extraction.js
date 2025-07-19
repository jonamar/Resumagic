#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const http = require('http');

class KeywordExtractionService {
    constructor() {
        this.ollamaUrl = 'http://localhost:11434';
        this.modelName = 'dolphin3:latest';
    }

    async extractKeywords(jobPostingPath, outputPath) {
        try {
            console.log('🔍 Loading job posting...');
            const jobPosting = fs.readFileSync(jobPostingPath, 'utf8');
            
            console.log('🤖 Extracting keywords with Dolphin...');
            const prompt = this.buildExtractionPrompt(jobPosting);
            const response = await this.callOllama(prompt);
            const keywords = this.parseJSON(response);
            
            console.log('💾 Saving keywords...');
            fs.writeFileSync(outputPath, JSON.stringify(keywords, null, 2));
            
            console.log(`✅ Keywords extracted and saved to: ${outputPath}`);
            console.log(`📊 Extracted ${keywords.keywords.length} keywords`);
            
            // Summary
            const categories = keywords.keywords.reduce((acc, kw) => {
                acc[kw.role] = (acc[kw.role] || 0) + 1;
                return acc;
            }, {});
            
            console.log('📋 Category breakdown:');
            Object.entries(categories).forEach(([role, count]) => {
                console.log(`  - ${role}: ${count} keywords`);
            });
            
            return keywords;
        } catch (error) {
            console.error('❌ Keyword extraction failed:', error.message);
            throw error;
        }
    }

    buildExtractionPrompt(jobPosting) {
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
- Preserve complete requirement phrases: "Bachelor's degree in Computer Science" not separate words
- Include travel requirements with specifics: "extensive travel up to 50%"
- Capture both required and preferred qualifications
- Focus on concrete, actionable keywords that would appear on a resume

## Response Format:
You must respond with EXACTLY this JSON structure. Do not include any other text, explanation, or markdown:

{
  "keywords": [
    {"kw": "5+ years product management experience", "role": "core"},
    {"kw": "Bachelor's degree in Computer Science", "role": "core"},
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

    async callOllama(prompt) {
        return new Promise((resolve, reject) => {
            const postData = JSON.stringify({
                model: this.modelName,
                prompt: prompt,
                stream: false,
                options: {
                    temperature: 0.1,  // Low temperature for consistent output
                    top_p: 0.9
                }
            });

            const options = {
                hostname: 'localhost',
                port: 11434,
                path: '/api/generate',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(postData)
                }
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

            // Set a 3-minute timeout for keyword extraction
            req.setTimeout(180000, () => {
                req.destroy();
                reject(new Error('Request timeout after 3 minutes'));
            });

            req.on('error', (error) => {
                reject(new Error(`Ollama request failed: ${error.message}`));
            });

            req.write(postData);
            req.end();
        });
    }

    parseJSON(text) {
        try {
            // Remove <think> tags if present (some models use these)
            let cleanText = text.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
            
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
        } catch (error) {
            console.error('Failed to parse JSON:', error.message);
            console.error('Response text (first 200 chars):', text.substring(0, 200));
            console.error('Response text (last 200 chars):', text.substring(Math.max(0, text.length - 200)));
            throw error;
        }
    }
}

// CLI interface
if (require.main === module) {
    const args = process.argv.slice(2);
    
    if (args.length < 2) {
        console.error('Usage: node keyword-extraction.js <job-posting.md> <output-keywords.json>');
        console.error('Example: node keyword-extraction.js /path/to/job-posting.md /path/to/keywords.json');
        process.exit(1);
    }
    
    const [jobPostingPath, outputPath] = args;
    
    if (!fs.existsSync(jobPostingPath)) {
        console.error(`Error: Job posting file not found: ${jobPostingPath}`);
        process.exit(1);
    }
    
    const extractor = new KeywordExtractionService();
    
    extractor.extractKeywords(jobPostingPath, outputPath)
        .then(() => {
            console.log('🎉 Keyword extraction completed successfully!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Extraction failed:', error.message);
            process.exit(1);
        });
}

module.exports = KeywordExtractionService;