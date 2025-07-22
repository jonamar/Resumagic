#!/usr/bin/env node

const EvaluationRunner = require('./evaluation-runner.js');
const fs = require('fs');
const path = require('path');

// Quick temperature test - single candidate, key temperatures only
const temperatures = [0.1, 0.7, 1.2]; // Current, medium, high
const candidateType = 'average-candidate'; // Focus on one candidate type

async function runQuickTest() {
    console.log('🧪 Quick Temperature Test - Scientific Analysis');
    console.log(`Testing temps: ${temperatures.join(', ')} on ${candidateType}\n`);
    
    const results = [];
    
    for (const temp of temperatures) {
        console.log(`\n🌡️  Testing Temperature ${temp}`);
        
        try {
            // Load test candidate
            const candidatePath = path.join(__dirname, '..', '..', 'test-resumes', `${candidateType}.json`);
            const candidateData = JSON.parse(fs.readFileSync(candidatePath, 'utf8'));
            
            // Copy to evaluation directory
            const applicationPath = path.join(__dirname, '..', '..', '..', 'data', 'applications', 'elovate-director-product-management');
            const targetPath = path.join(applicationPath, 'inputs', 'resume.json');
            fs.writeFileSync(targetPath, JSON.stringify(candidateData, null, 2));
            
            // Create runner with modified temperature
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
                        temperature: temp, // Custom temperature
                        top_p: 0.9,
                        repeat_penalty: 1.1,
                        max_tokens: 4000,
                        num_ctx: 12288
                    }
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
                            'Content-Length': Buffer.byteLength(postData)
                        }
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
                let criteriaFields = {};
                if (persona) {
                    try {
                        const yamlPath = path.join(__dirname, 'personas', `${persona}.yaml`);
                        const personaData = runner.parseSimpleYaml(fs.readFileSync(yamlPath, 'utf8'));
                        
                        for (const fieldName of Object.keys(personaData.criteria)) {
                            criteriaFields[fieldName] = {
                                type: "object",
                                properties: {
                                    score: { type: "integer", minimum: 1, maximum: 10 },
                                    reasoning: { type: "string", maxLength: 300 }
                                },
                                required: ["score", "reasoning"]
                            };
                        }
                    } catch (error) {
                        console.log('Schema loading error, using default');
                    }
                }
                
                return {
                    type: "object",
                    properties: {
                        scores: {
                            type: "object",
                            properties: criteriaFields,
                            additionalProperties: false,
                            required: Object.keys(criteriaFields)
                        },
                        overall_assessment: {
                            type: "object",
                            properties: {
                                persona_score: { type: "number", minimum: 1.0, maximum: 10.0 },
                                recommendation: { type: "string", maxLength: 200 }
                            },
                            required: ["persona_score", "recommendation"]
                        }
                    },
                    required: ["scores", "overall_assessment"]
                };
            }
            
            // Run evaluation
            const startTime = Date.now();
            const evalResults = await runner.runEvaluation(candidateData.name);
            const duration = (Date.now() - startTime) / 1000;
            
            // Extract scores for analysis
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
                    range: Math.max(...scores) - Math.min(...scores)
                };
            };
            
            const overallStats = calculateStats(allScores);
            const personaStats = calculateStats(personaScores);
            
            results.push({
                temperature: temp,
                duration,
                overallStats,
                personaStats,
                allScores,
                personaScores
            });
            
            console.log(`   ✓ Duration: ${duration.toFixed(1)}s`);
            console.log(`   📊 Score Range: ${overallStats.min}-${overallStats.max} (${overallStats.range} points)`);
            console.log(`   📈 All Scores Variance: ${overallStats.variance} (StdDev: ${overallStats.stdDev})`);
            console.log(`   👥 Persona Avg Range: ${personaStats.min}-${personaStats.max} (${personaStats.range} points)`);
            
        } catch (error) {
            console.error(`   ❌ Failed: ${error.message}`);
            results.push({ temperature: temp, error: error.message });
        }
        
        // Brief pause
        await new Promise(resolve => setTimeout(resolve, 3000));
    }
    
    // Analysis
    console.log('\n📈 COMPARATIVE ANALYSIS\n');
    console.log('| Temp | Duration | Score Range | All Variance | Persona Range | Persona Variance |');
    console.log('|------|----------|-------------|--------------|---------------|------------------|');
    
    const successful = results.filter(r => !r.error);
    successful.forEach(r => {
        console.log(`| ${r.temperature} | ${r.duration.toFixed(1)}s | ${r.overallStats.min}-${r.overallStats.max} (${r.overallStats.range}) | ${r.overallStats.variance} | ${r.personaStats.min}-${r.personaStats.max} (${r.personaStats.range}) | ${r.personaStats.variance} |`);
    });
    
    if (successful.length >= 2) {
        // Find best temperature for differentiation
        const best = successful.reduce((prev, curr) => {
            const prevScore = prev.overallStats.variance + prev.personaStats.variance;
            const currScore = curr.overallStats.variance + curr.personaStats.variance;
            return currScore > prevScore ? curr : prev;
        });
        
        const baseline = successful.find(r => r.temperature === 0.1);
        
        console.log('\n🎯 RECOMMENDATION');
        console.log(`Optimal Temperature: ${best.temperature}`);
        console.log(`- Best overall variance: ${best.overallStats.variance}`);
        console.log(`- Best persona variance: ${best.personaStats.variance}`);
        
        if (baseline) {
            const improvement = ((best.overallStats.variance - baseline.overallStats.variance) / baseline.overallStats.variance) * 100;
            console.log(`🚀 ${improvement > 0 ? '+' : ''}${improvement.toFixed(0)}% variance improvement vs baseline`);
        }
        
        console.log(`\n🔧 IMPLEMENTATION: Change line 131 in evaluation-runner.js:`);
        console.log(`   FROM: temperature: 0.1`);
        console.log(`   TO:   temperature: ${best.temperature}`);
    }
    
    // Save results
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const resultsFile = path.join(__dirname, `quick-temp-results-${timestamp}.json`);
    fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));
    console.log(`\n📁 Detailed results saved: ${resultsFile}`);
    
    return results;
}

// Run the test
runQuickTest()
    .then(() => {
        console.log('\n✅ Quick temperature test completed!');
        process.exit(0);
    })
    .catch(error => {
        console.error('❌ Test failed:', error.message);
        process.exit(1);
    });