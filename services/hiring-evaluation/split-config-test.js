#!/usr/bin/env node

const EvaluationRunner = require('./evaluation-runner.js');
const fs = require('fs');
const path = require('path');

// Test split configuration: dolphin3:latest @ 0.7, phi3:mini @ 0.3
async function testSplitConfiguration() {
  console.log('🧪 Testing Split Temperature Configuration');
  console.log('📊 Dolphin3:latest @ temp 0.7, Phi3:mini @ temp 0.3\n');
    
  // Load average candidate for testing
  const candidatePath = path.join(__dirname, '..', '..', 'test-resumes', 'average-candidate.json');
  const candidateData = JSON.parse(fs.readFileSync(candidatePath, 'utf8'));
    
  // Copy to evaluation directory
  const applicationPath = path.join(__dirname, '..', '..', '..', 'data', 'applications', 'elovate-director-product-management');
  const targetPath = path.join(applicationPath, 'inputs', 'resume.json');
  fs.writeFileSync(targetPath, JSON.stringify(candidateData, null, 2));
    
  const results = [];
    
  // Test 1: Quality mode (dolphin3:latest @ 0.7)
  try {
    console.log('🔄 Testing QUALITY mode (dolphin3:latest @ temp 0.7)...');
    const qualityRunner = new EvaluationRunner('elovate-director-product-management');
    qualityRunner.setFastMode(false); // Use quality model
        
    const startTime1 = Date.now();
    const qualityResults = await qualityRunner.runEvaluation(candidateData.name);
    const duration1 = (Date.now() - startTime1) / 1000;
        
    const qualityScores = [];
    qualityResults.rawResults.evaluations.forEach(evaluation => {
      const scores = Object.values(evaluation.scores).map(s => s.score);
      qualityScores.push(...scores);
    });
        
    const qualityStats = calculateStats(qualityScores);
        
    results.push({
      mode: 'Quality (dolphin3:latest @ 0.7)',
      duration: duration1,
      stats: qualityStats,
      allScores: qualityScores,
    });
        
    console.log(`   ✅ Duration: ${duration1.toFixed(1)}s`);
    console.log(`   📊 Range: ${qualityStats.min}-${qualityStats.max} (${qualityStats.range} points)`);
    console.log(`   📈 Variance: ${qualityStats.variance} (StdDev: ${qualityStats.stdDev})`);
        
  } catch (error) {
    console.error(`   ❌ Quality mode failed: ${error.message}`);
    results.push({ mode: 'Quality', error: error.message });
  }
    
  // Brief pause
  await new Promise(resolve => setTimeout(resolve, 3000));
    
  // Test 2: Fast mode (phi3:mini @ 0.3)
  try {
    console.log('\n🚀 Testing FAST mode (phi3:mini @ temp 0.3)...');
    const fastRunner = new EvaluationRunner('elovate-director-product-management');
    fastRunner.setFastMode(true); // Use fast model
        
    const startTime2 = Date.now();
    const fastResults = await fastRunner.runEvaluation(candidateData.name);
    const duration2 = (Date.now() - startTime2) / 1000;
        
    const fastScores = [];
    fastResults.rawResults.evaluations.forEach(evaluation => {
      const scores = Object.values(evaluation.scores).map(s => s.score);
      fastScores.push(...scores);
    });
        
    const fastStats = calculateStats(fastScores);
        
    results.push({
      mode: 'Fast (phi3:mini @ 0.3)',
      duration: duration2,
      stats: fastStats,
      allScores: fastScores,
    });
        
    console.log(`   ✅ Duration: ${duration2.toFixed(1)}s`);
    console.log(`   📊 Range: ${fastStats.min}-${fastStats.max} (${fastStats.range} points)`);
    console.log(`   📈 Variance: ${fastStats.variance} (StdDev: ${fastStats.stdDev})`);
        
  } catch (error) {
    console.error(`   ❌ Fast mode failed: ${error.message}`);
    results.push({ mode: 'Fast', error: error.message });
  }
    
  // Analysis
  console.log('\n📈 SPLIT CONFIGURATION ANALYSIS\n');
  console.log('| Mode | Model | Temp | Duration | Range | Variance | StdDev |');
  console.log('|------|-------|------|----------|-------|----------|--------|');
    
  results.filter(r => !r.error).forEach(result => {
    const modelTemp = result.mode.includes('dolphin3') ? 'dolphin3:latest @ 0.7' : 'phi3:mini @ 0.3';
    console.log(`| ${result.mode.split(' ')[0]} | ${modelTemp.split(' ')[0]} | ${modelTemp.split(' @ ')[1]} | ${result.duration.toFixed(1)}s | ${result.stats.min}-${result.stats.max} (${result.stats.range}) | ${result.stats.variance} | ${result.stats.stdDev} |`);
  });
    
  if (results.length === 2 && !results[0].error && !results[1].error) {
    const quality = results[0];
    const fast = results[1];
        
    console.log('\n🎯 CONFIGURATION BENEFITS:');
    console.log(`⚡ Speed difference: ${(quality.duration / fast.duration).toFixed(1)}x faster with fast mode`);
    console.log(`📊 Quality variance: ${quality.stats.variance} (dolphin3 @ 0.7)`);
    console.log(`🚀 Fast variance: ${fast.stats.variance} (phi3 @ 0.3)`);
        
    // Compare to baseline (temp 0.1)
    const baselineVariance = 0.89; // From previous tests
    const qualityImprovement = ((quality.stats.variance - baselineVariance) / baselineVariance) * 100;
    const fastImprovement = ((fast.stats.variance - baselineVariance) / baselineVariance) * 100;
        
    console.log('\n📈 vs Baseline (temp 0.1):');
    console.log(`✅ Quality mode improvement: +${qualityImprovement.toFixed(0)}%`);
    console.log(`✅ Fast mode improvement: +${fastImprovement.toFixed(0)}%`);
        
    console.log('\n🎯 SPLIT CONFIG VERDICT:');
    if (quality.stats.variance >= 1.4 && fast.stats.variance >= 1.0) {
      console.log('✅ EXCELLENT: Both modes provide good differentiation');
      console.log('📋 Use Quality mode for final hiring decisions');
      console.log('⚡ Use Fast mode for initial screening');
    } else {
      console.log('⚠️  MIXED: Some configurations may need adjustment');
    }
  }
    
  // Save results
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const resultsFile = path.join(__dirname, `split-config-results-${timestamp}.json`);
  fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));
  console.log(`\n📁 Results saved: ${resultsFile}`);
    
  return results;
}

function calculateStats(scores) {
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
}

// Run the test
testSplitConfiguration()
  .then(() => {
    console.log('\n✅ Split configuration test completed!');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  });
