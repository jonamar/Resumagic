#!/usr/bin/env npx ts-node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Import the existing evaluation runner
import { EvaluationRunner } from '../evaluation-runner.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface TestConfig {
  testName: string;
  description: string;
  models: string[];
  baselineModel: string;
  candidates: Array<{ file: string; name: string }>;
  thresholds: {
    speedImprovement: number;
    qualityTolerance: number;
  };
  settings: {
    pauseBetweenTests: number;
  };
}

interface TestResult {
  model: string;
  candidate: string;
  duration_seconds: number;
  average_score: number;
  score_variance: number;
  success: boolean;
  error?: string;
}

class ModelComparisonTester {
  private config: TestConfig;
  private resultsDir: string;
  private configFile: string;

  constructor(configPath: string) {
    // Load configuration
    this.configFile = configPath;
    if (!fs.existsSync(configPath)) {
      throw new Error(`Config file not found: ${configPath}`);
    }
    
    this.config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    
    // Setup results directory
    this.resultsDir = path.join(__dirname, `${this.config.testName}-results`);
    if (!fs.existsSync(this.resultsDir)) {
      fs.mkdirSync(this.resultsDir, { recursive: true });
    }
  }

  async testModel(modelName: string, candidateFile: string, candidateName: string): Promise<TestResult> {
    console.log(`🧪 Testing ${modelName} with ${candidateName}...`);
    
    const startTime = Date.now();
    
    try {
      // Create evaluation runner for this candidate
      const evaluator = new EvaluationRunner(candidateFile);
      
      // Override the model for this test
      evaluator.modelName = modelName;
      evaluator.fastModelName = modelName;
      
      // Run the evaluation
      const results = await evaluator.runEvaluation(candidateName);
      
      const duration = (Date.now() - startTime) / 1000;
      
      // Extract scores
      const scores = this.extractScores(results.rawResults);
      
      console.log(`✅ ${modelName} completed in ${duration.toFixed(1)}s - Avg Score: ${scores.average}`);
      
      return {
        model: modelName,
        candidate: candidateName,
        duration_seconds: duration,
        average_score: scores.average,
        score_variance: scores.variance,
        success: true
      };
      
    } catch (error) {
      const duration = (Date.now() - startTime) / 1000;
      console.log(`❌ ${modelName} failed after ${duration.toFixed(1)}s: ${error.message}`);
      
      return {
        model: modelName,
        candidate: candidateName,
        duration_seconds: duration,
        average_score: 0,
        score_variance: 0,
        success: false,
        error: error.message
      };
    }
  }

  private extractScores(rawResults: any) {
    if (!rawResults?.evaluations) {
      return { average: 0, variance: 0 };
    }

    const scores = rawResults.evaluations
      .map(eval => eval.overall_assessment?.persona_score)
      .filter(score => typeof score === 'number');

    if (scores.length === 0) {
      return { average: 0, variance: 0 };
    }

    const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const variance = Math.sqrt(
      scores.reduce((sum, score) => sum + Math.pow(score - average, 2), 0) / scores.length
    );

    return { 
      average: parseFloat(average.toFixed(2)), 
      variance: parseFloat(variance.toFixed(2)) 
    };
  }

  async runComparison() {
    console.log(`🚀 Starting Model Comparison: ${this.config.testName}`);
    console.log(`📝 ${this.config.description}`);
    console.log(`📋 Models: ${this.config.models.join(' vs ')}`);
    console.log(`🎯 Baseline: ${this.config.baselineModel}`);
    console.log('=' .repeat(60));

    const results: TestResult[] = [];

    for (const model of this.config.models) {
      console.log(`\\n📋 TESTING MODEL: ${model}`);
      console.log('-' .repeat(40));

      for (const candidate of this.config.candidates) {
        const result = await this.testModel(model, candidate.file, candidate.name);
        results.push(result);
        
        // Configurable pause between tests
        await new Promise(resolve => setTimeout(resolve, this.config.settings.pauseBetweenTests));
      }
    }

    // Generate comparison report
    this.generateReport(results);
    
    console.log('\\n🏁 Comparison Complete!');
    console.log(`📊 Results saved to: ${this.resultsDir}`);
  }

  private generateReport(results: TestResult[]) {
    const timestamp = new Date().toISOString();
    
    // Save raw results with config
    const resultsFile = path.join(this.resultsDir, `comparison-results-${timestamp.replace(/[:.]/g, '-')}.json`);
    fs.writeFileSync(resultsFile, JSON.stringify({ 
      timestamp, 
      config: this.config,
      configFile: this.configFile,
      results 
    }, null, 2));

    // Generate markdown report
    let report = `# ${this.config.testName} Model Comparison\\n\\n`;
    report += `**Test Date**: ${timestamp}\\n`;
    report += `**Description**: ${this.config.description}\\n`;
    report += `**Models**: ${this.config.models.join(' vs ')}\\n`;
    report += `**Baseline**: ${this.config.baselineModel}\\n`;
    report += `**Config File**: ${this.configFile}\\n\\n`;

    // Calculate averages for each model
    const modelStats = this.config.models.map(model => {
      const modelResults = results.filter(r => r.model === model && r.success);
      return {
        model,
        avgTime: modelResults.length > 0 
          ? (modelResults.reduce((sum, r) => sum + r.duration_seconds, 0) / modelResults.length).toFixed(1)
          : 'FAILED',
        avgScore: modelResults.length > 0 
          ? (modelResults.reduce((sum, r) => sum + r.average_score, 0) / modelResults.length).toFixed(2)
          : 'N/A'
      };
    });

    // Speed comparison
    report += `## ⚡ Speed Results\\n\\n`;
    modelStats.forEach(stats => {
      const isBaseline = stats.model === this.config.baselineModel;
      report += `- **${stats.model}**: ${stats.avgTime}s${isBaseline ? ' (baseline)' : ''}\\n`;
    });

    // Quality comparison
    report += `\\n## 🎯 Quality Results\\n\\n`;
    modelStats.forEach(stats => {
      const isBaseline = stats.model === this.config.baselineModel;
      report += `- **${stats.model}**: ${stats.avgScore}/10${isBaseline ? ' (baseline)' : ''}\\n`;
    });

    // Winner determination
    report += `\\n## 🏆 Recommendation\\n\\n`;
    
    const baselineStats = modelStats.find(s => s.model === this.config.baselineModel);
    const testModelStats = modelStats.filter(s => s.model !== this.config.baselineModel);
    
    if (baselineStats && testModelStats.length > 0) {
      let winner = baselineStats.model;
      let reasoning = [];
      
      testModelStats.forEach(testStats => {
        if (testStats.avgTime !== 'FAILED' && baselineStats.avgTime !== 'FAILED') {
          const speedImprovement = ((parseFloat(baselineStats.avgTime) - parseFloat(testStats.avgTime)) / parseFloat(baselineStats.avgTime) * 100);
          const qualityDiff = parseFloat(testStats.avgScore) - parseFloat(baselineStats.avgScore);
          
          if (speedImprovement > this.config.thresholds.speedImprovement && qualityDiff >= this.config.thresholds.qualityTolerance) {
            winner = testStats.model;
            reasoning.push(`**✅ WINNER: ${testStats.model}**`);
            reasoning.push(`- ${speedImprovement.toFixed(1)}% faster than ${baselineStats.model}`);
            reasoning.push(`- Quality maintained (${qualityDiff >= 0 ? '+' : ''}${qualityDiff.toFixed(2)} score difference)`);
          } else {
            reasoning.push(`**⚖️ ${testStats.model} vs ${baselineStats.model}:**`);
            reasoning.push(`- Speed: ${speedImprovement.toFixed(1)}% improvement (threshold: ${this.config.thresholds.speedImprovement}%)`);
            reasoning.push(`- Quality: ${qualityDiff >= 0 ? '+' : ''}${qualityDiff.toFixed(2)} difference (threshold: ${this.config.thresholds.qualityTolerance})`);
            reasoning.push(`- Insufficient improvement to switch`);
          }
        } else {
          reasoning.push(`**❌ ${testStats.model}: FAILED TO COMPLETE TESTS**`);
        }
      });
      
      if (winner === baselineStats.model) {
        report += `**🏆 RECOMMENDATION: STICK WITH ${baselineStats.model.toUpperCase()}**\\n\\n`;
      }
      
      report += reasoning.join('\\n') + '\\n';
    } else {
      report += `**❌ INCONCLUSIVE**\\n`;
      report += `- Test data insufficient for comparison\\n`;
    }

    const reportFile = path.join(this.resultsDir, `comparison-report-${timestamp.replace(/[:.]/g, '-')}.md`);
    fs.writeFileSync(reportFile, report);
  }
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const configPath = process.argv[2];
  
  if (!configPath) {
    console.error('❌ Usage: npx ts-node model-comparison-test.ts <config-file>');
    console.error('Example: npx ts-node model-comparison-test.ts qwen-vs-phi3.config.json');
    process.exit(1);
  }

  try {
    const tester = new ModelComparisonTester(configPath);
    tester.runComparison()
      .then(() => process.exit(0))
      .catch(error => {
        console.error('❌ Comparison failed:', error);
        process.exit(1);
      });
  } catch (error) {
    console.error('❌ Failed to initialize tester:', error.message);
    process.exit(1);
  }
}