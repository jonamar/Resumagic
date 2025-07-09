#!/usr/bin/env node

/**
 * Test script to verify application isolation
 * This tests that generating documents for one application doesn't affect others
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Test configuration
const testApps = [
  'clearer-vp-of-product',
  'general-application', 
  'pointclick-product-manager',
  'relay-director-of-product',
  'zearch-director-of-product-marketing'
];

console.log('🧪 Testing application isolation...\n');

// Get baseline timestamps for all applications
const baselineTimestamps = {};
testApps.forEach(app => {
  const appPath = path.resolve(__dirname, '../data/applications', app);
  if (fs.existsSync(appPath)) {
    const outputsPath = path.join(appPath, 'outputs');
    if (fs.existsSync(outputsPath)) {
      const files = fs.readdirSync(outputsPath).filter(f => f.endsWith('.docx'));
      baselineTimestamps[app] = {};
      files.forEach(file => {
        const filePath = path.join(outputsPath, file);
        const stats = fs.statSync(filePath);
        baselineTimestamps[app][file] = stats.mtime.getTime();
      });
    }
  }
});

console.log('📊 Baseline timestamps captured for', Object.keys(baselineTimestamps).length, 'applications');

// Test: Generate documents for zearch application only
console.log('\n🎯 Testing: Generate documents for zearch-director-of-product-marketing');
console.log('Expected: Only zearch application files should be modified\n');

try {
  const output = execSync('node generate-resume.js zearch-director-of-product-marketing --both', {
    cwd: __dirname,
    encoding: 'utf8'
  });
  
  console.log('Generation output:');
  console.log(output);
  
} catch (error) {
  console.error('❌ Generation failed:', error.message);
  process.exit(1);
}

// Check which files were modified
console.log('\n🔍 Checking for contamination...');

let contaminatedApps = [];
testApps.forEach(app => {
  if (baselineTimestamps[app]) {
    const appPath = path.resolve(__dirname, '../data/applications', app);
    const outputsPath = path.join(appPath, 'outputs');
    
    if (fs.existsSync(outputsPath)) {
      const files = fs.readdirSync(outputsPath).filter(f => f.endsWith('.docx'));
      
      files.forEach(file => {
        const filePath = path.join(outputsPath, file);
        const stats = fs.statSync(filePath);
        const newTime = stats.mtime.getTime();
        const oldTime = baselineTimestamps[app][file];
        
        if (newTime > oldTime) {
          console.log(`⚠️  Modified: ${app}/outputs/${file}`);
          if (app !== 'zearch-director-of-product-marketing') {
            contaminatedApps.push(app);
          }
        }
      });
    }
  }
});

// Results
if (contaminatedApps.length === 0) {
  console.log('\n✅ SUCCESS: No cross-application contamination detected!');
  console.log('Only zearch-director-of-product-marketing files were modified as expected.');
} else {
  console.log('\n❌ FAILURE: Cross-application contamination detected!');
  console.log('Contaminated applications:', contaminatedApps);
  process.exit(1);
}