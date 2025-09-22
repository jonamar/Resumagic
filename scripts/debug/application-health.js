#!/usr/bin/env node

/**
 * Application Health Checker
 * CLI tool for debugging application health issues
 */

import { 
  discoverApplications, 
  generateHealthReport,
  ApplicationHealth, 
} from '../../__tests__/helpers/application-registry.js';

function printSeparator(char = '=', length = 60) {
  console.log(char.repeat(length));
}

function printHealthStatus(health) {
  const statusEmojis = {
    [ApplicationHealth.HEALTHY]: '✅',
    [ApplicationHealth.INCOMPLETE]: '⚠️',
    [ApplicationHealth.MISSING]: '❌',
    [ApplicationHealth.ERROR]: '💥',
  };
  
  return `${statusEmojis[health.status] || '❓'} ${health.status.toUpperCase()}`;
}

function main() {
  console.log('📊 Application Health Report');
  printSeparator();
  
  const report = generateHealthReport();
  
  // Summary
  console.log('📈 Summary:');
  console.log(`  Total Applications: ${report.total}`);
  console.log(`  Healthy: ${report.healthy} ✅`);
  console.log(`  Incomplete: ${report.incomplete} ⚠️`);
  console.log(`  Missing: ${report.missing} ❌`);
  console.log(`  Errors: ${report.error} 💥`);
  console.log(`  Test Apps: ${report.testApps}`);
  console.log(`  Live Apps: ${report.liveApps}`);
  
  printSeparator();
  
  // Detailed breakdown
  console.log('📋 Detailed Application Status:');
  console.log();
  
  // Group by type
  const testApps = report.applications.filter(app => app.type === 'test');
  const liveApps = report.applications.filter(app => app.type === 'live');
  
  if (testApps.length > 0) {
    console.log('🧪 Test Applications:');
    testApps.forEach(app => {
      console.log(`  ${printHealthStatus(app.health)} ${app.name}`);
      if (app.health.status !== ApplicationHealth.HEALTHY) {
        console.log(`     ${app.health.message}`);
        if (app.health.details.missingComponents?.length > 0) {
          console.log(`     Missing: ${app.health.details.missingComponents.join(', ')}`);
        }
      }
    });
    console.log();
  }
  
  if (liveApps.length > 0) {
    console.log('🏢 Live Applications:');
    liveApps.forEach(app => {
      console.log(`  ${printHealthStatus(app.health)} ${app.name}`);
      if (app.health.status !== ApplicationHealth.HEALTHY) {
        console.log(`     ${app.health.message}`);
        if (app.health.details.missingComponents?.length > 0) {
          console.log(`     Missing: ${app.health.details.missingComponents.join(', ')}`);
        }
      } else {
        const outputs = app.health.details.outputCount || 0;
        console.log(`     Outputs: ${outputs} DOCX files`);
      }
    });
  }
  
  // Issues summary
  const unhealthyApps = report.applications.filter(app => 
    app.health.status !== ApplicationHealth.HEALTHY,
  );
  
  if (unhealthyApps.length > 0) {
    printSeparator();
    console.log('⚠️  Issues Found:');
    console.log();
    
    unhealthyApps.forEach(app => {
      console.log(`${app.name} (${app.type}):`);
      console.log(`  Status: ${app.health.status}`);
      console.log(`  Issue: ${app.health.message}`);
      console.log(`  Path: ${app.path}`);
      console.log();
    });
    
    console.log('💡 Recommendations:');
    console.log('  - For missing inputs: Ensure inputs/ directory exists with required files');
    console.log('  - For missing outputs: Run document generation for the application');
    console.log('  - For missing resume.json: Copy from canonical source and customize');
    console.log('  - For missing directories: Use --new-app CLI to create proper structure');
  } else {
    printSeparator();
    console.log('🎉 All applications are healthy!');
  }
}

main();
