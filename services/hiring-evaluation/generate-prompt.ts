#!/usr/bin/env node

import fs from 'fs';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface PersonaData {
  persona: {
    name: string;
    background: string[];
    evaluation_approach: string;
  };
  criteria: Record<string, {
    title: string;
    description: string;
    bullets: string[];
  }>;
  evaluation: {
    focus: string;
  };
}

function loadYaml(filePath: string): PersonaData {
  const content = fs.readFileSync(filePath, 'utf8');
  const data: PersonaData = { persona: { name: '', background: [], evaluation_approach: '' }, criteria: {}, evaluation: { focus: '' } };
    
  // Extract persona name
  const nameMatch = content.match(/name: "([^"]+)"/);
  data.persona.name = nameMatch ? nameMatch[1] : '';
    
  // Extract background bullets
  const backgroundSection = content.match(/background:\s*\n((?:\s*- "[^"]+"\s*\n)+)/);
  data.persona.background = backgroundSection ? 
    backgroundSection[1].match(/"([^"]+)"/g)?.map(m => m.slice(1, -1)) || [] : [];
    
  // Extract evaluation approach
  const approachMatch = content.match(/evaluation_approach: \|\s*\n([\s\S]*?)\n\ncriteria:/);
  data.persona.evaluation_approach = approachMatch ? 
    approachMatch[1].replace(/^ {4}/gm, '').trim() : '';
    
  // Extract criteria with a simpler approach
  const criteriaMatches = content.matchAll(/ {2}(\w+):\s*\n\s+title: "([^"]+)"\s*\n\s+description: "([^"]+)"\s*\n\s+bullets:\s*\n((?:\s+- "[^"]+"\s*\n)+)/g);
  for (const match of criteriaMatches) {
    const key = match[1];
    const bullets = match[4].match(/"([^"]+)"/g)?.map(m => m.slice(1, -1)) || [];
        
    data.criteria[key] = {
      title: match[2],
      description: match[3],
      bullets: bullets,
    };
  }
    
  // Extract evaluation focus
  const focusMatch = content.match(/focus: "([^"]+)"/);
  data.evaluation.focus = focusMatch ? focusMatch[1] : '';
    
  return data;
}

export function generatePrompt(personaKey: string): string {
  const yamlPath = path.join(__dirname, 'personas', `${personaKey}.yaml`);
  const persona = loadYaml(yamlPath);
    
  let prompt = `## Persona: ${persona.persona.name}\n\n`;
  prompt += '### Your Background:\n';
  persona.persona.background.forEach(bullet => prompt += `- ${bullet}\n`);
  prompt += `\n### Your Evaluation Approach:\n${persona.persona.evaluation_approach}\n\n`;
    
  // Add competitive framework (embedded)
  const framework = `## Evaluation Task

**COMPETITIVE FRAMEWORK**: You are evaluating this candidate against other director-level candidates in today's hyper-competitive market. 

**SCORING RUBRIC (1-10):**
- **1-3 = Reject**: Missing core requirements, red flags, poor fit
- **4-5 = Weak**: Some qualifications but significant gaps or concerns  
- **6-7 = Solid**: Meets requirements but not exceptional, average candidate
- **8-9 = Strong**: Exceeds requirements, top 20% candidate
- **10 = Exceptional**: Best-in-class, transformational hire

**CALIBRATION**: Most candidates score 4-7. Only give 8+ if you'd genuinely hire them over 80% of other director-level candidates. Be specific about gaps and weaknesses - this feedback helps candidates improve.

Review the attached resume against the job posting and score using this rubric. Focus particularly on your areas of expertise:`;
  prompt += `${framework}\n\n`;
    
  // Add criteria
  let i = 1;
  for (const [key, criterion] of Object.entries(persona.criteria)) {
    prompt += `### ${i}. ${criterion.title} (1-10)\n\n${criterion.description}\n\n`;
    criterion.bullets.forEach(bullet => prompt += `- ${bullet}\n`);
    prompt += '\n';
    i++;
  }
    
  // Note: JSON format handled by Ollama structured output - no template needed
    
  prompt += '## Job Posting:\n{job_posting}\n\n## Resume:\n{resume}\n\n';
  prompt += `Please provide your detailed evaluation focusing on ${persona.evaluation.focus}.`;
    
  return prompt;
}

// Only run file generation when called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  // Generate all prompts
  const personas = ['hr', 'technical', 'design', 'finance', 'ceo', 'team'];
    
  // Ensure output directory exists
  const outputDir = path.join(__dirname, 'prompts');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
    
  personas.forEach(persona => {
    const prompt = generatePrompt(persona);
    fs.writeFileSync(path.join(outputDir, `${persona}-prompt.md`), prompt);
  });
}
