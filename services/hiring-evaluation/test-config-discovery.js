#!/usr/bin/env node

/**
 * Phase 1B Configuration Discovery Test
 * Tests concurrency limits and resource thresholds for optimal configuration
 */

const ComprehensiveOptimizationTester = require('./comprehensive-optimization-test.js');

async function testConfigurationDiscovery() {
  console.log('🔬 Testing Configuration Discovery (Phase 1B)');
  console.log('==============================================\n');
  
  const tester = new ComprehensiveOptimizationTester();
  
  try {
    // Test with baseline model first
    const testModel = { name: 'dolphin3:latest', category: 'baseline' };
    const configName = 'baseline_default';
    
    console.log('1. Testing resource threshold measurement...');
    const thresholds = await tester.measureResourceThresholds(configName, testModel);
    console.log(`   ✅ Baseline memory: ${thresholds.baseline_state.memory?.used_gb || 'N/A'}GB`);
    console.log(`   ⚠️  Warning threshold: ${thresholds.memory_warning_gb?.toFixed(2) || 'N/A'}GB`);
    console.log(`   🚨 Critical threshold: ${thresholds.memory_critical_gb?.toFixed(2) || 'N/A'}GB`);
    console.log(`   🔗 Connection limit: ${thresholds.connection_limit}`);
    
    console.log('\n2. Testing concurrency discovery (limited to 4 for safety)...');
    const concurrencyResults = await tester.discoverOptimalConcurrency(configName, testModel, 4);
    console.log(`   🎯 Optimal concurrency: ${concurrencyResults.optimal_concurrency}`);
    console.log(`   📊 Confidence: ${concurrencyResults.confidence}`);
    console.log(`   ✅ Success rate: ${(concurrencyResults.success_rate * 100).toFixed(1)}%`);
    console.log(`   ⏱️  Avg response time: ${concurrencyResults.average_response_time?.toFixed(1) || 'N/A'}ms`);
    console.log(`   💡 Reason: ${concurrencyResults.reason}`);
    
    console.log('\n3. Analyzing results for production recommendations...');
    const recommendations = {
      configuration: configName,
      model: testModel.name,
      optimal_settings: {
        max_concurrent_requests: concurrencyResults.optimal_concurrency,
        memory_monitoring_thresholds: {
          warning_gb: thresholds.memory_warning_gb,
          critical_gb: thresholds.memory_critical_gb,
        },
        connection_limit: thresholds.connection_limit,
        confidence_level: concurrencyResults.confidence,
      },
      performance_characteristics: {
        baseline_memory_usage: parseFloat(thresholds.baseline_state.memory?.used_gb || 0),
        optimal_response_time_ms: concurrencyResults.average_response_time,
        success_rate_at_optimal: concurrencyResults.success_rate,
      },
      production_readiness: concurrencyResults.confidence === 'high' ? 'ready' : 'needs_validation',
    };
    
    console.log('\n📋 Configuration Discovery Summary:');
    console.log('=====================================');
    console.log(`Configuration: ${recommendations.configuration}`);
    console.log(`Model: ${recommendations.model}`);
    console.log(`Optimal Concurrency: ${recommendations.optimal_settings.max_concurrent_requests}`);
    console.log(`Memory Warning: ${recommendations.optimal_settings.memory_monitoring_thresholds.warning_gb?.toFixed(2)}GB`);
    console.log(`Production Ready: ${recommendations.production_readiness}`);
    
    // Save results for later use
    const fs = require('fs');
    const path = require('path');
    const resultsFile = path.join(__dirname, 'config-discovery-results.json');
    fs.writeFileSync(resultsFile, JSON.stringify({
      timestamp: new Date().toISOString(),
      test_type: 'configuration_discovery_phase_1b',
      recommendations,
      raw_data: {
        thresholds,
        concurrency_analysis: concurrencyResults,
      },
    }, null, 2));
    
    console.log(`\n💾 Results saved to: ${resultsFile}`);
    console.log('\n✅ Phase 1B Configuration Discovery completed successfully!');
    console.log('🚀 Ready to proceed with optimized experiment configuration.');
    
  } catch (error) {
    console.error('❌ Configuration discovery test failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

if (require.main === module) {
  testConfigurationDiscovery();
}
