#!/usr/bin/env node

const ModelPerformanceTester = require('./model-performance-test.js');

/**
 * Quick focused benchmark of most promising models
 * Tests speed winners vs quality winners with single test case
 */

class QuickBenchmark extends ModelPerformanceTester {
  async runQuickBenchmark() {
    console.log('🚀 Quick Model Benchmark - Top Candidates');
    console.log('==========================================');
    
    // Focus on most promising models based on community feedback
    const testModels = [
      'dolphin3:latest',  // Current baseline
      'phi3:mini',        // Fastest small model
      'gemma3:4b',        // Google's optimized 4B
      'qwen3:8b'          // Top 8B candidate
    ];
    
    // Test with weak candidate for fastest feedback
    const testCandidate = { 
      name: 'Alex Johnson', 
      folder: 'test-weak-candidate', 
      expected: 'weak' 
    };
    
    console.log(`Testing ${testModels.length} models with ${testCandidate.name}\\n`);
    
    for (const modelName of testModels) {
      console.log(`\\n📋 TESTING: ${modelName}`);
      console.log('=' .repeat(40));
      
      const result = await this.testModel(modelName, testCandidate);
      
      // Immediate feedback
      if (result.success) {
        console.log(`✅ ${modelName}: ${result.duration_seconds}s, Quality: ${result.quality_assessment.quality_score}/10`);
        console.log(`   Avg Score: ${result.scores.average} (expected 3-6 for weak candidate)`);
        console.log(`   Score Range: ${result.scores.score_range.min}-${result.scores.score_range.max}`);
      } else {
        console.log(`❌ ${modelName}: FAILED after ${result.duration_seconds}s`);
      }
      
      // Store result
      this.testResults.results[modelName] = {
        model_category: this.getModelCategory(modelName),
        quick_test_result: result
      };
    }
    
    // Save results and generate report
    this.saveResults();
    this.generateQuickReport();
    
    console.log('\\n🏁 Quick Benchmark Complete!');
    console.log(`📊 Results: ${this.resultsDir}/quick_benchmark.json`);
    console.log(`📈 Report: ${this.resultsDir}/quick_report.md`);
  }
  
  generateQuickReport() {
    const results = this.testResults.results;
    
    let content = '# Quick Model Benchmark Results\\n\\n';
    content += `**Test Date**: ${this.testResults.timestamp}\\n`;
    content += '**Test Candidate**: Alex Johnson (Weak - Expected scores 3-6)\\n\\n';
    
    // Speed ranking
    const speedRanking = Object.entries(results)
      .filter(([model, data]) => data.quick_test_result.success)
      .sort((a, b) => a[1].quick_test_result.duration_seconds - b[1].quick_test_result.duration_seconds);
    
    content += '## ⚡ Speed Ranking\\n\\n';
    speedRanking.forEach(([model, data], index) => {
      const time = data.quick_test_result.duration_seconds;
      const improvement = index === 0 ? 'FASTEST' : 
        `${((speedRanking[0][1].quick_test_result.duration_seconds / time - 1) * -100).toFixed(1)}% slower`;
      content += `${index + 1}. **${model}**: ${time}s (${improvement})\\n`;
    });
    
    // Quality ranking  
    const qualityRanking = Object.entries(results)
      .filter(([model, data]) => data.quick_test_result.success)
      .sort((a, b) => b[1].quick_test_result.quality_assessment.quality_score - a[1].quick_test_result.quality_assessment.quality_score);
    
    content += '\\n## 🎯 Quality Ranking\\n\\n';
    qualityRanking.forEach(([model, data], index) => {
      const quality = data.quick_test_result.quality_assessment.quality_score;
      const avgScore = data.quick_test_result.scores.average;
      const appropriate = data.quick_test_result.quality_assessment.score_appropriateness ? '✅' : '❌';
      content += `${index + 1}. **${model}**: ${quality}/10 (Avg: ${avgScore} ${appropriate})\\n`;
    });
    
    // Recommendations
    content += '\\n## 🏆 Quick Recommendations\\n\\n';
    
    if (speedRanking.length > 0) {
      const fastestModel = speedRanking[0][0];
      const fastestTime = speedRanking[0][1].quick_test_result.duration_seconds;
      const fastestQuality = speedRanking[0][1].quick_test_result.quality_assessment.quality_score;
      content += `**Speed Winner**: ${fastestModel} (${fastestTime}s, ${fastestQuality}/10 quality)\\n`;
    }
    
    if (qualityRanking.length > 0) {
      const bestModel = qualityRanking[0][0];
      const bestQuality = qualityRanking[0][1].quick_test_result.quality_assessment.quality_score;
      const bestTime = qualityRanking[0][1].quick_test_result.duration_seconds;
      content += `**Quality Winner**: ${bestModel} (${bestQuality}/10 quality, ${bestTime}s)\\n`;
    }
    
    // Save report
    const reportFile = require('path').join(this.resultsDir, 'quick_report.md');
    require('fs').writeFileSync(reportFile, content);
    
    // Also save JSON results  
    const jsonFile = require('path').join(this.resultsDir, 'quick_benchmark.json');
    require('fs').writeFileSync(jsonFile, JSON.stringify(this.testResults, null, 2));
  }
  
  getModelCategory(modelName) {
    if (modelName === 'dolphin3:latest') return 'baseline';
    if (modelName === 'qwen3:8b') return 'quality_8b';
    return 'speed_3_4b';
  }
}

// Run quick benchmark
const quickBench = new QuickBenchmark();
quickBench.runQuickBenchmark()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Quick benchmark failed:', error);
    process.exit(1);
  });