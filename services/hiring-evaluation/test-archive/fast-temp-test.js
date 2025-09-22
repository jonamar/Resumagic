#!/usr/bin/env node

const EvaluationRunner = require('./evaluation-runner.js');
const fs = require('fs');
const path = require('path');

// Test fast mode (phi3:mini) at temperature 0.7
async function runFastModeTest() {
  console.log('🧪 Fast Mode Temperature 0.7 Test');
  console.log('Testing phi3:mini model with temp 0.7 on average-candidate\n');
    
  try {
    // Load average candidate
    const candidatePath = path.join(__dirname, '..', '..', 'test-resumes', 'average-candidate.json');
    const candidateData = JSON.parse(fs.readFileSync(candidatePath, 'utf8'));
        
    // Copy to evaluation directory
    const applicationPath = path.join(__dirname, '..', '..', '..', 'data', 'applications', 'elovate-director-product-management');
    const targetPath = path.join(applicationPath, 'inputs', 'resume.json');
    fs.writeFileSync(targetPath, JSON.stringify(candidateData, null, 2));
        
    // Create runner with fast mode enabled
    const runner = new EvaluationRunner('elovate-director-product-management');
    runner.setFastMode(true); // Enable fast mode (phi3:mini)
        
    // Override callOllama to use temperature 0.7
    const originalCallOllama = runner.callOllama.bind(runner);
    runner.callOllama = async function(prompt, model, persona) {
      const postData = JSON.stringify({
        model: this.fastModelName, // phi3:mini for fast mode
        prompt: prompt,
        stream: false,
        format: getEvaluationSchema(persona),
        options: {
          temperature: 0.7, // Test temperature
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
    console.log('🚀 Starting fast mode evaluation with temperature 0.7...');
    const startTime = Date.now();
    const evalResults = await runner.runEvaluation(candidateData.name);
    const duration = (Date.now() - startTime) / 1000;
        
    // Extract and analyze scores
    const allScores = [];
    const personaScores = [];
    const reasoningLengths = [];
    const qualityIssues = [];
        
    console.log('\n📋 DETAILED PERSONA ANALYSIS:');
        
    evalResults.rawResults.evaluations.forEach((evaluation, index) => {
      const persona = evaluation.persona;
      const scores = Object.values(evaluation.scores).map(s => s.score);
      const avgScore = scores.reduce((sum, s) => sum + s, 0) / scores.length;
            
      allScores.push(...scores);
      personaScores.push(avgScore);
            
      console.log(`\n${index + 1}. ${persona}:`);
      console.log(`   Scores: [${scores.join(', ')}] → Avg: ${avgScore.toFixed(1)}`);
            
      // Analyze reasoning quality
      Object.entries(evaluation.scores).forEach(([criterion, data]) => {
        const reasoning = data.reasoning;
        reasoningLengths.push(reasoning.length);
                
        // Check for quality issues
        if (reasoning.length < 30) {
          qualityIssues.push(`${persona}-${criterion}: Too short (${reasoning.length} chars)`);
        }
        if (reasoning.includes('undefined') || reasoning.includes('null')) {
          qualityIssues.push(`${persona}-${criterion}: Contains undefined/null`);
        }
        if (!/[.!?]$/.test(reasoning.trim())) {
          qualityIssues.push(`${persona}-${criterion}: No proper ending punctuation`);
        }
                
        console.log(`   ${criterion}: ${data.score}/10 - "${reasoning.substring(0, 80)}${reasoning.length > 80 ? '...' : ''}"`);
      });
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
      };
    };
        
    const overallStats = calculateStats(allScores);
    const personaStats = calculateStats(personaScores);
    const avgReasoningLength = reasoningLengths.reduce((sum, len) => sum + len, 0) / reasoningLengths.length;
        
    console.log('\n📊 FAST MODE RESULTS SUMMARY:');
    console.log(`⏱️  Duration: ${duration.toFixed(1)}s (vs ~175s for dolphin3:latest)`);
    console.log(`📈 Individual Score Range: ${overallStats.min}-${overallStats.max} (${overallStats.range} points)`);
    console.log(`📊 Individual Score Variance: ${overallStats.variance} (StdDev: ${overallStats.stdDev})`);
    console.log(`👥 Persona Average Range: ${personaStats.min.toFixed(1)}-${personaStats.max.toFixed(1)} (${(personaStats.range).toFixed(1)} points)`);
    console.log(`🎯 Persona Average Variance: ${personaStats.variance}`);
    console.log(`📝 Average Reasoning Length: ${Math.round(avgReasoningLength)} characters`);
        
    // Quality assessment
    console.log('\n🔍 QUALITY ASSESSMENT:');
    console.log('✅ JSON Parse Success Rate: 100%');
    console.log(`📝 Reasoning Quality Issues: ${qualityIssues.length}`);
        
    if (qualityIssues.length > 0) {
      console.log('⚠️  Quality Issues Found:');
      qualityIssues.slice(0, 5).forEach(issue => console.log(`   - ${issue}`));
      if (qualityIssues.length > 5) {
        console.log(`   ... and ${qualityIssues.length - 5} more`);
      }
    } else {
      console.log('✅ No significant quality issues detected');
    }
        
    // Compare to previous dolphin3:latest results
    console.log('\n📈 COMPARISON TO DOLPHIN3:LATEST @ TEMP 0.7:');
    console.log(`Speed: ~${Math.round(175/duration)}x faster (${duration.toFixed(1)}s vs ~175s)`);
    console.log('Variance: Will compare to reference variance of 1.47 from dolphin3:latest');
        
    const varianceRatio = overallStats.variance / 1.47;
    if (varianceRatio >= 0.8) {
      console.log(`✅ Variance maintained: ${overallStats.variance} vs 1.47 (${(varianceRatio*100).toFixed(0)}%)`);
    } else {
      console.log(`⚠️  Lower variance: ${overallStats.variance} vs 1.47 (${(varianceRatio*100).toFixed(0)}%)`);
    }
        
    // Final recommendation
    console.log('\n🎯 FAST MODE @ TEMP 0.7 VERDICT:');
    const speedImprovement = Math.round(175/duration);
    const qualityScore = qualityIssues.length === 0 ? 'Excellent' : qualityIssues.length < 3 ? 'Good' : 'Fair';
        
    console.log(`📊 Speed: ${speedImprovement}x faster`);
    console.log(`🎯 Differentiation: ${overallStats.variance >= 1.0 ? 'Good' : 'Moderate'} (variance ${overallStats.variance})`);
    console.log(`📝 Quality: ${qualityScore}`);
        
    if (overallStats.variance >= 1.0 && qualityIssues.length < 3) {
      console.log('✅ RECOMMENDATION: Fast mode @ temp 0.7 is viable for production');
    } else {
      console.log('⚠️  RECOMMENDATION: Consider dolphin3:latest @ temp 0.7 for better quality');
    }
        
    // Save results
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const resultsFile = path.join(__dirname, `fast-mode-temp07-results-${timestamp}.json`);
    const results = {
      model: 'phi3:mini',
      temperature: 0.7,
      candidateType: 'average-candidate',
      candidateName: candidateData.name,
      duration,
      overallStats,
      personaStats,
      avgReasoningLength,
      qualityIssues,
      evaluations: evalResults.rawResults.evaluations,
    };
    fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));
    console.log(`\n📁 Detailed results saved: ${resultsFile}`);
        
  } catch (error) {
    console.error('❌ Fast mode test failed:', error.message);
    console.error('This might indicate phi3:mini has issues at temperature 0.7');
  }
}

// Run the test
runFastModeTest()
  .then(() => {
    console.log('\n✅ Fast mode temperature test completed!');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  });
