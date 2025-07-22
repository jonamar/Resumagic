#!/usr/bin/env node

const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs');
const path = require('path');

const execAsync = promisify(exec);

const candidates = [
    { name: 'Alex Johnson', folder: 'test-weak-candidate', expected: 'weak' },
    { name: 'Morgan Davis', folder: 'test-average-candidate', expected: 'average' },
    { name: 'Dr. Sarah Chen', folder: 'test-strong-candidate', expected: 'strong' }
];

async function runBenchmark() {
    console.log('🧪 Starting Hiring Evaluation Benchmark');
    console.log('=====================================\n');
    
    const results = [];
    
    for (const candidate of candidates) {
        console.log(`📋 Testing: ${candidate.name} (${candidate.expected})`);
        
        const startTime = Date.now();
        
        try {
            // Run evaluation with 3-minute timeout
            const { stdout, stderr } = await execAsync(
                `timeout 180s node ../../app/services/hiring-evaluation/evaluation-runner.js ${candidate.folder} "${candidate.name}"`,
                { 
                    cwd: '/Users/jonamar/Documents/resumagic/data/applications',
                    maxBuffer: 1024 * 1024 * 10 // 10MB buffer
                }
            );
            
            const duration = (Date.now() - startTime) / 1000;
            
            // Parse results
            const resultsPath = `/Users/jonamar/Documents/resumagic/data/applications/${candidate.folder}/working/evaluation-results.json`;
            let scores = null;
            
            if (fs.existsSync(resultsPath)) {
                const rawResults = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
                scores = extractScores(rawResults);
            }
            
            results.push({
                candidate: candidate.name,
                expected: candidate.expected,
                duration: duration,
                success: true,
                scores: scores,
                output: stdout
            });
            
            console.log(`✅ Completed in ${duration.toFixed(1)}s`);
            
        } catch (error) {
            const duration = (Date.now() - startTime) / 1000;
            
            results.push({
                candidate: candidate.name,
                expected: candidate.expected,
                duration: duration,
                success: false,
                error: error.message,
                timeout: duration >= 179 // Near 180s timeout
            });
            
            console.log(`❌ Failed after ${duration.toFixed(1)}s: ${error.message}`);
        }
        
        console.log(''); // Empty line
    }
    
    // Generate report
    generateReport(results);
}

function extractScores(rawResults) {
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
        byPersona: scores,
        average: count > 0 ? (totalScore / count).toFixed(2) : null,
        distribution: categorizeScores(Object.values(scores))
    };
}

function categorizeScores(scores) {
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

function generateReport(results) {
    console.log('📊 BENCHMARK REPORT');
    console.log('==================\n');
    
    // Speed Analysis
    console.log('🚀 Speed Results:');
    results.forEach(r => {
        const status = r.success ? '✅' : (r.timeout ? '⏰ TIMEOUT' : '❌ ERROR');
        console.log(`  ${r.candidate}: ${r.duration.toFixed(1)}s ${status}`);
    });
    console.log('');
    
    // Score Analysis
    console.log('📈 Score Discrimination:');
    results.forEach(r => {
        if (r.scores) {
            console.log(`  ${r.candidate} (${r.expected}): avg=${r.scores.average}`);
            console.log(`    Distribution: ${JSON.stringify(r.scores.distribution)}`);
        } else {
            console.log(`  ${r.candidate}: No scores available`);
        }
    });
    console.log('');
    
    // Save detailed results
    const timestamp = new Date().toISOString();
    const reportPath = path.join(__dirname, 'benchmark-results.json');
    
    const report = {
        timestamp,
        summary: {
            totalCandidates: results.length,
            successful: results.filter(r => r.success).length,
            timedOut: results.filter(r => r.timeout).length,
            avgDuration: results.reduce((sum, r) => sum + r.duration, 0) / results.length
        },
        results
    };
    
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`📄 Detailed results saved to: ${reportPath}`);
}

// Run if called directly
if (require.main === module) {
    runBenchmark().catch(console.error);
}

module.exports = { runBenchmark };