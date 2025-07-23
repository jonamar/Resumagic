#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { spawn, exec } = require('child_process');

/**
 * Process manager for Vale watcher
 * Handles start/stop/status operations with PID tracking
 */
class ValeProcessManager {
    constructor() {
        this.pidFile = path.join(__dirname, '.vale-watcher.pid');
        this.applicationsDir = path.resolve(__dirname, '../../../data/applications');
    }
    
    /**
     * Start the Vale watcher
     */
    async start() {
        console.log('🚀 Starting Vale watcher...');
        
        // Check if already running
        if (await this.isRunning()) {
            const status = await this.getStatus();
            console.log(`⚠️  Vale watcher already running (PID: ${status.pid})`);
            console.log(`📊 Uptime: ${status.uptime}, Files processed: ${status.filesProcessed}`);
            return;
        }
        
        // Check applications directory exists
        if (!fs.existsSync(this.applicationsDir)) {
            console.error(`❌ Applications directory not found: ${this.applicationsDir}`);
            return;
        }
        
        // Spawn the watcher process
        const watcherScript = path.join(__dirname, 'watcher-runner.js');
        const child = spawn('node', [watcherScript, this.applicationsDir], {
            detached: true,
            stdio: ['ignore', 'pipe', 'pipe']
        });
        
        // Save PID
        const processInfo = {
            pid: child.pid,
            startTime: Date.now(),
            applicationsDir: this.applicationsDir
        };
        
        fs.writeFileSync(this.pidFile, JSON.stringify(processInfo, null, 2));
        
        // Allow the process to run independently
        child.unref();
        
        console.log(`✅ Vale watcher started (PID: ${child.pid})`);
        console.log(`👀 Watching: ${this.applicationsDir}`);
        console.log(`📝 Use 'npm run vale:stop' to stop watching`);
        console.log(`📊 Use 'npm run vale:status' to check status`);
        
        // Show initial output for a few seconds
        let outputShown = false;
        child.stdout.on('data', (data) => {
            if (!outputShown) {
                console.log(data.toString().trim());
                outputShown = true;
            }
        });
        
        child.stderr.on('data', (data) => {
            console.error(`⚠️  ${data.toString().trim()}`);
        });
        
        // Give it a moment to start up
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    /**
     * Stop the Vale watcher
     */
    async stop() {
        console.log('🛑 Stopping Vale watcher...');
        
        if (!await this.isRunning()) {
            console.log('⚠️  Vale watcher not running');
            return;
        }
        
        try {
            const processInfo = JSON.parse(fs.readFileSync(this.pidFile, 'utf8'));
            const pid = processInfo.pid;
            
            // Kill the process
            process.kill(pid, 'SIGTERM');
            
            // Clean up PID file
            fs.unlinkSync(this.pidFile);
            
            console.log(`✅ Vale watcher stopped (PID: ${pid})`);
            
        } catch (error) {
            console.error(`❌ Error stopping watcher: ${error.message}`);
            
            // Clean up stale PID file
            if (fs.existsSync(this.pidFile)) {
                fs.unlinkSync(this.pidFile);
            }
        }
    }
    
    /**
     * Get watcher status
     */
    async getStatus() {
        if (!fs.existsSync(this.pidFile)) {
            return { running: false, message: 'Vale watcher not running' };
        }
        
        try {
            const processInfo = JSON.parse(fs.readFileSync(this.pidFile, 'utf8'));
            const pid = processInfo.pid;
            
            // Check if process is actually running
            try {
                process.kill(pid, 0); // Sends no signal, just checks if process exists
                
                const uptime = Date.now() - processInfo.startTime;
                const uptimeSeconds = Math.round(uptime / 1000);
                
                return {
                    running: true,
                    pid: pid,
                    uptime: `${uptimeSeconds}s`,
                    startedAt: new Date(processInfo.startTime).toLocaleString(),
                    watchingDir: processInfo.applicationsDir
                };
                
            } catch (e) {
                // Process not running, clean up stale PID file
                fs.unlinkSync(this.pidFile);
                return { running: false, message: 'Vale watcher not running (stale PID cleaned up)' };
            }
            
        } catch (error) {
            return { running: false, message: `Error reading status: ${error.message}` };
        }
    }
    
    /**
     * Check if watcher is running
     */
    async isRunning() {
        const status = await this.getStatus();
        return status.running;
    }
    
    /**
     * Display formatted status
     */
    async showStatus() {
        const status = await this.getStatus();
        
        if (status.running) {
            console.log('✅ Vale watcher is running');
            console.log(`📍 PID: ${status.pid}`);
            console.log(`⏱️  Uptime: ${status.uptime}`);
            console.log(`🕐 Started: ${status.startedAt}`);
            console.log(`👀 Watching: ${status.watchingDir}`);
        } else {
            console.log('❌ Vale watcher is not running');
            if (status.message) {
                console.log(`ℹ️  ${status.message}`);
            }
        }
    }
}

// CLI handling
async function main() {
    const manager = new ValeProcessManager();
    const command = process.argv[2];
    
    switch (command) {
        case 'start':
            await manager.start();
            break;
            
        case 'stop':
            await manager.stop();
            break;
            
        case 'status':
            await manager.showStatus();
            break;
            
        default:
            console.log('Usage: node process-manager.js [start|stop|status]');
            process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    main().catch(error => {
        console.error(`❌ ${error.message}`);
        process.exit(1);
    });
}

module.exports = ValeProcessManager;