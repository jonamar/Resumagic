#!/usr/bin/env node

/**
 * Runner script for Vale watcher
 * This is the actual process that gets spawned by process-manager
 */

const ValeWatcher = require('./watcher');

async function main() {
    const applicationsDir = process.argv[2];
    
    if (!applicationsDir) {
        console.error('❌ Applications directory path required');
        process.exit(1);
    }
    
    const watcher = new ValeWatcher();
    
    try {
        watcher.start(applicationsDir);
    } catch (error) {
        console.error(`❌ Failed to start watcher: ${error.message}`);
        process.exit(1);
    }
}

main();