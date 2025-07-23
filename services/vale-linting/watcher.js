const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const chokidar = require('chokidar');
const TwoTierAnalyzer = require('./two-tier-analyzer');
const TwoTierReporter = require('./two-tier-reporter');

/**
 * Vale file watcher with performance monitoring
 */
class ValeWatcher {
    constructor() {
        this.watcher = null;
        this.isRunning = false;
        this.stats = {
            startTime: Date.now(),
            filesProcessed: 0,
            totalProcessingTime: 0,
            lastProcessedFile: null,
            memoryUsage: process.memoryUsage()
        };
        
        this.analyzer = new TwoTierAnalyzer();
        this.reporter = new TwoTierReporter();
        
        // Performance monitoring
        this.memoryCheckInterval = setInterval(() => {
            this.checkMemoryUsage();
        }, 10 * 60 * 1000); // Check every 10 minutes
    }
    
    /**
     * Start watching for resume.json changes
     * @param {string} applicationsDir - Path to applications directory
     */
    start(applicationsDir) {
        const startTime = Date.now();
        
        console.log(`🔍 Starting Vale watcher...`);
        
        if (this.isRunning) {
            console.log(`⚠️  Watcher already running`);
            return;
        }
        
        // Watch patterns: resume.json and cover-letter.md in application inputs/ directories
        const watchPatterns = [
            path.join(applicationsDir, '*/inputs/resume.json'),
            path.join(applicationsDir, '*/inputs/cover-letter.md')
        ];
        
        this.watcher = chokidar.watch(watchPatterns, {
            ignored: /node_modules/,
            ignoreInitial: true, // Only watch for changes, not existing files
            persistent: true
        });
        
        this.watcher
            .on('change', (filePath) => this.handleFileChange(filePath))
            .on('error', (error) => console.error(`❌ Watcher error: ${error}`))
            .on('ready', () => {
                const duration = Date.now() - startTime;
                console.log(`✅ Watcher started in ${duration}ms`);
                console.log(`👀 Watching: resume.json and cover-letter.md in ${applicationsDir}`);
                console.log(`📝 Press any key to stop watching...`);
                this.isRunning = true;
                
                // Set up graceful shutdown
                this.setupShutdownHandler();
            });
    }
    
    /**
     * Handle file change event
     */
    async handleFileChange(filePath) {
        const startTime = Date.now();
        const applicationName = this.extractApplicationName(filePath);
        const fileType = this.extractFileType(filePath);
        
        console.log(`\n📝 Processing ${applicationName} (${fileType})...`);
        
        try {
            if (filePath.endsWith('.json')) {
                // Step 1: Run two-tier analysis on JSON resume
                const analysisStart = Date.now();
                const analysisResults = await this.analyzer.analyzeResume(filePath);
                const analysisDuration = Date.now() - analysisStart;
                
                // Step 2: Generate report
                const reportStart = Date.now();
                const applicationDir = path.dirname(path.dirname(filePath)); // Go up from inputs/
                const totalDuration = Date.now() - startTime;
                
                const reportContent = this.reporter.generateReport(analysisResults, applicationName, {
                    duration: analysisDuration,
                    sectionsAnalyzed: analysisResults.stats.sectionsAnalyzed,
                    totalDuration,
                    fileType
                });
                
                const reportPath = this.reporter.writeReport(reportContent, applicationDir);
                const reportDuration = Date.now() - reportStart;
                
                // Update stats
                this.updateStats(applicationName, totalDuration);
                
                // Success feedback
                const tier1Count = analysisResults.tier1.length;
                const tier2Count = analysisResults.tier2.length;
                console.log(`✅ Processed ${applicationName} in ${totalDuration}ms (${tier1Count} critical, ${tier2Count} density issues)`);
                console.log(`📄 Report: ${path.relative(process.cwd(), reportPath)}`);
            } else {
                // Handle markdown files (cover letters) with simple processing
                console.log(`📝 Cover letter processing not yet implemented for two-tier system`);
            }
            
        } catch (error) {
            console.error(`❌ Error processing ${applicationName}: ${error.message}`);
        }
    }
    
    /**
     * Run Vale on extracted content
     */
    async runVale(content) {
        return new Promise((resolve, reject) => {
            // Write content to temp file
            const tempFile = path.join(__dirname, 'temp-content.md');
            fs.writeFileSync(tempFile, content, 'utf8');
            
            // Run Vale with JSON output
            const valeProcess = spawn('vale', ['--output=JSON', tempFile], {
                cwd: __dirname,
                stdio: ['ignore', 'pipe', 'pipe']
            });
            
            let stdout = '';
            let stderr = '';
            
            valeProcess.stdout.on('data', (data) => {
                stdout += data.toString();
            });
            
            valeProcess.stderr.on('data', (data) => {
                stderr += data.toString();
            });
            
            valeProcess.on('close', (code) => {
                // Clean up temp file
                try {
                    fs.unlinkSync(tempFile);
                } catch (e) {
                    // Ignore cleanup errors
                }
                
                try {
                    // Vale returns non-zero when issues found, but that's not an error for us
                    if (stdout.trim()) {
                        const results = JSON.parse(stdout);
                        // Get the first (and only) key from results since we only process one file
                        const firstKey = Object.keys(results)[0];
                        resolve(results[firstKey] || []);
                    } else {
                        resolve([]);
                    }
                } catch (error) {
                    reject(new Error(`Vale parsing error: ${error.message}`));
                }
            });
            
            valeProcess.on('error', (error) => {
                reject(new Error(`Vale execution error: ${error.message}`));
            });
        });
    }
    
    /**
     * Extract application name from file path
     */
    extractApplicationName(filePath) {
        const parts = filePath.split(path.sep);
        const applicationsIndex = parts.findIndex(part => part === 'applications');
        
        if (applicationsIndex !== -1 && parts[applicationsIndex + 1]) {
            return parts[applicationsIndex + 1];
        }
        
        return 'unknown-application';
    }
    
    /**
     * Extract file type from file path
     */
    extractFileType(filePath) {
        if (filePath.endsWith('resume.json')) {
            return 'resume';
        } else if (filePath.endsWith('cover-letter.md')) {
            return 'cover-letter';
        }
        return 'unknown';
    }
    
    /**
     * Update processing statistics
     */
    updateStats(applicationName, processingTime) {
        this.stats.filesProcessed++;
        this.stats.totalProcessingTime += processingTime;
        this.stats.lastProcessedFile = applicationName;
        this.stats.memoryUsage = process.memoryUsage();
    }
    
    /**
     * Check memory usage and warn if high
     */
    checkMemoryUsage() {
        const usage = process.memoryUsage();
        const heapUsedMB = Math.round(usage.heapUsed / 1024 / 1024);
        
        if (heapUsedMB > 50) {
            console.log(`⚠️  High memory usage: ${heapUsedMB}MB`);
        }
    }
    
    /**
     * Get current status
     */
    getStatus() {
        const uptime = Date.now() - this.stats.startTime;
        const avgProcessingTime = this.stats.filesProcessed > 0 
            ? Math.round(this.stats.totalProcessingTime / this.stats.filesProcessed)
            : 0;
        const heapUsedMB = Math.round(this.stats.memoryUsage.heapUsed / 1024 / 1024);
        
        return {
            running: this.isRunning,
            uptime: `${Math.round(uptime / 1000)}s`,
            filesProcessed: this.stats.filesProcessed,
            avgProcessingTime: `${avgProcessingTime}ms`,
            memoryUsage: `${heapUsedMB}MB`,
            lastProcessedFile: this.stats.lastProcessedFile
        };
    }
    
    /**
     * Stop the watcher
     */
    async stop() {
        if (!this.isRunning) {
            console.log(`⚠️  Watcher not running`);
            return;
        }
        
        console.log(`\n🛑 Stopping Vale watcher...`);
        
        if (this.watcher) {
            await this.watcher.close();
        }
        
        if (this.memoryCheckInterval) {
            clearInterval(this.memoryCheckInterval);
        }
        
        this.isRunning = false;
        
        const status = this.getStatus();
        console.log(`✅ Watcher stopped`);
        console.log(`📊 Final stats: ${status.filesProcessed} files processed, avg ${status.avgProcessingTime}`);
    }
    
    /**
     * Setup graceful shutdown handler
     */
    setupShutdownHandler() {
        // Only setup interactive mode if stdin is a TTY (not detached)
        if (process.stdin.isTTY) {
            try {
                // Handle any key press to stop
                process.stdin.setRawMode(true);
                process.stdin.resume();
                process.stdin.on('data', () => {
                    this.stop().then(() => process.exit(0));
                });
            } catch (error) {
                // Silently ignore if setRawMode is not available
            }
        }
        
        // Handle process termination
        process.on('SIGINT', () => {
            this.stop().then(() => process.exit(0));
        });
        
        process.on('SIGTERM', () => {
            this.stop().then(() => process.exit(0));
        });
    }
}

module.exports = ValeWatcher;