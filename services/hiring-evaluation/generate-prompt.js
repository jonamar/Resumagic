#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function loadYaml(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const data = { persona: {}, criteria: {}, evaluation: {} };
    
    // Extract persona name
    const nameMatch = content.match(/name: "([^"]+)"/);
    data.persona.name = nameMatch ? nameMatch[1] : '';
    
    // Extract background bullets
    const backgroundSection = content.match(/background:\s*\n((?:\s*- "[^"]+"\s*\n)+)/);
    data.persona.background = backgroundSection ? 
        backgroundSection[1].match(/"([^"]+)"/g).map(m => m.slice(1, -1)) : [];
    
    // Extract evaluation approach
    const approachMatch = content.match(/evaluation_approach: \|\s*\n([\s\S]*?)\n\ncriteria:/);
    data.persona.evaluation_approach = approachMatch ? 
        approachMatch[1].replace(/^ {4}/gm, '').trim() : '';
    
    // Extract criteria with a simpler approach
    const criteriaMatches = content.matchAll(/  (\w+):\s*\n\s+title: "([^"]+)"\s*\n\s+description: "([^"]+)"\s*\n\s+bullets:\s*\n((?:\s+- "[^"]+"\s*\n)+)/g);
    for (const match of criteriaMatches) {
        const key = match[1];
        const bullets = match[4].match(/"([^"]+)"/g).map(m => m.slice(1, -1));
        
        data.criteria[key] = {
            title: match[2],
            description: match[3],
            bullets: bullets
        };
    }
    
    // Extract evaluation focus
    const focusMatch = content.match(/focus: "([^"]+)"/);
    data.evaluation.focus = focusMatch ? focusMatch[1] : '';
    
    return data;
}

function generatePrompt(personaKey) {
    const yamlPath = path.join(__dirname, 'personas', `${personaKey}.yaml`);
    const persona = loadYaml(yamlPath);
    
    let prompt = `## Persona: ${persona.persona.name}\n\n`;
    prompt += `### Your Background:\n`;
    persona.persona.background.forEach(bullet => prompt += `- ${bullet}\n`);
    prompt += `\n### Your Evaluation Approach:\n${persona.persona.evaluation_approach}\n\n`;
    
    // Add competitive framework (embedded)
    const framework = `## Evaluation Task

**COMPETITIVE FRAMEWORK**: You are evaluating this candidate against other director-level candidates in today's hyper-competitive market. Ask yourself: "Would I hire this person over 50+ other director-level candidates?" Only scores of 8.0+ represent truly viable candidates who could compete successfully.

Review the attached resume against the job posting and score the candidate using the unified scoring rubric (1-10 scale). Focus particularly on your areas of expertise:`;
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
    
    prompt += `## Job Posting:\n{job_posting}\n\n## Resume:\n{resume}\n\n`;
    prompt += `Please provide your detailed evaluation focusing on ${persona.evaluation.focus}.`;
    
    return prompt;
}

module.exports = { generatePrompt };

// Only run file generation when called directly
if (require.main === module) {
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
        console.log(`✅ Generated ${persona}-prompt.md`);
    });

    console.log('\n🎉 All prompts generated from YAML configuration');
}