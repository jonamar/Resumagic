#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Model Performance Testing Framework
 * 
 * Tests multiple models for speed and quality on hiring evaluations
 * Saves results in JSON format with full evaluation archives
 */

const TEST_MODELS = {
  // Current baseline
  baseline: 'dolphin3:latest',
  
  // 8B candidates to beat dolphin on quality
  quality_8b: [
    'deepseek-r1:8b',
    'qwen3:8b'
  ],
  
  // 3-4B candidates for speed
  speed_3_4b: [
    'gemma3:4b',
    'phi3:mini', 
    'qwen3:4b'
  ]
};

const TEST_CANDIDATES = [
  { name: 'Alex Johnson', folder: 'test-weak-candidate', expected: 'weak' },
  { name: 'Morgan Davis', folder: 'test-average-candidate', expected: 'average' },
  { name: 'Dr. Sarah Chen', folder: 'test-strong-candidate', expected: 'strong' }
];

class ModelPerformanceTester {
  constructor() {
    this.resultsDir = path.join(__dirname, 'model-test-results');
    this.archiveDir = path.join(this.resultsDir, 'archives');
    this.ensureDirectories();
    
    this.testResults = {
      timestamp: new Date().toISOString(),
      system_info: this.getSystemInfo(),
      baseline_model: TEST_MODELS.baseline,
      test_models: TEST_MODELS,
      results: {}
    };
  }
  
  ensureDirectories() {
    if (!fs.existsSync(this.resultsDir)) {
      fs.mkdirSync(this.resultsDir, { recursive: true });
    }
    if (!fs.existsSync(this.archiveDir)) {
      fs.mkdirSync(this.archiveDir, { recursive: true });
    }
  }
  
  getSystemInfo() {
    try {
      const osInfo = execSync('uname -a', { encoding: 'utf8' }).trim();
      const memInfo = execSync('free -h 2>/dev/null || vm_stat', { encoding: 'utf8' }).trim().split('\\n')[0];
      return { os: osInfo, memory: memInfo };
    } catch (error) {
      return { os: 'Unknown', memory: 'Unknown', error: error.message };
    }
  }
  
  async testModel(modelName, candidateInfo) {
    console.log(`\\n🧪 Testing ${modelName} with ${candidateInfo.name} (${candidateInfo.expected})...`);
    
    const startTime = Date.now();
    const testId = `${modelName.replace(/[^a-zA-Z0-9]/g, '_')}_${candidateInfo.folder}_${Date.now()}`;
    
    try {
      // Modify evaluation runner to use specific model
      const EvaluationRunner = require('./evaluation-runner');
      const evaluator = new EvaluationRunner(candidateInfo.folder);
      
      // Override model for this test
      evaluator.modelName = modelName;
      evaluator.fastModelName = modelName; // Use same model for consistency
      
      console.log(`🔄 Running evaluation with ${modelName}...`);
      const results = await evaluator.runEvaluation(candidateInfo.name);
      
      const duration = (Date.now() - startTime) / 1000;
      
      // Extract key metrics
      const scores = this.extractScores(results.rawResults);
      const qualityMetrics = this.assessQuality(results.rawResults, candidateInfo.expected);
      
      const testResult = {
        model: modelName,
        candidate: candidateInfo,
        duration_seconds: duration,
        success: true,
        scores: scores,
        quality_assessment: qualityMetrics,
        test_id: testId,
        raw_results_file: `${testId}_raw.json`,
        summary_file: `${testId}_summary.md`
      };
      
      // Archive full results
      await this.archiveResults(testId, results);
      
      console.log(`✅ ${modelName} completed in ${duration.toFixed(1)}s`);
      console.log(`   Avg Score: ${scores.average}, Quality: ${qualityMetrics.quality_score}/10`);
      
      return testResult;
      
    } catch (error) {
      const duration = (Date.now() - startTime) / 1000;
      
      console.log(`❌ ${modelName} failed after ${duration.toFixed(1)}s: ${error.message}`);
      
      return {
        model: modelName,
        candidate: candidateInfo,
        duration_seconds: duration,
        success: false,
        error: error.message,
        timeout: duration >= 179,
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
      distribution: this.categorizeScores(Object.values(scores)),
      score_range: count > 0 ? {
        min: Math.min(...Object.values(scores)),
        max: Math.max(...Object.values(scores))
      } : null
    };
  }
  
  categorizeScores(scores) {
    const categories = { reject: 0, weak: 0, solid: 0, strong: 0, exceptional: 0 };
    
    scores.forEach(score => {
      if (score <= 3) categories.reject++;
      else if (score <= 5) categories.weak++;
      else if (score <= 7) categories.solid++;
      else if (score <= 9) categories.strong++;
      else categories.exceptional++;
    });
    
    return categories;
  }
  
  assessQuality(rawResults, expectedLevel) {
    if (!rawResults.evaluations) return { quality_score: 0, issues: ['No evaluations found'] };
    
    const issues = [];
    let qualityScore = 10;
    
    // Check for appropriate score distribution based on expected level
    const avgScore = parseFloat(this.extractScores(rawResults).average);
    
    const expectedScoreRanges = {
      weak: [3, 6],      // Weak candidates should score 3-6
      average: [5, 7],   // Average candidates should score 5-7  
      strong: [7, 9]     // Strong candidates should score 7-9
    };
    
    const [minExpected, maxExpected] = expectedScoreRanges[expectedLevel] || [1, 10];
    
    if (avgScore < minExpected) {
      issues.push(`Score too low: ${avgScore} < ${minExpected} for ${expectedLevel} candidate`);
      qualityScore -= 2;
    } else if (avgScore > maxExpected) {
      issues.push(`Score too high: ${avgScore} > ${maxExpected} for ${expectedLevel} candidate`);
      qualityScore -= 2;
    }
    
    // Check for score variance (good discrimination)
    const scores = Object.values(this.extractScores(rawResults).by_persona);
    const variance = this.calculateVariance(scores);
    if (variance < 0.5) {
      issues.push('Low score variance - poor discrimination between personas');
      qualityScore -= 1;
    }
    
    // Check for feedback quality
    let feedbackQuality = 0;
    rawResults.evaluations.forEach(evaluation => {
      if (evaluation.scores) {
        Object.values(evaluation.scores).forEach(criterion => {
          if (criterion.reasoning && criterion.reasoning.length > 50) {
            feedbackQuality++;
          }
        });
      }
    });
    
    if (feedbackQuality < rawResults.evaluations.length * 2) {
      issues.push('Insufficient detailed feedback in reasoning');
      qualityScore -= 1;
    }
    
    return {
      quality_score: Math.max(0, qualityScore),
      expected_level: expectedLevel,
      actual_avg_score: avgScore,
      score_appropriateness: avgScore >= minExpected && avgScore <= maxExpected,
      variance: variance,
      detailed_feedback_count: feedbackQuality,
      issues: issues
    };
  }
  
  calculateVariance(numbers) {
    const mean = numbers.reduce((a, b) => a + b, 0) / numbers.length;
    const variance = numbers.reduce((sum, num) => sum + Math.pow(num - mean, 2), 0) / numbers.length;
    return Math.sqrt(variance);
  }
  
  async archiveResults(testId, results) {
    // Save raw results
    const rawFile = path.join(this.archiveDir, `${testId}_raw.json`);
    fs.writeFileSync(rawFile, JSON.stringify(results.rawResults, null, 2));
    
    // Save summary
    const summaryFile = path.join(this.archiveDir, `${testId}_summary.md`);
    fs.writeFileSync(summaryFile, results.summary);
  }
  
  async runFullBenchmark() {
    console.log('🚀 Starting Model Performance Benchmark');
    console.log('======================================');
    console.log(`Testing ${Object.keys(TEST_MODELS).length} model categories`);
    console.log(`Against ${TEST_CANDIDATES.length} test candidates`);
    console.log(`Results will be saved to: ${this.resultsDir}\\n`);
    
    // Get all models to test
    const allModels = [
      TEST_MODELS.baseline,
      ...TEST_MODELS.quality_8b,
      ...TEST_MODELS.speed_3_4b
    ];
    
    for (const modelName of allModels) {
      console.log(`\\n📋 TESTING MODEL: ${modelName}`);
      console.log('=' .repeat(50));
      
      const modelResults = [];
      
      for (const candidate of TEST_CANDIDATES) {
        const result = await this.testModel(modelName, candidate);
        modelResults.push(result);
        
        // Brief pause between tests
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      this.testResults.results[modelName] = {
        model_category: this.getModelCategory(modelName),
        total_tests: modelResults.length,
        successful_tests: modelResults.filter(r => r.success).length,
        average_duration: this.calculateAverageDuration(modelResults),
        average_quality: this.calculateAverageQuality(modelResults),
        results: modelResults
      };
      
      // Save intermediate results
      this.saveResults();
    }
    
    // Generate final report
    this.generateFinalReport();
    
    console.log('\\n🏁 Benchmark Complete!');
    console.log(`📊 Results saved to: ${path.join(this.resultsDir, 'benchmark_results.json')}`);
    console.log(`📈 Report saved to: ${path.join(this.resultsDir, 'final_report.md')}`);
  }
  
  getModelCategory(modelName) {
    if (modelName === TEST_MODELS.baseline) return 'baseline';
    if (TEST_MODELS.quality_8b.includes(modelName)) return 'quality_8b';
    if (TEST_MODELS.speed_3_4b.includes(modelName)) return 'speed_3_4b';
    return 'unknown';
  }
  
  calculateAverageDuration(results) {
    const successful = results.filter(r => r.success);
    if (successful.length === 0) return null;
    return (successful.reduce((sum, r) => sum + r.duration_seconds, 0) / successful.length).toFixed(2);
  }
  
  calculateAverageQuality(results) {
    const withQuality = results.filter(r => r.success && r.quality_assessment);
    if (withQuality.length === 0) return null;
    return (withQuality.reduce((sum, r) => sum + r.quality_assessment.quality_score, 0) / withQuality.length).toFixed(2);
  }
  
  saveResults() {
    const resultsFile = path.join(this.resultsDir, 'benchmark_results.json');
    fs.writeFileSync(resultsFile, JSON.stringify(this.testResults, null, 2));
  }
  
  generateFinalReport() {
    // Implementation for markdown report generation
    const reportContent = this.buildReportContent();
    const reportFile = path.join(this.resultsDir, 'final_report.md');
    fs.writeFileSync(reportFile, reportContent);
  }
  
  buildReportContent() {
    const results = this.testResults.results;
    
    let content = `# Model Performance Benchmark Results\\n\\n`;
    content += `**Test Date**: ${this.testResults.timestamp}\\n`;
    content += `**Baseline Model**: ${this.testResults.baseline_model}\\n\\n`;
    
    // Speed comparison
    content += `## ⚡ Speed Results\\n\\n`;
    Object.entries(results).forEach(([model, data]) => {
      const avgTime = data.average_duration || 'FAILED';
      content += `- **${model}**: ${avgTime}s (${data.model_category})\\n`;
    });
    
    // Quality comparison
    content += `\\n## 🎯 Quality Results\\n\\n`;
    Object.entries(results).forEach(([model, data]) => {
      const avgQuality = data.average_quality || 'N/A';
      content += `- **${model}**: ${avgQuality}/10 (${data.model_category})\\n`;
    });
    
    // Winner selection
    content += `\\n## 🏆 Recommended Models\\n\\n`;
    content += this.selectWinners();
    
    return content;
  }
  
  selectWinners() {
    const results = this.testResults.results;
    
    // Find best quality 8B model
    const quality8bResults = Object.entries(results)
      .filter(([model, data]) => data.model_category === 'quality_8b')
      .sort((a, b) => (b[1].average_quality || 0) - (a[1].average_quality || 0));
    
    // Find best speed 3-4B model  
    const speed34bResults = Object.entries(results)
      .filter(([model, data]) => data.model_category === 'speed_3_4b')
      .sort((a, b) => (a[1].average_duration || 999) - (b[1].average_duration || 999));
    
    let recommendations = '';
    
    if (quality8bResults.length > 0) {
      const [winnerModel, winnerData] = quality8bResults[0];
      recommendations += `### 🥇 Quality Winner (8B): ${winnerModel}\\n`;
      recommendations += `- Quality Score: ${winnerData.average_quality}/10\\n`;
      recommendations += `- Average Time: ${winnerData.average_duration}s\\n\\n`;
    }
    
    if (speed34bResults.length > 0) {
      const [winnerModel, winnerData] = speed34bResults[0];
      recommendations += `### 🚀 Speed Winner (3-4B): ${winnerModel}\\n`;
      recommendations += `- Average Time: ${winnerData.average_duration}s\\n`;
      recommendations += `- Quality Score: ${winnerData.average_quality}/10\\n\\n`;
    }
    
    return recommendations;
  }
}

// CLI interface
if (require.main === module) {
  const tester = new ModelPerformanceTester();
  
  tester.runFullBenchmark()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('❌ Benchmark failed:', error);
      process.exit(1);
    });
}

module.exports = ModelPerformanceTester;