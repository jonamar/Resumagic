#!/usr/bin/env node

const EvaluationRunner = require('./evaluation-runner.js');
const fs = require('fs');
const path = require('path');

// Temperature test on weak candidate only
const temperatures = [0.1, 0.7]; // Baseline vs recommended
const candidateType = 'weak-candidate';

async function runWeakCandidateTest() {
  console.log('🧪 Weak Candidate Temperature Test');
  console.log(`Testing temps: ${temperatures.join(', ')} on ${candidateType}\n`);
    
  const results = [];
    
  for (const temp of temperatures) {
    console.log(`\n🌡️  Testing Temperature ${temp} on ${candidateType}`);
        
    try {
      // Load weak candidate
      const candidatePath = path.join(__dirname, '..', '..', 'test-resumes', `${candidateType}.json`);
      const candidateData = JSON.parse(fs.readFileSync(candidatePath, 'utf8'));
            
      // Copy to evaluation directory
      const applicationPath = path.join(__dirname, '..', '..', '..', 'data', 'applications', 'elovate-director-product-management');
      const targetPath = path.join(applicationPath, 'inputs', 'resume.json');
      fs.writeFileSync(targetPath, JSON.stringify(candidateData, null, 2));
            
      // Create runner with custom temperature
      const runner = new EvaluationRunner('elovate-director-product-management');
            
      // Override callOllama to use custom temperature
      const originalCallOllama = runner.callOllama.bind(runner);
      runner.callOllama = async function(prompt, model, persona) {
        const postData = JSON.stringify({
          model: this.fastMode ? this.fastModelName : (model || this.modelName),
          prompt: prompt,
          stream: false,
          format: getEvaluationSchema(persona),
          options: {
            temperature: temp,
            top_p: 0.9,
            repeat_penalty: 1.1,
            max_tokens: 4000,
            num_ctx: 12288,
          },
        });
                
        const http = require('http');
        return new Promise((resolve, reject) => {
          const req = http.request({
            hostname: 'localhost',
            port: 11434,
            path: '/api/generate',
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Content-Length': Buffer.byteLength(postData),
            },
          }, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
              try {
                resolve(JSON.parse(data).response);
              } catch (error) {
                reject(new Error(`Parse error: ${error.message}`));
              }
            });
          });
                    
          req.setTimeout(300000, () => {
            req.destroy();
            reject(new Error('Timeout'));
          });
                    
          req.on('error', reject);
          req.write(postData);
          req.end();
        });
      }.bind(runner);
            
      // Helper function for evaluation schema
      function getEvaluationSchema(persona) {
        const criteriaFields = {};
        if (persona) {
          try {
            const yamlPath = path.join(__dirname, 'personas', `${persona}.yaml`);
            const personaData = runner.parseSimpleYaml(fs.readFileSync(yamlPath, 'utf8'));
                        
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
            console.log('Schema loading error, using default');
          }
        }
                
        return {
          type: 'object',
          properties: {
            scores: {
              type: 'object',
              properties: criteriaFields,
              additionalProperties: false,
              required: Object.keys(criteriaFields),
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
      }
            
      // Run evaluation
      const startTime = Date.now();
      const evalResults = await runner.runEvaluation(candidateData.name);
      const duration = (Date.now() - startTime) / 1000;
            
      // Extract and analyze scores
      const allScores = [];
      const personaScores = [];
            
      evalResults.rawResults.evaluations.forEach(evaluation => {
        const scores = Object.values(evaluation.scores).map(s => s.score);
        const avgScore = scores.reduce((sum, s) => sum + s, 0) / scores.length;
                
        allScores.push(...scores);
        personaScores.push(avgScore);
      });
            
      // Calculate statistics
      const calculateStats = (scores) => {
        const mean = scores.reduce((sum, s) => sum + s, 0) / scores.length;
        const variance = scores.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / scores.length;
        return {
          mean: Math.round(mean * 100) / 100,
          variance: Math.round(variance * 100) / 100,
          stdDev: Math.round(Math.sqrt(variance) * 100) / 100,
          min: Math.min(...scores),
          max: Math.max(...scores),
          range: Math.max(...scores) - Math.min(...scores),
          scores: scores, // Keep raw scores for analysis
        };
      };
            
      const overallStats = calculateStats(allScores);
      const personaStats = calculateStats(personaScores);
            
      results.push({
        temperature: temp,
        candidateType,
        candidateName: candidateData.name,
        duration,
        overallStats,
        personaStats,
        allScores,
        personaScores,
      });
            
      console.log(`   ✅ Success - Duration: ${duration.toFixed(1)}s`);
      console.log(`   📊 Individual Score Range: ${overallStats.min}-${overallStats.max} (${overallStats.range} points)`);
      console.log(`   📈 Individual Score Variance: ${overallStats.variance} (StdDev: ${overallStats.stdDev})`);
      console.log(`   👥 Persona Average Range: ${personaStats.min}-${personaStats.max} (${personaStats.range} points)`);
      console.log(`   🎯 Persona Average Variance: ${personaStats.variance}`);
            
    } catch (error) {
      console.error(`   ❌ Failed: ${error.message}`);
      results.push({ 
        temperature: temp, 
        candidateType,
        error: error.message, 
      });
    }
        
    // Brief pause between tests
    await new Promise(resolve => setTimeout(resolve, 3000));
  }
    
  // Analysis and comparison
  console.log('\n📈 WEAK CANDIDATE ANALYSIS\n');
  console.log('| Temp | Duration | Individual Range | Individual Variance | Persona Range | Persona Variance |');
  console.log('|------|----------|------------------|---------------------|---------------|------------------|');
    
  const successful = results.filter(r => !r.error);
  successful.forEach(r => {
    console.log(`| ${r.temperature} | ${r.duration.toFixed(1)}s | ${r.overallStats.min}-${r.overallStats.max} (${r.overallStats.range}) | ${r.overallStats.variance} | ${r.personaStats.min}-${r.personaStats.max} (${r.personaStats.range}) | ${r.personaStats.variance} |`);
  });
    
  if (successful.length === 2) {
    const baseline = successful.find(r => r.temperature === 0.1);
    const improved = successful.find(r => r.temperature === 0.7);
        
    const individualImprov = ((improved.overallStats.variance - baseline.overallStats.variance) / baseline.overallStats.variance) * 100;
    const personaImprov = ((improved.personaStats.variance - baseline.personaStats.variance) / baseline.personaStats.variance) * 100;
        
    console.log('\n🎯 WEAK CANDIDATE RESULTS');
    console.log(`Temperature 0.7 vs 0.1 on ${candidateType}:`);
    console.log(`📊 Individual Score Variance: ${individualImprov > 0 ? '+' : ''}${individualImprov.toFixed(0)}% change`);
    console.log(`👥 Persona Average Variance: ${personaImprov > 0 ? '+' : ''}${personaImprov.toFixed(0)}% change`);
        
    // Show actual score distributions
    console.log('\n📋 Score Distribution Details:');
    console.log(`Temp 0.1: Individual scores [${baseline.allScores.sort((a,b) => a-b).join(', ')}]`);
    console.log(`Temp 0.7: Individual scores [${improved.allScores.sort((a,b) => a-b).join(', ')}]`);
        
    if (individualImprov > 0) {
      console.log('✅ Temperature 0.7 improves weak candidate differentiation');
    } else {
      console.log('⚠️  Temperature 0.7 may not help with weak candidates');
    }
  }
    
  // Save results
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const resultsFile = path.join(__dirname, `weak-candidate-temp-results-${timestamp}.json`);
  fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));
  console.log(`\n📁 Results saved: ${resultsFile}`);
    
  return results;
}

// Run the test
runWeakCandidateTest()
  .then(() => {
    console.log('\n✅ Weak candidate temperature test completed!');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  });
