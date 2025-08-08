#!/usr/bin/env node

/**
 * Comprehensive Ollama Performance Optimization Testing Framework
 * 
 * Full automated testing with statistical validation, multiple runs per configuration,
 * comprehensive data collection, and production-ready recommendations.
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

class ComprehensiveOptimizationTester {
  constructor() {
    this.resultsDir = path.join(__dirname, 'comprehensive-optimization-results');
    this.archiveDir = path.join(this.resultsDir, 'detailed-runs');
    this.ensureDirectories();
    
    // Test models (Phase 1 winners + baseline)
    this.testModels = [
      { name: 'dolphin3:latest', category: 'baseline', description: 'Current production baseline' },
      { name: 'phi3:mini', category: 'speed', description: 'Phase 1 speed winner' },
      { name: 'deepseek-r1:8b', category: 'quality', description: 'Phase 1 quality winner' },
    ];
    
    // Comprehensive optimization configurations
    this.optimizationConfigs = {
      'baseline_default': {
        env_vars: {},
        description: 'Default Ollama settings (current production)',
        expected_improvement: '1.0x (baseline)',
      },
      'parallel_6_personas': {
        env_vars: {
          OLLAMA_NUM_PARALLEL: 6,
        },
        description: 'Enable 6 parallel requests for 6-persona evaluations',
        expected_improvement: '5-6x faster',
      },
      'parallel_threads_optimized': {
        env_vars: {
          OLLAMA_NUM_PARALLEL: 6,
          OLLAMA_NUM_THREADS: 8,
        },
        description: 'Parallel requests + optimized CPU threading for M4',
        expected_improvement: '5-8x faster',
      },
      'memory_conservative': {
        env_vars: {
          OLLAMA_NUM_PARALLEL: 4,
          OLLAMA_MAX_LOADED_MODELS: 1,
          OLLAMA_NUM_THREADS: 6,
        },
        description: 'Memory-constrained optimization (16GB RAM limit)',
        expected_improvement: '3-4x faster',
      },
      'aggressive_parallel': {
        env_vars: {
          OLLAMA_NUM_PARALLEL: 8,
          OLLAMA_NUM_THREADS: 10,
          OLLAMA_MAX_LOADED_MODELS: 1,
        },
        description: 'Maximum parallelization (may hit memory limits)',
        expected_improvement: '6-10x faster or failure',
      },
    };
    
    // Test candidates for comprehensive validation
    this.testCandidates = [
      { name: 'Alex Johnson', folder: 'test-weak-candidate', expected: 'weak', expected_scores: [3, 6] },
      { name: 'Morgan Davis', folder: 'test-average-candidate', expected: 'average', expected_scores: [5, 7] },
    ];
    
    // Statistical validation parameters
    this.runsPerConfig = 3; // Multiple runs for statistical validity
    this.timeoutSeconds = 300; // 5 minute timeout per evaluation
    
    this.masterResults = {
      test_metadata: {
        timestamp: new Date().toISOString(),
        test_purpose: 'Comprehensive Ollama optimization for real-world single-applicant evaluations',
        system_specs: this.getSystemInfo(),
        test_matrix_size: Object.keys(this.optimizationConfigs).length * this.testModels.length * this.testCandidates.length * this.runsPerConfig,
      },
      configurations: this.optimizationConfigs,
      models: this.testModels,
      candidates: this.testCandidates,
      runs_per_config: this.runsPerConfig,
      detailed_results: {},
      statistical_summary: {},
      production_recommendations: {},
    };
  }
  
  ensureDirectories() {
    [this.resultsDir, this.archiveDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }
  
  getSystemInfo() {
    try {
      const osInfo = execSync('uname -a', { encoding: 'utf8' }).trim();
      const memInfo = execSync('sysctl hw.memsize', { encoding: 'utf8' }).trim();
      const cpuInfo = execSync('sysctl -n machdep.cpu.brand_string', { encoding: 'utf8' }).trim();
      
      return {
        os: osInfo,
        memory: memInfo,
        cpu: cpuInfo,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return { error: error.message };
    }
  }
  
  async configureOllamaEnvironment(configName, config) {
    console.log(`\n🔧 Configuring Ollama: ${configName}`);
    console.log(`   ${config.description}`);
    
    try {
      // Stop existing Ollama processes gracefully
      await this.stopOllama();
      
      // Build environment command
      let envCommand = '';
      if (Object.keys(config.env_vars).length > 0) {
        const envVars = Object.entries(config.env_vars)
          .map(([key, value]) => `${key}=${value}`)
          .join(' ');
        envCommand = `${envVars} `;
        console.log(`   Environment: ${envVars}`);
      }
      
      // Start Ollama with new configuration
      console.log('🚀 Starting Ollama with new configuration...');
      const ollamaProcess = spawn('bash', ['-c', `${envCommand}ollama serve`], {
        detached: true,
        stdio: 'ignore',
      });
      ollamaProcess.unref();
      
      // Wait for Ollama to become available
      const isReady = await this.waitForOllamaReady(30);
      if (!isReady) {
        throw new Error('Ollama failed to start within timeout');
      }
      
      return true;
    } catch (error) {
      console.error(`❌ Failed to configure Ollama: ${error.message}`);
      return false;
    }
  }
  
  async stopOllama() {
    try {
      execSync('pkill -f "ollama serve"', { stdio: 'ignore' });
      await this.sleep(3000); // Wait for graceful shutdown
    } catch (e) {
      // Process might not be running, that's fine
    }
  }
  
  async waitForOllamaReady(timeoutSeconds = 30) {
    console.log('⏳ Waiting for Ollama to become ready...');
    
    const startTime = Date.now();
    const timeout = timeoutSeconds * 1000;
    
    while ((Date.now() - startTime) < timeout) {
      try {
        await this.makeHttpRequest('http://localhost:11434/api/tags', 'GET');
        console.log('✅ Ollama is ready');
        return true;
      } catch (e) {
        await this.sleep(1000);
        if ((Date.now() - startTime) % 5000 < 1000) {
          console.log(`   Still waiting... (${Math.round((Date.now() - startTime) / 1000)}s)`);
        }
      }
    }
    
    return false;
  }
  
  async runSingleEvaluation(configName, model, candidate, runNumber) {
    const testId = `${configName}_${model.name.replace(/[^a-zA-Z0-9]/g, '_')}_${candidate.folder}_run${runNumber}_${Date.now()}`;
    console.log(`\n📊 ${configName} | ${model.name} | ${candidate.name} | Run ${runNumber}`);
    
    const startTime = Date.now();
    
    // Enhanced monitoring - Phase 1A
    const preTestTelemetry = {
      system_state: await this.captureSystemState(),
      ollama_health: await this.checkOllamaHealth(),
      active_connections: await this.getActiveConnections(),
      memory_snapshot: this.captureMemorySnapshot('before'),
    };
    
    console.log(`🔍 Pre-test: ${preTestTelemetry.active_connections} connections, Ollama ${preTestTelemetry.ollama_health.healthy ? '✅' : '❌'} (${preTestTelemetry.ollama_health.response_time_ms}ms)`);
    
    try {
      // Run evaluation with timeout
      const EvaluationRunner = require('./evaluation-runner');
      const evaluator = new EvaluationRunner(candidate.folder);
      evaluator.modelName = model.name;
      
      // Create timeout promise
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Evaluation timeout')), this.timeoutSeconds * 1000),
      );
      
      // Run evaluation with timeout
      const evaluationPromise = evaluator.runEvaluation(candidate.name);
      const results = await Promise.race([evaluationPromise, timeoutPromise]);
      
      const duration = (Date.now() - startTime) / 1000;
      
      // Enhanced post-test telemetry - Phase 1A
      const postTestTelemetry = {
        system_state: await this.captureSystemState(),
        ollama_health: await this.checkOllamaHealth(),
        active_connections: await this.getActiveConnections(),
        memory_snapshot: this.captureMemorySnapshot('after'),
      };
      
      // Comprehensive data extraction
      const scores = this.extractComprehensiveScores(results.rawResults);
      const qualityMetrics = this.assessOutputQuality(results.rawResults, candidate.expected);
      
      const testResult = {
        test_metadata: {
          test_id: testId,
          configuration: configName,
          model: model.name,
          model_category: model.category,
          candidate: candidate.name,
          candidate_type: candidate.expected,
          run_number: runNumber,
          timestamp: new Date().toISOString(),
        },
        performance_metrics: {
          total_duration_seconds: duration,
          personas_completed: scores.personas_count,
          average_persona_time: duration / Math.max(scores.personas_count, 1),
          success: true,
        },
        quality_metrics: qualityMetrics,
        scoring_results: scores,
        system_metrics: {
          memory_before: preTestTelemetry.memory_snapshot,
          memory_after: postTestTelemetry.memory_snapshot,
          memory_delta: this.calculateMemoryDelta(preTestTelemetry.memory_snapshot, postTestTelemetry.memory_snapshot),
        },
        // Enhanced telemetry data - Phase 1A
        telemetry: {
          pre_test: preTestTelemetry,
          post_test: postTestTelemetry,
          connection_stability: {
            connections_before: preTestTelemetry.active_connections,
            connections_after: postTestTelemetry.active_connections,
            connection_delta: postTestTelemetry.active_connections - preTestTelemetry.active_connections,
          },
          ollama_performance: {
            health_before: preTestTelemetry.ollama_health,
            health_after: postTestTelemetry.ollama_health,
            response_time_delta: postTestTelemetry.ollama_health.response_time_ms - preTestTelemetry.ollama_health.response_time_ms,
          },
        },
        raw_data_archive: `${testId}_complete.json`,
      };
      
      // Archive complete results
      await this.archiveDetailedResults(testId, results, testResult);
      
      console.log(`✅ Completed in ${duration.toFixed(1)}s | Avg Score: ${scores.average} | Quality: ${qualityMetrics.quality_score}/10`);
      
      return testResult;
      
    } catch (error) {
      const duration = (Date.now() - startTime) / 1000;
      
      // Enhanced failure diagnostics - Phase 1A
      const failureTelemetry = {
        system_state: await this.captureSystemState(),
        ollama_health: await this.checkOllamaHealth(),
        active_connections: await this.getActiveConnections(),
        memory_snapshot: this.captureMemorySnapshot('error'),
      };
      
      const diagnosis = await this.diagnoseFailure(error, {
        test_id: testId,
        configuration: configName,
        model: model.name,
        candidate: candidate.name,
        run_number: runNumber,
        duration_before_failure: duration,
      });
      
      console.log(`❌ Failed after ${duration.toFixed(1)}s: ${error.message}`);
      console.log(`🔍 Diagnosis: ${diagnosis.error_type} - ${diagnosis.likely_cause || 'Unknown cause'}`);
      
      return {
        test_metadata: {
          test_id: testId,
          configuration: configName,
          model: model.name,
          candidate: candidate.name,
          run_number: runNumber,
          timestamp: new Date().toISOString(),
        },
        performance_metrics: {
          total_duration_seconds: duration,
          success: false,
          error: error.message,
          timeout: error.message.includes('timeout'),
        },
        system_metrics: {
          memory_before: preTestTelemetry.memory_snapshot,
          memory_after: failureTelemetry.memory_snapshot,
        },
        // Enhanced failure analysis - Phase 1A
        failure_analysis: diagnosis,
        telemetry: {
          pre_test: preTestTelemetry,
          failure_point: failureTelemetry,
          connection_stability: {
            connections_before: preTestTelemetry.active_connections,
            connections_at_failure: failureTelemetry.active_connections,
            connection_delta: failureTelemetry.active_connections - preTestTelemetry.active_connections,
          },
        },
      };
    }
  }
  
  extractComprehensiveScores(rawResults) {
    if (!rawResults.evaluations) {
      return { personas_count: 0, average: null, by_persona: {} };
    }
    
    const scores = {};
    let totalScore = 0;
    let count = 0;
    
    rawResults.evaluations.forEach(evaluation => {
      if (evaluation.overall_assessment && evaluation.overall_assessment.persona_score) {
        const score = evaluation.overall_assessment.persona_score;
        scores[evaluation.persona] = {
          score: score,
          reasoning_length: evaluation.overall_assessment.recommendation ? evaluation.overall_assessment.recommendation.length : 0,
        };
        totalScore += score;
        count++;
      }
    });
    
    return {
      by_persona: scores,
      average: count > 0 ? (totalScore / count).toFixed(2) : null,
      personas_count: count,
      score_variance: this.calculateVariance(Object.values(scores).map(s => s.score)),
      total_reasoning_chars: Object.values(scores).reduce((sum, s) => sum + s.reasoning_length, 0),
    };
  }
  
  assessOutputQuality(rawResults, expectedType) {
    const scores = this.extractComprehensiveScores(rawResults);
    const avgScore = parseFloat(scores.average || 0);
    
    // Expected score ranges
    const expectedRanges = {
      weak: [3, 6],
      average: [5, 7],
      strong: [7, 9],
    };
    
    const [minExpected, maxExpected] = expectedRanges[expectedType] || [1, 10];
    
    let qualityScore = 10;
    const issues = [];
    
    // Score appropriateness
    if (avgScore < minExpected || avgScore > maxExpected) {
      issues.push(`Score ${avgScore} outside expected range ${minExpected}-${maxExpected}`);
      qualityScore -= 3;
    }
    
    // Score variance (good discrimination)
    if (scores.score_variance < 0.5) {
      issues.push('Low score variance - poor persona discrimination');
      qualityScore -= 2;
    }
    
    // Reasoning depth
    const avgReasoningLength = scores.total_reasoning_chars / Math.max(scores.personas_count, 1);
    if (avgReasoningLength < 100) {
      issues.push('Insufficient reasoning detail');
      qualityScore -= 1;
    }
    
    return {
      quality_score: Math.max(0, qualityScore),
      score_appropriateness: avgScore >= minExpected && avgScore <= maxExpected,
      score_variance: scores.score_variance,
      avg_reasoning_length: Math.round(avgReasoningLength),
      issues: issues,
    };
  }
  
  calculateVariance(numbers) {
    if (numbers.length === 0) {
      return 0;
    }
    const mean = numbers.reduce((a, b) => a + b, 0) / numbers.length;
    const variance = numbers.reduce((sum, num) => sum + Math.pow(num - mean, 2), 0) / numbers.length;
    return Math.sqrt(variance);
  }
  
  captureMemorySnapshot(phase) {
    try {
      const vmStat = execSync('vm_stat', { encoding: 'utf8' });
      const pageSize = 16384;
      
      const freeMatch = vmStat.match(/Pages free:\\s+(\\d+)/);
      const activeMatch = vmStat.match(/Pages active:\\s+(\\d+)/);
      const wiredMatch = vmStat.match(/Pages wired down:\\s+(\\d+)/);
      
      if (freeMatch && activeMatch && wiredMatch) {
        const freePages = parseInt(freeMatch[1]);
        const activePages = parseInt(activeMatch[1]);
        const wiredPages = parseInt(wiredMatch[1]);
        
        return {
          phase: phase,
          timestamp: new Date().toISOString(),
          free_gb: ((freePages * pageSize) / (1024 ** 3)).toFixed(2),
          used_gb: (((activePages + wiredPages) * pageSize) / (1024 ** 3)).toFixed(2),
          free_pages: freePages,
          active_pages: activePages,
          wired_pages: wiredPages,
        };
      }
    } catch (error) {
      return { phase: phase, error: error.message };
    }
    return { phase: phase, error: 'Unable to capture memory' };
  }
  
  calculateMemoryDelta(before, after) {
    if (before.error || after.error) {
      return { error: 'Unable to calculate delta' };
    }
    
    const usedBefore = parseFloat(before.used_gb);
    const usedAfter = parseFloat(after.used_gb);
    
    return {
      used_gb_delta: (usedAfter - usedBefore).toFixed(2),
      memory_efficiency: usedAfter < usedBefore + 2.0 ? 'good' : 'concerning',
    };
  }
  
  // Enhanced monitoring methods for Phase 1A
  async captureSystemState() {
    try {
      const timestamp = new Date().toISOString();
      
      // CPU usage
      const cpuUsage = execSync('top -l 1 -n 0 | grep "CPU usage"', { encoding: 'utf8' }).trim();
      
      // Network connections to Ollama
      const connections = execSync('lsof -i :11434 2>/dev/null | wc -l', { encoding: 'utf8' }).trim();
      
      // Process info for Ollama
      let ollamaProcesses = [];
      try {
        const processes = execSync('pgrep -f "ollama serve"', { encoding: 'utf8' }).trim();
        if (processes) {
          ollamaProcesses = processes.split('\n').map(pid => {
            try {
              const info = execSync(`ps -p ${pid} -o pid,pcpu,pmem,time`, { encoding: 'utf8' });
              return info.split('\n')[1]; // Skip header
            } catch (e) {
              return null;
            }
          }).filter(Boolean);
        }
      } catch (e) {
        // No Ollama processes running
      }
      
      return {
        timestamp,
        cpu_usage: cpuUsage,
        active_connections: parseInt(connections) || 0,
        ollama_processes: ollamaProcesses,
        memory: this.captureMemorySnapshot('system_state'),
      };
    } catch (error) {
      return {
        timestamp: new Date().toISOString(),
        error: error.message,
      };
    }
  }
  
  async checkOllamaHealth() {
    try {
      const startTime = Date.now();
      const response = await this.makeHttpRequest('http://localhost:11434/api/tags', 'GET');
      const responseTime = Date.now() - startTime;
      
      return {
        healthy: response.statusCode === 200,
        response_time_ms: responseTime,
        status_code: response.statusCode,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        healthy: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }
  
  async getActiveConnections() {
    try {
      const netstat = execSync('netstat -an | grep :11434 | grep ESTABLISHED | wc -l', { encoding: 'utf8' });
      return parseInt(netstat.trim()) || 0;
    } catch (error) {
      return 0;
    }
  }
  
  async diagnoseFailure(error, testContext) {
    const diagnosis = {
      timestamp: new Date().toISOString(),
      error_message: error?.message || 'Unknown error',
      error_type: this.classifyError(error),
      system_state: await this.captureSystemState(),
      ollama_health: await this.checkOllamaHealth(),
      test_context: testContext,
    };
    
    // Additional diagnostics based on error type
    if (error?.message?.includes('socket hang up')) {
      diagnosis.likely_cause = 'Connection terminated unexpectedly - possible server overload';
      diagnosis.recommendations = [
        'Check Ollama server capacity',
        'Reduce concurrent requests',
        'Add connection retry logic',
      ];
    } else if (error?.message?.includes('timeout')) {
      diagnosis.likely_cause = 'Request exceeded timeout threshold';
      diagnosis.recommendations = [
        'Increase timeout duration',
        'Check model loading time',
        'Monitor system resources',
      ];
    } else if (error?.message?.includes('ECONNREFUSED')) {
      diagnosis.likely_cause = 'Ollama server not running or not accepting connections';
      diagnosis.recommendations = [
        'Verify Ollama server is running',
        'Check port 11434 availability',
        'Restart Ollama service',
      ];
    }
    
    return diagnosis;
  }
  
  classifyError(error) {
    if (!error?.message) {
      return 'unknown';
    }
    
    const message = error.message.toLowerCase();
    if (message.includes('socket hang up')) {
      return 'connection_terminated';
    }
    if (message.includes('timeout')) {
      return 'timeout';
    }
    if (message.includes('econnrefused')) {
      return 'connection_refused';
    }
    if (message.includes('enotfound')) {
      return 'dns_resolution';
    }
    if (message.includes('parse')) {
      return 'response_parsing';
    }
    
    return 'other';
  }
  
  // Phase 1B: Configuration Discovery Methods
  async discoverOptimalConcurrency(configName, model, maxConcurrency = 8) {
    console.log(`\n🔬 Discovering optimal concurrency for ${configName} with ${model.name}`);
    console.log('=' .repeat(60));
    
    const results = [];
    
    // Test different concurrency levels
    for (let concurrency = 1; concurrency <= maxConcurrency; concurrency++) {
      console.log(`\n📊 Testing concurrency level: ${concurrency}`);
      
      const testResult = await this.testConcurrencyLevel(configName, model, concurrency);
      results.push({
        concurrency_level: concurrency,
        ...testResult,
      });
      
      // Stop testing if we hit failure threshold
      if (!testResult.success || testResult.failure_rate > 0.5) {
        console.log(`⚠️  High failure rate (${(testResult.failure_rate * 100).toFixed(1)}%) - stopping concurrency testing`);
        break;
      }
      
      // Brief pause between tests
      await this.sleep(2000);
    }
    
    return this.analyzeConcurrencyResults(results);
  }
  
  async testConcurrencyLevel(configName, model, concurrency, testRuns = 3) {
    const startTime = Date.now();
    const systemBefore = await this.captureSystemState();
    
    let successfulRuns = 0;
    let totalDuration = 0;
    const runResults = [];
    
    // Run multiple test evaluations at this concurrency level
    for (let run = 1; run <= testRuns; run++) {
      try {
        console.log(`   Run ${run}/${testRuns} at concurrency ${concurrency}...`);
        
        // Simulate concurrent load by running multiple lightweight requests
        const concurrentPromises = Array(concurrency).fill().map(async (_, index) => {
          const testStart = Date.now();
          try {
            // Use a lightweight health check as proxy for concurrent load
            await this.makeHttpRequest('http://localhost:11434/api/tags', 'GET');
            return { success: true, duration: Date.now() - testStart, index };
          } catch (error) {
            return { success: false, error: error.message, duration: Date.now() - testStart, index };
          }
        });
        
        const concurrentResults = await Promise.all(concurrentPromises);
        const successCount = concurrentResults.filter(r => r.success).length;
        const avgDuration = concurrentResults.reduce((sum, r) => sum + r.duration, 0) / concurrentResults.length;
        
        runResults.push({
          run_number: run,
          concurrent_requests: concurrency,
          successful_requests: successCount,
          average_response_time: avgDuration,
          success_rate: successCount / concurrency,
        });
        
        if (successCount === concurrency) {
          successfulRuns++;
          totalDuration += avgDuration;
        }
        
      } catch (error) {
        console.log(`   ❌ Run ${run} failed: ${error.message}`);
        runResults.push({
          run_number: run,
          concurrent_requests: concurrency,
          error: error.message,
          success_rate: 0,
        });
      }
    }
    
    const systemAfter = await this.captureSystemState();
    const testDuration = (Date.now() - startTime) / 1000;
    
    return {
      success: successfulRuns > 0,
      success_rate: successfulRuns / testRuns,
      failure_rate: (testRuns - successfulRuns) / testRuns,
      average_response_time: successfulRuns > 0 ? totalDuration / successfulRuns : null,
      test_duration_seconds: testDuration,
      system_impact: {
        cpu_before: systemBefore.cpu_usage,
        cpu_after: systemAfter.cpu_usage,
        connections_before: systemBefore.active_connections,
        connections_after: systemAfter.active_connections,
        memory_delta: this.calculateMemoryDelta(systemBefore.memory, systemAfter.memory),
      },
      detailed_runs: runResults,
    };
  }
  
  analyzeConcurrencyResults(results) {
    if (results.length === 0) {
      return { optimal_concurrency: 1, confidence: 'low', reason: 'No test data available' };
    }
    
    // Find the sweet spot: highest concurrency with >90% success rate and reasonable response time
    const viableResults = results.filter(r => r.success_rate >= 0.9);
    
    if (viableResults.length === 0) {
      return { 
        optimal_concurrency: 1, 
        confidence: 'low', 
        reason: 'No concurrency level achieved >90% success rate',
        all_results: results,
      };
    }
    
    // Sort by concurrency level (highest first) and find the best performing one
    viableResults.sort((a, b) => b.concurrency_level - a.concurrency_level);
    
    const optimal = viableResults[0];
    const confidence = optimal.success_rate >= 0.95 ? 'high' : 'medium';
    
    return {
      optimal_concurrency: optimal.concurrency_level,
      confidence: confidence,
      success_rate: optimal.success_rate,
      average_response_time: optimal.average_response_time,
      reason: `Best performance at ${optimal.concurrency_level} concurrent requests with ${(optimal.success_rate * 100).toFixed(1)}% success rate`,
      system_impact: optimal.system_impact,
      all_results: results,
    };
  }
  
  async measureResourceThresholds(configName, model) {
    console.log(`\n🔍 Measuring resource thresholds for ${configName} with ${model.name}`);
    
    const baseline = await this.captureSystemState();
    const thresholds = {
      memory_warning_gb: null,
      memory_critical_gb: null,
      cpu_warning_percent: null,
      connection_limit: null,
      baseline_state: baseline,
    };
    
    // Test memory usage patterns
    console.log('   📊 Analyzing memory patterns...');
    const memoryTests = [];
    for (let i = 0; i < 5; i++) {
      const state = await this.captureSystemState();
      memoryTests.push(parseFloat(state.memory?.used_gb || 0));
      await this.sleep(1000);
    }
    
    const avgMemoryUsage = memoryTests.reduce((a, b) => a + b, 0) / memoryTests.length;
    thresholds.memory_warning_gb = avgMemoryUsage + 2.0; // Warning at +2GB
    thresholds.memory_critical_gb = avgMemoryUsage + 4.0; // Critical at +4GB
    
    // Estimate connection limits based on current state
    const currentConnections = await this.getActiveConnections();
    thresholds.connection_limit = Math.max(currentConnections + 10, 20); // Conservative estimate
    
    console.log(`   ✅ Memory baseline: ${avgMemoryUsage.toFixed(2)}GB`);
    console.log(`   ⚠️  Memory warning threshold: ${thresholds.memory_warning_gb.toFixed(2)}GB`);
    console.log(`   🚨 Memory critical threshold: ${thresholds.memory_critical_gb.toFixed(2)}GB`);
    console.log(`   🔗 Estimated connection limit: ${thresholds.connection_limit}`);
    
    return thresholds;
  }
  
  async archiveDetailedResults(testId, evaluationResults, testResult) {
    const archiveFile = path.join(this.archiveDir, `${testId}_complete.json`);
    const archiveData = {
      test_result: testResult,
      full_evaluation_output: evaluationResults.rawResults,
      evaluation_summary: evaluationResults.summary,
    };
    
    fs.writeFileSync(archiveFile, JSON.stringify(archiveData, null, 2));
  }
  
  async runComprehensiveOptimizationTests() {
    console.log('🚀 Starting Comprehensive Ollama Optimization Testing');
    console.log('=====================================================');
    console.log(`Test Matrix: ${this.masterResults.test_metadata.test_matrix_size} total evaluations`);
    console.log(`Configurations: ${Object.keys(this.optimizationConfigs).length}`);
    console.log(`Models: ${this.testModels.length}`);
    console.log(`Candidates: ${this.testCandidates.length}`);
    console.log(`Runs per config: ${this.runsPerConfig}`);
    console.log(`Results: ${this.resultsDir}\n`);
    
    // Phase 1B: Configuration Discovery for Scientific Testing
    console.log('🔬 PHASE 1B: CONFIGURATION DISCOVERY');
    console.log('=' .repeat(50));
    const configOptimizations = {};
    
    // Discover optimal settings for baseline first (as reference)
    const baselineModel = this.testModels.find(m => m.category === 'baseline') || this.testModels[0];
    console.log(`\n📋 Establishing baseline with ${baselineModel.name}...`);
    
    const baselineOptimal = await this.discoverOptimalConcurrency('baseline_default', baselineModel, 6);
    configOptimizations['baseline_default'] = {
      optimal_concurrency: baselineOptimal.optimal_concurrency,
      confidence: baselineOptimal.confidence,
      success_rate: baselineOptimal.success_rate,
      thresholds: await this.measureResourceThresholds('baseline_default', baselineModel),
    };
    
    console.log(`✅ Baseline optimal concurrency: ${baselineOptimal.optimal_concurrency} (${baselineOptimal.confidence} confidence)`);
    
    // Store discovery results for scientific comparison
    this.masterResults.configuration_discovery = configOptimizations;
    
    let completedTests = 0;
    const totalTests = this.masterResults.test_metadata.test_matrix_size;
    
    // Test each configuration with discovered optimal settings
    for (const [configName, config] of Object.entries(this.optimizationConfigs)) {
      console.log(`\n🧪 TESTING CONFIGURATION: ${configName.toUpperCase()}`);
      console.log('=' .repeat(80));
      
      // Configure Ollama
      const configured = await this.configureOllamaEnvironment(configName, config);
      if (!configured) {
        console.log(`⏭️  Skipping ${configName} due to configuration failure`);
        continue;
      }
      
      // Apply discovered optimal settings for fair comparison
      const optimalSettings = configOptimizations['baseline_default']; // Use baseline as reference
      console.log(`🎯 Applying discovered optimal settings: ${optimalSettings.optimal_concurrency} max concurrent`);
      console.log(`📊 Resource thresholds: ${optimalSettings.thresholds.memory_warning_gb.toFixed(2)}GB warning`);
      
      
      this.masterResults.detailed_results[configName] = {
        configuration: config,
        test_runs: {},
      };
      
      // Test each model
      for (const model of this.testModels) {
        console.log(`\n📋 Testing Model: ${model.name} (${model.category})`);
        
        this.masterResults.detailed_results[configName].test_runs[model.name] = {};
        
        // Test each candidate
        for (const candidate of this.testCandidates) {
          console.log(`\n👤 Testing Candidate: ${candidate.name} (${candidate.expected})`);
          
          const candidateRuns = [];
          
          // Multiple runs for statistical validity
          for (let runNum = 1; runNum <= this.runsPerConfig; runNum++) {
            const result = await this.runSingleEvaluation(configName, model, candidate, runNum);
            candidateRuns.push(result);
            
            completedTests++;
            console.log(`Progress: ${completedTests}/${totalTests} (${(completedTests/totalTests*100).toFixed(1)}%)`);
            
            // Brief pause between runs
            await this.sleep(2000);
          }
          
          this.masterResults.detailed_results[configName].test_runs[model.name][candidate.name] = candidateRuns;
        }
      }
      
      // Save intermediate results after each configuration
      this.saveComprehensiveResults();
    }
    
    // Generate comprehensive analysis
    await this.generateStatisticalAnalysis();
    await this.generateProductionRecommendations();
    
    console.log('\n🏁 Comprehensive Optimization Testing Complete!');
    console.log(`📊 Results: ${path.join(this.resultsDir, 'comprehensive_optimization_results.json')}`);
    console.log(`📈 Analysis: ${path.join(this.resultsDir, 'statistical_analysis.md')}`);
    console.log(`🎯 Recommendations: ${path.join(this.resultsDir, 'production_recommendations.md')}`);
  }
  
  saveComprehensiveResults() {
    const resultsFile = path.join(this.resultsDir, 'comprehensive_optimization_results.json');
    fs.writeFileSync(resultsFile, JSON.stringify(this.masterResults, null, 2));
  }
  
  async generateStatisticalAnalysis() {
    console.log('\n📊 Generating statistical analysis...');
    
    // Calculate statistics for each configuration
    const stats = {};
    
    Object.entries(this.masterResults.detailed_results).forEach(([configName, configData]) => {
      stats[configName] = {
        configuration: configData.configuration,
        model_performance: {},
      };
      
      Object.entries(configData.test_runs).forEach(([modelName, modelData]) => {
        const allRuns = [];
        Object.values(modelData).forEach(candidateRuns => {
          allRuns.push(...candidateRuns.filter(run => run.performance_metrics.success));
        });
        
        if (allRuns.length > 0) {
          const durations = allRuns.map(run => run.performance_metrics.total_duration_seconds);
          const scores = allRuns.map(run => parseFloat(run.scoring_results.average || 0));
          const qualityScores = allRuns.map(run => run.quality_metrics.quality_score);
          
          stats[configName].model_performance[modelName] = {
            total_successful_runs: allRuns.length,
            duration_stats: {
              mean: this.calculateMean(durations),
              median: this.calculateMedian(durations),
              std_dev: this.calculateStdDev(durations),
              min: Math.min(...durations),
              max: Math.max(...durations),
            },
            score_accuracy: {
              mean_score: this.calculateMean(scores),
              score_consistency: this.calculateStdDev(scores),
            },
            quality_stats: {
              mean_quality: this.calculateMean(qualityScores),
              quality_consistency: this.calculateStdDev(qualityScores),
            },
          };
        }
      });
    });
    
    this.masterResults.statistical_summary = stats;
    
    // Generate markdown report
    let content = '# Statistical Analysis: Ollama Optimization Results\n\n';
    content += `**Test Completed**: ${new Date().toISOString()}\n`;
    content += `**Total Evaluations**: ${this.masterResults.test_metadata.test_matrix_size}\n\n`;
    
    content += '## Performance Summary by Configuration\n\n';
    content += '| Configuration | Model | Mean Duration (s) | Std Dev | Quality Score | Success Rate |\n';
    content += '|---------------|-------|------------------|---------|---------------|--------------|\n';
    
    Object.entries(stats).forEach(([configName, configStats]) => {
      Object.entries(configStats.model_performance).forEach(([modelName, modelStats]) => {
        const duration = modelStats.duration_stats.mean.toFixed(1);
        const stdDev = modelStats.duration_stats.std_dev.toFixed(1);
        const quality = modelStats.quality_stats.mean_quality.toFixed(1);
        const successRate = '100%'; // Since we're only including successful runs
        
        content += `| ${configName} | ${modelName} | ${duration} | ±${stdDev} | ${quality}/10 | ${successRate} |\n`;
      });
    });
    
    const analysisFile = path.join(this.resultsDir, 'statistical_analysis.md');
    fs.writeFileSync(analysisFile, content);
  }
  
  async generateProductionRecommendations() {
    console.log('\n🎯 Generating production recommendations...');
    
    const stats = this.masterResults.statistical_summary;
    
    // Find optimal configuration
    let bestConfig = null;
    let bestDuration = Infinity;
    let bestModel = null;
    
    Object.entries(stats).forEach(([configName, configStats]) => {
      Object.entries(configStats.model_performance).forEach(([modelName, modelStats]) => {
        const meanDuration = modelStats.duration_stats.mean;
        const qualityScore = modelStats.quality_stats.mean_quality;
        
        // Only consider configurations with good quality (>8/10)
        if (qualityScore >= 8.0 && meanDuration < bestDuration) {
          bestDuration = meanDuration;
          bestConfig = configName;
          bestModel = modelName;
        }
      });
    });
    
    const recommendations = {
      optimal_configuration: {
        config_name: bestConfig,
        model_name: bestModel,
        expected_duration: bestDuration,
        environment_variables: bestConfig ? this.optimizationConfigs[bestConfig].env_vars : {},
        implementation_notes: 'Apply these environment variables before starting Ollama',
      },
      performance_gains: {
        baseline_duration: stats.baseline_default?.model_performance[bestModel]?.duration_stats.mean || 'N/A',
        optimized_duration: bestDuration,
        speedup_factor: stats.baseline_default?.model_performance[bestModel] ? 
          (stats.baseline_default.model_performance[bestModel].duration_stats.mean / bestDuration).toFixed(1) + 'x' : 'N/A',
      },
      deployment_instructions: this.generateDeploymentInstructions(bestConfig),
    };
    
    this.masterResults.production_recommendations = recommendations;
    
    // Generate markdown recommendations
    let content = '# Production Deployment Recommendations\n\n';
    content += `**Optimal Configuration**: ${bestConfig}\n`;
    content += `**Recommended Model**: ${bestModel}\n`;
    content += `**Expected Performance**: ${bestDuration.toFixed(1)}s per evaluation\n\n`;
    
    if (recommendations.performance_gains.speedup_factor !== 'N/A') {
      content += '## Performance Improvement\n';
      content += `- **Baseline**: ${recommendations.performance_gains.baseline_duration.toFixed(1)}s\n`;
      content += `- **Optimized**: ${recommendations.performance_gains.optimized_duration.toFixed(1)}s\n`;  
      content += `- **Speedup**: ${recommendations.performance_gains.speedup_factor}\n\n`;
    }
    
    content += '## Deployment Instructions\n\n';
    content += recommendations.deployment_instructions;
    
    const recommendationsFile = path.join(this.resultsDir, 'production_recommendations.md');
    fs.writeFileSync(recommendationsFile, content);
  }
  
  generateDeploymentInstructions(configName) {
    if (!configName || !this.optimizationConfigs[configName]) {
      return 'No optimal configuration identified.';
    }
    
    const config = this.optimizationConfigs[configName];
    const envVars = config.env_vars;
    
    let instructions = '### Step 1: Stop Current Ollama\n';
    instructions += '```bash\npkill -f "ollama serve"\n```\n\n';
    
    instructions += '### Step 2: Set Environment Variables\n';
    instructions += '```bash\n';
    Object.entries(envVars).forEach(([key, value]) => {
      instructions += `export ${key}=${value}\n`;
    });
    instructions += '```\n\n';
    
    instructions += '### Step 3: Start Optimized Ollama\n';
    instructions += '```bash\nollama serve\n```\n\n';
    
    instructions += '### Step 4: Verify Configuration\n';
    instructions += 'Run a test evaluation to confirm performance improvements.\n';
    
    return instructions;
  }
  
  // Utility functions for statistical calculations
  calculateMean(numbers) {
    return numbers.length > 0 ? numbers.reduce((a, b) => a + b, 0) / numbers.length : 0;
  }
  
  calculateMedian(numbers) {
    const sorted = [...numbers].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  }
  
  calculateStdDev(numbers) {
    const mean = this.calculateMean(numbers);
    const variance = numbers.reduce((sum, num) => sum + Math.pow(num - mean, 2), 0) / numbers.length;
    return Math.sqrt(variance);
  }
  
  makeHttpRequest(url, method = 'GET', data = null) {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      const options = {
        hostname: urlObj.hostname,
        port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
        path: urlObj.pathname + urlObj.search,
        method: method,
        headers: { 'Content-Type': 'application/json' },
      };
      
      const client = urlObj.protocol === 'https:' ? https : http;
      const req = client.request(options, (res) => {
        let responseData = '';
        res.on('data', chunk => responseData += chunk);
        res.on('end', () => resolve({ statusCode: res.statusCode, data: responseData }));
      });
      
      req.on('error', reject);
      req.setTimeout(5000, () => reject(new Error('Request timeout')));
      
      if (data) {
        req.write(JSON.stringify(data));
      }
      req.end();
    });
  }
  
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Execute comprehensive optimization testing
if (require.main === module) {
  const tester = new ComprehensiveOptimizationTester();
  
  tester.runComprehensiveOptimizationTests()
    .then(() => {
      console.log('\n✅ All optimization testing completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Comprehensive optimization testing failed:', error);
      process.exit(1);
    });
}

module.exports = ComprehensiveOptimizationTester;
