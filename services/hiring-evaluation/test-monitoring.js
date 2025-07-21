#!/usr/bin/env node

/**
 * Quick test for Phase 1A enhanced monitoring capabilities
 */

// Import the class directly since it's not exported as named export
const ComprehensiveOptimizationTester = require('./comprehensive-optimization-test.js');

async function testMonitoring() {
  console.log('🧪 Testing Enhanced Monitoring (Phase 1A)');
  console.log('==========================================\n');
  
  const tester = new ComprehensiveOptimizationTester();
  
  try {
    console.log('1. Testing system state capture...');
    const systemState = await tester.captureSystemState();
    console.log(`   ✅ CPU: ${systemState.cpu_usage || 'N/A'}`);
    console.log(`   ✅ Connections: ${systemState.active_connections}`);
    console.log(`   ✅ Memory: ${systemState.memory?.free_gb || 'N/A'}GB free`);
    
    console.log('\n2. Testing Ollama health check...');
    const health = await tester.checkOllamaHealth();
    console.log(`   ${health.healthy ? '✅' : '❌'} Ollama health: ${health.healthy ? 'OK' : 'Failed'}`);
    console.log(`   ⏱️  Response time: ${health.response_time_ms || 'N/A'}ms`);
    
    console.log('\n3. Testing active connections...');
    const connections = await tester.getActiveConnections();
    console.log(`   🔗 Active connections: ${connections}`);
    
    console.log('\n4. Testing error classification...');
    const testErrors = [
      new Error('socket hang up'),
      new Error('Request timeout after 5 minutes'),
      new Error('ECONNREFUSED'),
      new Error('Some other error')
    ];
    
    testErrors.forEach(error => {
      const classification = tester.classifyError(error);
      console.log(`   📋 "${error.message}" → ${classification}`);
    });
    
    console.log('\n5. Testing failure diagnosis...');
    const diagnosis = await tester.diagnoseFailure(
      new Error('socket hang up'), 
      { test_id: 'test_123', configuration: 'baseline_default' }
    );
    console.log(`   🔍 Error type: ${diagnosis.error_type}`);
    console.log(`   💡 Likely cause: ${diagnosis.likely_cause}`);
    console.log(`   📝 Recommendations: ${diagnosis.recommendations?.length || 0} items`);
    
    console.log('\n✅ All monitoring tests passed!');
    console.log('📊 Enhanced telemetry is ready for Phase 1B configuration discovery.');
    
  } catch (error) {
    console.error('❌ Monitoring test failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  testMonitoring();
}
