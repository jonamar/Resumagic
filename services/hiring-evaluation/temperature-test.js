#!/usr/bin/env node

const EvaluationRunner = require('./evaluation-runner.js');
const fs = require('fs');
const path = require('path');

class TemperatureTestRunner {
    constructor() {
        this.testResults = [];
        this.temperatures = [0.1, 0.3, 0.7, 1.0, 1.2, 1.5];
        this.candidates = ['weak-candidate', 'average-candidate', 'strong-candidate'];
        this.applicationName = 'elovate-director-product-management';
    }

    // Create modified evaluation runner with specific temperature
    createRunnerWithTemperature(temperature) {
        const runner = new EvaluationRunner(this.applicationName);
        
        // Override the callOllama method to use custom temperature
        const originalCallOllama = runner.callOllama.bind(runner);
        runner.callOllama = function(prompt, model, persona) {
            return new Promise((resolve, reject) => {
                const selectedModel = this.fastMode ? this.fastModelName : model || this.modelName;
                const postData = JSON.stringify({
                    model: selectedModel,
                    prompt: prompt,
                    stream: false,
                    format: this.getEvaluationSchema(persona),
                    options: {
                        temperature: temperature, // Use custom temperature
                        top_p: 0.9,
                        repeat_penalty: 1.1,
                        max_tokens: 4000,
                        num_ctx: 12288
                    }
                });

                const http = require('http');
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
                    res.on('data', (chunk) => data += chunk);
                    res.on('end', () => {
                        try {
                            const response = JSON.parse(data);
                            resolve(response.response);
                        } catch (error) {
                            reject(new Error(`Failed to parse Ollama response: ${error.message}`));
                        }
                    });
                });

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
        }.bind(runner);
        
        // Add helper method for evaluation schema
        runner.getEvaluationSchema = function(persona) {
            let criteriaFields = {};
            
            if (persona) {
                try {
                    const yamlPath = path.join(__dirname, 'personas', `${persona}.yaml`);
                    const personaData = this.parseSimpleYaml(fs.readFileSync(yamlPath, 'utf8'));
                    
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
                    console.log('Could not load persona criteria, using generic schema');
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
        }.bind(runner);

        return runner;
    }

    // Load test candidate resume data
    async loadTestCandidate(candidateType) {
        const candidatePath = path.join(__dirname, '..', '..', 'test-resumes', `${candidateType}.json`);
        const candidateData = JSON.parse(fs.readFileSync(candidatePath, 'utf8'));
        
        // Copy candidate to application directory for evaluation
        const applicationPath = path.join(__dirname, '..', '..', '..', 'data', 'applications', this.applicationName);
        const targetPath = path.join(applicationPath, 'inputs', 'resume.json');
        
        // Ensure directory exists
        const dir = path.dirname(targetPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        
        fs.writeFileSync(targetPath, JSON.stringify(candidateData, null, 2));
        return candidateData.name || candidateType;
    }

    // Calculate statistics for score variance
    calculateVariance(scores) {
        const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
        const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
        return {
            mean: Math.round(mean * 100) / 100,
            variance: Math.round(variance * 100) / 100,
            stdDev: Math.round(Math.sqrt(variance) * 100) / 100,
            min: Math.min(...scores),
            max: Math.max(...scores),
            range: Math.max(...scores) - Math.min(...scores)
        };
    }

    // Run evaluation with specific temperature
    async runTemperatureTest(temperature, candidateType, runNumber = 1) {
        console.log(`\n🌡️  Testing Temperature ${temperature} on ${candidateType} (Run ${runNumber})`);
        
        const candidateName = await this.loadTestCandidate(candidateType);
        const runner = this.createRunnerWithTemperature(temperature);
        
        try {
            const startTime = Date.now();
            const results = await runner.runEvaluation(candidateName);
            const duration = (Date.now() - startTime) / 1000;
            
            // Extract scores from evaluations
            const evaluations = results.rawResults.evaluations;
            const personaScores = {};
            const allScores = [];
            
            evaluations.forEach(evaluation => {
                const personaName = evaluation.persona;
                const scores = Object.values(evaluation.scores).map(s => s.score);
                const avgScore = scores.reduce((sum, s) => sum + s, 0) / scores.length;
                
                personaScores[personaName] = {
                    individualScores: scores,
                    average: Math.round(avgScore * 100) / 100
                };
                
                allScores.push(...scores);
            });
            
            const stats = this.calculateVariance(allScores);
            const personaAverages = Object.values(personaScores).map(p => p.average);
            const personaVariance = this.calculateVariance(personaAverages);
            
            const testResult = {
                temperature,
                candidateType,
                candidateName,
                runNumber,
                duration,
                personaScores,
                overallStats: stats,
                personaStats: personaVariance,
                timestamp: new Date().toISOString()
            };
            
            console.log(`   ✓ Duration: ${duration}s`);
            console.log(`   📊 Score Range: ${stats.min}-${stats.max} (${stats.range} points)`);
            console.log(`   📈 Variance: ${stats.variance} (StdDev: ${stats.stdDev})`);
            console.log(`   👥 Persona Range: ${personaVariance.min}-${personaVariance.max} (${personaVariance.range} points)`);
            
            return testResult;
            
        } catch (error) {
            console.error(`   ❌ Test failed: ${error.message}`);
            return {
                temperature,
                candidateType,
                candidateName,
                runNumber,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    // Run complete test suite
    async runFullTest() {
        console.log('🧪 Starting Scientific Temperature Test');
        console.log(`🎯 Testing temperatures: ${this.temperatures.join(', ')}`);
        console.log(`👥 Testing candidates: ${this.candidates.join(', ')}`);
        console.log('⏱️  Running 2 iterations per combination for consistency\n');
        
        const allResults = [];
        
        for (const temperature of this.temperatures) {
            for (const candidate of this.candidates) {
                // Run 2 iterations for consistency
                for (let run = 1; run <= 2; run++) {
                    const result = await this.runTemperatureTest(temperature, candidate, run);
                    allResults.push(result);
                    
                    // Brief pause between tests
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }
            }
        }
        
        return this.analyzeResults(allResults);
    }

    // Analyze all test results
    analyzeResults(results) {
        console.log('\n📈 SCIENTIFIC ANALYSIS RESULTS\n');
        
        // Group by temperature
        const byTemperature = {};
        results.filter(r => !r.error).forEach(result => {
            if (!byTemperature[result.temperature]) {
                byTemperature[result.temperature] = [];
            }
            byTemperature[result.temperature].push(result);
        });
        
        console.log('| Temperature | Avg Variance | Avg Range | Avg Persona Range | Success Rate |');
        console.log('|-------------|--------------|-----------|------------------|--------------|');
        
        const analysis = [];
        
        Object.keys(byTemperature).sort((a, b) => parseFloat(a) - parseFloat(b)).forEach(temp => {
            const tempResults = byTemperature[temp];
            const successfulResults = tempResults.filter(r => !r.error);
            
            if (successfulResults.length === 0) {
                console.log(`| ${temp} | FAILED | FAILED | FAILED | 0% |`);
                return;
            }
            
            const avgVariance = successfulResults.reduce((sum, r) => sum + r.overallStats.variance, 0) / successfulResults.length;
            const avgRange = successfulResults.reduce((sum, r) => sum + r.overallStats.range, 0) / successfulResults.length;
            const avgPersonaRange = successfulResults.reduce((sum, r) => sum + r.personaStats.range, 0) / successfulResults.length;
            const successRate = (successfulResults.length / tempResults.length) * 100;
            
            console.log(`| ${temp} | ${avgVariance.toFixed(2)} | ${avgRange.toFixed(1)} | ${avgPersonaRange.toFixed(1)} | ${successRate.toFixed(0)}% |`);
            
            analysis.push({
                temperature: parseFloat(temp),
                avgVariance: avgVariance,
                avgRange: avgRange,
                avgPersonaRange: avgPersonaRange,
                successRate: successRate,
                sampleSize: successfulResults.length
            });
        });
        
        // Find optimal temperature
        const validResults = analysis.filter(a => a.successRate >= 80); // Must be at least 80% successful
        if (validResults.length === 0) {
            console.log('\n❌ No temperature achieved acceptable success rate');
            return { analysis, recommendation: null };
        }
        
        // Rank by variance (higher is better for differentiation)
        const optimal = validResults.reduce((best, current) => {
            const currentScore = current.avgVariance + (current.avgPersonaRange * 0.5); // Weighted score
            const bestScore = best.avgVariance + (best.avgPersonaRange * 0.5);
            return currentScore > bestScore ? current : best;
        });
        
        console.log('\n🎯 RECOMMENDATION');
        console.log(`Optimal Temperature: ${optimal.temperature}`);
        console.log(`- Variance: ${optimal.avgVariance.toFixed(2)} (higher = more differentiation)`);
        console.log(`- Score Range: ${optimal.avgRange.toFixed(1)} points`);
        console.log(`- Persona Range: ${optimal.avgPersonaRange.toFixed(1)} points`);
        console.log(`- Success Rate: ${optimal.successRate.toFixed(0)}%`);
        
        const currentTemp = 0.1;
        const improvement = ((optimal.avgVariance - analysis.find(a => a.temperature === currentTemp)?.avgVariance || 0) / (analysis.find(a => a.temperature === currentTemp)?.avgVariance || 1)) * 100;
        
        if (improvement > 0) {
            console.log(`🚀 Expected ${improvement.toFixed(0)}% improvement in score differentiation vs current temp (0.1)`);
        }
        
        // Save detailed results
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const resultsFile = path.join(__dirname, `temperature-test-results-${timestamp}.json`);
        fs.writeFileSync(resultsFile, JSON.stringify({ analysis, allResults: results, recommendation: optimal }, null, 2));
        console.log(`\n📁 Detailed results saved to: ${resultsFile}`);
        
        return { analysis, recommendation: optimal, allResults: results };
    }
}

// CLI interface
if (require.main === module) {
    const testRunner = new TemperatureTestRunner();
    
    testRunner.runFullTest()
        .then((results) => {
            console.log('\n✅ Temperature test completed successfully!');
            if (results.recommendation) {
                console.log(`\n🔧 IMPLEMENTATION: Change temperature from 0.1 to ${results.recommendation.temperature} in evaluation-runner.js line 131`);
            }
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Temperature test failed:', error.message);
            process.exit(1);
        });
}

module.exports = TemperatureTestRunner;