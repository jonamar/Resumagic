#!/usr/bin/env node

/**
 * Feature Flag CLI Tool
 * Command-line interface for managing feature flags during standardization
 * Part of Phase 1: CI/CD Extensions for Standardization Safety
 */

import { getFeatureFlags } from '../utils/feature-flags.ts';

function printUsage() {
  console.log(`
🏁 Feature Flag Management CLI

Usage: node scripts/feature-flags.js <command> [options]

Commands:
  list                    List all feature flags and their current values
  enable <flag>          Enable a feature flag
  disable <flag>         Disable a feature flag
  toggle <flag>          Toggle a feature flag
  reset                  Reset all flags to defaults
  validate               Validate safety flag configuration
  implementation <service> Get implementation type for a service
  
Options:
  --persist              Save changes to config file (for enable/disable/toggle/reset)
  --help, -h             Show this help message

Examples:
  node scripts/feature-flags.js list
  node scripts/feature-flags.js enable STANDARDIZED_KEYWORD_ANALYSIS --persist
  node scripts/feature-flags.js implementation keyword-analysis
  node scripts/feature-flags.js validate

Feature Flag Categories:
  Document Generation:
    - STANDARDIZED_DOCUMENT_GENERATION
    - STANDARDIZED_RESUME_PROCESSING
    - STANDARDIZED_COVER_LETTER_PROCESSING
  
  Service Integration:
    - STANDARDIZED_KEYWORD_ANALYSIS
    - STANDARDIZED_HIRING_EVALUATION
    - STANDARDIZED_ERROR_HANDLING
  
  Architecture:
    - STANDARDIZED_CLI_INTERFACE
    - STANDARDIZED_SERVICE_COMMUNICATION
    - STANDARDIZED_CONFIGURATION
  
  Safety:
    - ENABLE_GOLDEN_MASTER_VALIDATION
    - ENABLE_PERFORMANCE_REGRESSION_DETECTION
    - STRICT_COMPATIBILITY_MODE
`);
}

function formatFlag(name, value) {
  const emoji = value ? '✅' : '❌';
  const status = value ? 'ENABLED' : 'DISABLED';
  return `${emoji} ${name}: ${status}`;
}

function listFlags() {
  const flags = getFeatureFlags();
  const allFlags = flags.getAll();
  
  console.log('\n🏁 Current Feature Flag Status:\n');
  
  // Group flags by category
  const categories = {
    'Document Generation': [
      'STANDARDIZED_DOCUMENT_GENERATION',
      'STANDARDIZED_RESUME_PROCESSING', 
      'STANDARDIZED_COVER_LETTER_PROCESSING',
    ],
    'Service Integration': [
      'STANDARDIZED_KEYWORD_ANALYSIS',
      'STANDARDIZED_HIRING_EVALUATION',
      'STANDARDIZED_ERROR_HANDLING',
    ],
    'Architecture': [
      'STANDARDIZED_CLI_INTERFACE',
      'STANDARDIZED_SERVICE_COMMUNICATION',
      'STANDARDIZED_CONFIGURATION',
    ],
    'Safety & Testing': [
      'ENABLE_GOLDEN_MASTER_VALIDATION',
      'ENABLE_PERFORMANCE_REGRESSION_DETECTION',
      'STRICT_COMPATIBILITY_MODE',
    ],
    'Development': [
      'DEBUG_FEATURE_FLAGS',
      'LOG_SERVICE_TRANSITIONS',
    ],
  };
  
  Object.entries(categories).forEach(([category, flagNames]) => {
    console.log(`📂 ${category}:`);
    flagNames.forEach(flagName => {
      if (flagName in allFlags) {
        console.log(`   ${formatFlag(flagName, allFlags[flagName])}`);
      }
    });
    console.log('');
  });
  
  // Count enabled/disabled
  const enabled = Object.values(allFlags).filter(v => v).length;
  const total = Object.keys(allFlags).length;
  console.log(`📊 Summary: ${enabled}/${total} flags enabled\n`);
}

function enableFlag(flagName, persist = false) {
  const flags = getFeatureFlags();
  
  if (flags.enable(flagName, persist)) {
    console.log(`✅ Enabled: ${flagName}${persist ? ' (saved to config)' : ''}`);
  } else {
    console.error(`❌ Failed to enable: ${flagName}`);
    process.exit(1);
  }
}

function disableFlag(flagName, persist = false) {
  const flags = getFeatureFlags();
  
  if (flags.disable(flagName, persist)) {
    console.log(`❌ Disabled: ${flagName}${persist ? ' (saved to config)' : ''}`);
  } else {
    console.error(`❌ Failed to disable: ${flagName}`);
    process.exit(1);
  }
}

function toggleFlag(flagName, persist = false) {
  const flags = getFeatureFlags();
  
  const newValue = flags.toggle(flagName, persist);
  if (newValue !== undefined) {
    const status = newValue ? 'enabled' : 'disabled';
    console.log(`🔄 Toggled: ${flagName} -> ${status}${persist ? ' (saved to config)' : ''}`);
  } else {
    console.error(`❌ Failed to toggle: ${flagName}`);
    process.exit(1);
  }
}

function resetFlags(persist = false) {
  const flags = getFeatureFlags();
  flags.resetToDefaults(persist);
  console.log(`🔄 Reset all flags to defaults${persist ? ' (saved to config)' : ''}`);
}

function validateFlags() {
  const flags = getFeatureFlags();
  
  console.log('🔍 Validating feature flag safety configuration...\n');
  
  try {
    const isValid = flags.validateSafetyFlags();
    
    if (isValid) {
      console.log('✅ Feature flag safety validation passed');
      console.log('🛡️  All critical safety flags are properly configured\n');
    } else {
      console.log('⚠️  Feature flag safety validation completed with warnings');
      console.log('   Review the warnings above before proceeding\n');
    }
    
    return isValid;
  } catch (error) {
    console.error('❌ Feature flag safety validation failed:');
    console.error(`   ${error.message}\n`);
    process.exit(1);
  }
}

function showImplementation(serviceName) {
  const flags = getFeatureFlags();
  const implementation = flags.getImplementation(serviceName);
  
  console.log(`🔧 Service: ${serviceName}`);
  console.log(`📦 Implementation: ${implementation}`);
  
  if (implementation === 'standardized') {
    console.log('✨ Using new standardized architecture');
  } else {
    console.log('🔧 Using legacy implementation');
  }
}

// Main CLI logic
function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    printUsage();
    return;
  }
  
  const command = args[0];
  const persist = args.includes('--persist');
  
  switch (command) {
  case 'list':
    listFlags();
    break;
      
  case 'enable':
    if (args.length < 2) {
      console.error('Error: Flag name required for enable command');
      process.exit(1);
    }
    enableFlag(args[1], persist);
    break;
      
  case 'disable':
    if (args.length < 2) {
      console.error('Error: Flag name required for disable command');
      process.exit(1);
    }
    disableFlag(args[1], persist);
    break;
      
  case 'toggle':
    if (args.length < 2) {
      console.error('Error: Flag name required for toggle command');
      process.exit(1);
    }
    toggleFlag(args[1], persist);
    break;
      
  case 'reset':
    resetFlags(persist);
    break;
      
  case 'validate':
    validateFlags();
    break;
      
  case 'implementation':
    if (args.length < 2) {
      console.error('Error: Service name required for implementation command');
      process.exit(1);
    }
    showImplementation(args[1]);
    break;
      
  default:
    console.error(`Error: Unknown command: ${command}`);
    console.error('Run with --help to see available commands');
    process.exit(1);
  }
}

// Run the CLI
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export {
  listFlags,
  enableFlag,
  disableFlag,
  toggleFlag,
  resetFlags,
  validateFlags,
  showImplementation,
};
