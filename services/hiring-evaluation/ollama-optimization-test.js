#!/usr/bin/env node

/**
 * Phase 2: Ollama Performance Optimization Testing
 * 
 * Tests different Ollama configurations to optimize real-world single-applicant
 * 6-persona parallel evaluation performance.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class OllamaOptimizationTester {
  constructor() {
    this.resultsDir = path.join(__dirname, 'optimization-test-results');
    this.ensureResultsDir();
    
    // Test models (winners from Phase 1)
    this.testModels = [
      'dolphin3:latest',  // baseline
      'phi3:mini',        // speed winner 
      'deepseek-r1:8b'    // quality winner
    ];
    
    // Optimization configurations to test
    this.configurations = {
      'baseline': {
        OLLAMA_NUM_PARALLEL: null,     // Use default
        OLLAMA_NUM_THREADS: null,
        OLLAMA_MAX_LOADED_MODELS: null,
        description: 'Default Ollama settings (current)'
      },
      'parallel_basic': {
        OLLAMA_NUM_PARALLEL: 6,        // 6 personas in parallel
        OLLAMA_NUM_THREADS: null,
        OLLAMA_MAX_LOADED_MODELS: null,
        description: 'Enable 6 parallel requests'
      },
      'parallel_threads': {
        OLLAMA_NUM_PARALLEL: 6,
        OLLAMA_NUM_THREADS: 8,         // Use more CPU threads on M4
        OLLAMA_MAX_LOADED_MODELS: null,
        description: 'Parallel + optimized threading'
      },
      'memory_optimized': {
        OLLAMA_NUM_PARALLEL: 4,        // Slightly fewer to save memory
        OLLAMA_NUM_THREADS: 8,
        OLLAMA_MAX_LOADED_MODELS: 1,   // Keep only one model loaded
        description: 'Memory-constrained optimization'
      }
    };
    
    this.testCandidate = { 
      name: 'Alex Johnson', 
      folder: 'test-weak-candidate', 
      expected: 'weak' 
    };
    
    this.testResults = {
      timestamp: new Date().toISOString(),
      test_purpose: 'Ollama performance optimization for single-applicant 6-persona evaluations',
      configurations: this.configurations,
      results: {}
    };
  }
  
  ensureResultsDir() {
    if (!fs.existsSync(this.resultsDir)) {
      fs.mkdirSync(this.resultsDir, { recursive: true });
    }
  }
  
  async restartOllamaWithConfig(configName, config) {
    console.log(`\n🔧 Configuring Ollama: ${configName}`);
    console.log(`   ${config.description}`);
    
    try {
      // Stop Ollama
      console.log('🛑 Stopping Ollama...');
      try {
        execSync('pkill -f "ollama serve"', { stdio: 'ignore' });
        await this.sleep(2000); // Wait for graceful shutdown
      } catch (e) {
        // Ollama might not be running, that's okay
      }
      
      // Build environment variables
      let envVars = '';
      Object.entries(config).forEach(([key, value]) => {
        if (value !== null && key.startsWith('OLLAMA_')) {
          envVars += `${key}=${value} `;
        }
      });
      
      // Start Ollama with new config
      console.log('🚀 Starting Ollama with new configuration...');
      if (envVars.trim()) {
        console.log(`   Environment: ${envVars.trim()}`);
        execSync(`${envVars}nohup ollama serve > /dev/null 2>&1 &`, { stdio: 'ignore' });
      } else {
        execSync('nohup ollama serve > /dev/null 2>&1 &', { stdio: 'ignore' });
      }
      
      // Wait for Ollama to start
      await this.waitForOllama();
      
      return true;
    } catch (error) {
      console.error(`❌ Failed to configure Ollama: ${error.message}`);
      return false;
    }
  }
  
  async waitForOllama(maxRetries = 30) {
    console.log('⏳ Waiting for Ollama to start...');
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        execSync('curl -s http://localhost:11434/api/tags > /dev/null 2>&1');
        console.log('✅ Ollama is ready');
        return true;
      } catch (e) {
        await this.sleep(1000);
        if (i % 5 === 0) console.log(`   Attempt ${i + 1}/${maxRetries}...`);
      }
    }
    
    throw new Error('Ollama failed to start within timeout period');
  }
  
  async testConfiguration(configName, config, model) {
    console.log(`\n📊 Testing ${model} with ${configName} configuration`);
    
    const testId = `${configName}_${model.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}`;
    const startTime = Date.now();
    
    try {
      // Run single evaluation
      const EvaluationRunner = require('./evaluation-runner');
      const evaluator = new EvaluationRunner(this.testCandidate.folder);
      
      // Override model for this test
      evaluator.modelName = model;
      
      console.log(`🔄 Running evaluation with ${model}...`);
      const results = await evaluator.runEvaluation(this.testCandidate.name);
      
      const duration = (Date.now() - startTime) / 1000;
      
      // Extract metrics
      const scores = this.extractScores(results.rawResults);
      const memoryUsage = this.getMemoryUsage();
      
      const testResult = {
        configuration: configName,
        model: model,
        candidate: this.testCandidate,
        duration_seconds: duration,
        success: true,
        scores: scores,
        memory_usage: memoryUsage,
        test_id: testId,
        timestamp: new Date().toISOString()
      };
      
      console.log(`✅ ${configName}/${model} completed in ${duration.toFixed(1)}s`);
      console.log(`   Avg Score: ${scores.average}, Memory: ${memoryUsage.used_gb}GB`);
      
      return testResult;
      
    } catch (error) {
      const duration = (Date.now() - startTime) / 1000;
      
      console.log(`❌ ${configName}/${model} failed after ${duration.toFixed(1)}s: ${error.message}`);
      
      return {
        configuration: configName,
        model: model,
        candidate: this.testCandidate,
        duration_seconds: duration,
        success: false,
        error: error.message,
        test_id: testId
      };
    }
  }
  
  extractScores(rawResults) {
    if (!rawResults.evaluations) return null;
    
    const scores = {};
    let totalScore = 0;
    let count = 0;
    
    rawResults.evaluations.forEach(evaluation => {
      if (evaluation.overall_assessment && evaluation.overall_assessment.persona_score) {
        scores[evaluation.persona] = evaluation.overall_assessment.persona_score;
        totalScore += evaluation.overall_assessment.persona_score;
        count++;
      }
    });
    
    return {
      by_persona: scores,
      average: count > 0 ? (totalScore / count).toFixed(2) : null,
      count: count
    };
  }
  
  getMemoryUsage() {
    try {
      const vmStat = execSync('vm_stat', { encoding: 'utf8' });
      const pageSize = 16384; // macOS page size
      
      const freeMatch = vmStat.match(/Pages free:\s+(\d+)/);
      const activeMatch = vmStat.match(/Pages active:\s+(\d+)/);
      const wiredMatch = vmStat.match(/Pages wired down:\s+(\d+)/);
      
      if (freeMatch && activeMatch && wiredMatch) {
        const freePages = parseInt(freeMatch[1]);
        const activePages = parseInt(activeMatch[1]);
        const wiredPages = parseInt(wiredMatch[1]);
        
        const freeGB = (freePages * pageSize) / (1024 ** 3);
        const usedGB = ((activePages + wiredPages) * pageSize) / (1024 ** 3);
        
        return {
          free_gb: freeGB.toFixed(2),
          used_gb: usedGB.toFixed(2),
          total_gb: '16.00'
        };
      }
    } catch (error) {
      console.warn('Could not get memory usage:', error.message);
    }
    
    return { free_gb: 'unknown', used_gb: 'unknown', total_gb: '16.00' };
  }
  
  async runOptimizationTests() {
    console.log('🚀 Starting Ollama Optimization Testing');
    console.log('=====================================');
    console.log(`Testing ${Object.keys(this.configurations).length} configurations`);
    console.log(`Against ${this.testModels.length} models`);
    console.log(`Results will be saved to: ${this.resultsDir}\n`);
    
    for (const [configName, config] of Object.entries(this.configurations)) {
      console.log(`\n🧪 TESTING CONFIGURATION: ${configName.toUpperCase()}`);
      console.log('=' .repeat(60));
      
      // Configure Ollama for this test
      const configured = await this.restartOllamaWithConfig(configName, config);
      if (!configured) {
        console.log(`⏭️  Skipping ${configName} due to configuration failure`);
        continue;
      }
      
      this.testResults.results[configName] = {
        configuration: config,
        model_results: {}
      };
      
      // Test each model with this configuration
      for (const model of this.testModels) {
        const result = await this.testConfiguration(configName, config, model);
        this.testResults.results[configName].model_results[model] = result;
        
        // Brief pause between tests
        await this.sleep(2000);
      }
      
      // Save intermediate results
      this.saveResults();
    }
    
    // Generate analysis report
    this.generateOptimizationReport();
    
    console.log('\n🏁 Optimization Testing Complete!');
    console.log(`📊 Results: ${path.join(this.resultsDir, 'optimization_results.json')}`);
    console.log(`📈 Report: ${path.join(this.resultsDir, 'optimization_report.md')}`);
  }
  
  saveResults() {
    const resultsFile = path.join(this.resultsDir, 'optimization_results.json');
    fs.writeFileSync(resultsFile, JSON.stringify(this.testResults, null, 2));
  }
  
  generateOptimizationReport() {
    const results = this.testResults.results;
    
    let content = `# Ollama Performance Optimization Results\n\n`;
    content += `**Test Date**: ${this.testResults.timestamp}\n`;
    content += `**Objective**: Optimize single-applicant 6-persona parallel evaluations\n\n`;
    
    // Performance comparison table
    content += `## 🚀 Performance Results\n\n`;
    content += `| Configuration | Model | Duration (s) | Speedup | Avg Score | Memory (GB) | Status |\n`;
    content += `|---------------|--------|-------------|---------|-----------|-------------|--------|\n`;
    
    const baselineTimes = {};
    
    // Collect baseline times first
    if (results.baseline) {
      Object.entries(results.baseline.model_results).forEach(([model, result]) => {
        if (result.success) {
          baselineTimes[model] = result.duration_seconds;
        }
      });
    }
    
    // Generate comparison rows
    Object.entries(results).forEach(([configName, configData]) => {
      Object.entries(configData.model_results).forEach(([model, result]) => {
        const duration = result.success ? result.duration_seconds.toFixed(1) : 'FAILED';
        const speedup = result.success && baselineTimes[model] ? 
          `${(baselineTimes[model] / result.duration_seconds).toFixed(1)}x` : '-';
        const avgScore = result.success ? result.scores.average : '-';
        const memory = result.success ? result.memory_usage.used_gb : '-';
        const status = result.success ? '✅' : '❌';
        
        content += `| ${configName} | ${model} | ${duration} | ${speedup} | ${avgScore} | ${memory} | ${status} |\n`;
      });
    });
    
    // Recommendations
    content += `\n## 🏆 Recommendations\n\n`;
    content += this.generateRecommendations();
    
    // Save report
    const reportFile = path.join(this.resultsDir, 'optimization_report.md');
    fs.writeFileSync(reportFile, content);
  }
  
  generateRecommendations() {
    const results = this.testResults.results;
    
    // Find fastest configuration
    let fastestConfig = null;
    let fastestTime = Infinity;
    let fastestModel = null;
    
    Object.entries(results).forEach(([configName, configData]) => {
      Object.entries(configData.model_results).forEach(([model, result]) => {
        if (result.success && result.duration_seconds < fastestTime) {
          fastestTime = result.duration_seconds;
          fastestConfig = configName;
          fastestModel = model;
        }
      });
    });
    
    let recommendations = '';
    
    if (fastestConfig && fastestModel) {
      recommendations += `### 🥇 Fastest Configuration\n`;
      recommendations += `**${fastestConfig}** with **${fastestModel}**: ${fastestTime.toFixed(1)}s\n\n`;
      
      const configDetails = this.configurations[fastestConfig];
      recommendations += `**Settings**:\n`;
      Object.entries(configDetails).forEach(([key, value]) => {
        if (key.startsWith('OLLAMA_') && value !== null) {
          recommendations += `- ${key}=${value}\n`;
        }
      });
    }
    
    recommendations += `\n### 💡 Production Recommendations\n`;
    recommendations += `Based on the test results, apply the fastest configuration for real-world usage.\n`;
    
    return recommendations;
  }
  
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Run optimization tests
if (require.main === module) {
  const tester = new OllamaOptimizationTester();
  
  tester.runOptimizationTests()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('❌ Optimization testing failed:', error);
      process.exit(1);
    });
}

module.exports = OllamaOptimizationTester;