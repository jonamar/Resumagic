/**
 * Feature Flag System for Standardized Polyglot Architecture
 * Enables safe toggling between legacy and standardized service implementations
 * Part of Phase 1: CI/CD Extensions for Standardization Safety
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ESM equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Feature flags configuration
 * Each flag controls whether to use standardized vs legacy implementation
 */
const DEFAULT_FLAGS = {
  // Document generation flags
  STANDARDIZED_DOCUMENT_GENERATION: false,
  STANDARDIZED_RESUME_PROCESSING: false,
  STANDARDIZED_COVER_LETTER_PROCESSING: false,
  
  // Service integration flags  
  STANDARDIZED_KEYWORD_ANALYSIS: false,
  STANDARDIZED_HIRING_EVALUATION: false,
  STANDARDIZED_VALE_LINTING: false,
  STANDARDIZED_ERROR_HANDLING: false,
  
  // Architecture flags
  STANDARDIZED_CLI_INTERFACE: false,
  STANDARDIZED_SERVICE_COMMUNICATION: false,
  STANDARDIZED_CONFIGURATION: false,
  
  // Testing and validation flags
  ENABLE_GOLDEN_MASTER_VALIDATION: true,
  ENABLE_PERFORMANCE_REGRESSION_DETECTION: true,
  STRICT_COMPATIBILITY_MODE: true,
  
  // Development flags
  DEBUG_FEATURE_FLAGS: false,
  LOG_SERVICE_TRANSITIONS: true
};

/**
 * Feature flag manager class
 */
class FeatureFlags {
  constructor() {
    this.flags = { ...DEFAULT_FLAGS };
    this.configPath = path.join(__dirname, '.feature-flags.json');
    this.envPrefix = 'RESUMAGIC_FF_';
    
    this.loadFlags();
  }
  
  /**
   * Load flags from config file and environment variables
   */
  loadFlags() {
    // Load from config file if it exists
    if (fs.existsSync(this.configPath)) {
      try {
        const fileFlags = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
        this.flags = { ...this.flags, ...fileFlags };
      } catch (error) {
        console.warn(`Warning: Could not load feature flags from ${this.configPath}:`, error.message);
      }
    }
    
    // Override with environment variables
    Object.keys(this.flags).forEach(flagName => {
      const envVar = this.envPrefix + flagName;
      const envValue = process.env[envVar];
      
      if (envValue !== undefined) {
        // Parse boolean values
        if (envValue.toLowerCase() === 'true') {
          this.flags[flagName] = true;
        } else if (envValue.toLowerCase() === 'false') {
          this.flags[flagName] = false;
        } else {
          // Keep original value if not a clear boolean
          console.warn(`Warning: Invalid boolean value for ${envVar}: ${envValue}`);
        }
      }
    });
    
    if (this.flags.DEBUG_FEATURE_FLAGS) {
      console.log('🏁 Feature flags loaded:', this.flags);
    }
  }
  
  /**
   * Save current flags to config file
   */
  saveFlags() {
    try {
      fs.writeFileSync(this.configPath, JSON.stringify(this.flags, null, 2));
      return true;
    } catch (error) {
      console.error(`Error saving feature flags to ${this.configPath}:`, error.message);
      return false;
    }
  }
  
  /**
   * Check if a feature flag is enabled
   * @param {string} flagName - Name of the feature flag
   * @returns {boolean} - Whether the flag is enabled
   */
  isEnabled(flagName) {
    if (!(flagName in this.flags)) {
      console.warn(`Warning: Unknown feature flag: ${flagName}`);
      return false;
    }
    
    const enabled = this.flags[flagName];
    
    if (this.flags.LOG_SERVICE_TRANSITIONS && enabled) {
      console.log(`🚀 Using standardized implementation: ${flagName}`);
    }
    
    return enabled;
  }
  
  /**
   * Enable a feature flag
   * @param {string} flagName - Name of the feature flag
   * @param {boolean} persist - Whether to save to config file
   */
  enable(flagName, persist = false) {
    if (!(flagName in this.flags)) {
      console.warn(`Warning: Unknown feature flag: ${flagName}`);
      return false;
    }
    
    this.flags[flagName] = true;
    
    if (persist) {
      this.saveFlags();
    }
    
    if (this.flags.LOG_SERVICE_TRANSITIONS) {
      console.log(`✅ Enabled feature flag: ${flagName}`);
    }
    
    return true;
  }
  
  /**
   * Disable a feature flag
   * @param {string} flagName - Name of the feature flag
   * @param {boolean} persist - Whether to save to config file
   */
  disable(flagName, persist = false) {
    if (!(flagName in this.flags)) {
      console.warn(`Warning: Unknown feature flag: ${flagName}`);
      return false;
    }
    
    this.flags[flagName] = false;
    
    if (persist) {
      this.saveFlags();
    }
    
    if (this.flags.LOG_SERVICE_TRANSITIONS) {
      console.log(`❌ Disabled feature flag: ${flagName}`);
    }
    
    return true;
  }
  
  /**
   * Toggle a feature flag
   * @param {string} flagName - Name of the feature flag
   * @param {boolean} persist - Whether to save to config file
   */
  toggle(flagName, persist = false) {
    if (!(flagName in this.flags)) {
      console.warn(`Warning: Unknown feature flag: ${flagName}`);
      return false;
    }
    
    this.flags[flagName] = !this.flags[flagName];
    
    if (persist) {
      this.saveFlags();
    }
    
    if (this.flags.LOG_SERVICE_TRANSITIONS) {
      console.log(`🔄 Toggled feature flag: ${flagName} -> ${this.flags[flagName]}`);
    }
    
    return this.flags[flagName];
  }
  
  /**
   * Get all flags and their current values
   */
  getAll() {
    return { ...this.flags };
  }
  
  /**
   * Reset all flags to defaults
   * @param {boolean} persist - Whether to save to config file
   */
  resetToDefaults(persist = false) {
    this.flags = { ...DEFAULT_FLAGS };
    
    if (persist) {
      this.saveFlags();
    }
    
    console.log('🔄 Reset all feature flags to defaults');
  }
  
  /**
   * Validate that critical safety flags are properly configured
   */
  validateSafetyFlags() {
    const criticalFlags = [
      'ENABLE_GOLDEN_MASTER_VALIDATION',
      'ENABLE_PERFORMANCE_REGRESSION_DETECTION',
      'STRICT_COMPATIBILITY_MODE'
    ];
    
    const issues = [];
    
    criticalFlags.forEach(flagName => {
      if (!this.flags[flagName]) {
        issues.push(`Critical safety flag disabled: ${flagName}`);
      }
    });
    
    // Check for dangerous combinations
    if (this.flags.STANDARDIZED_CLI_INTERFACE && !this.flags.ENABLE_GOLDEN_MASTER_VALIDATION) {
      issues.push('STANDARDIZED_CLI_INTERFACE enabled without ENABLE_GOLDEN_MASTER_VALIDATION');
    }
    
    if (issues.length > 0) {
      console.error('⚠️  Feature flag safety validation failed:');
      issues.forEach(issue => console.error(`   - ${issue}`));
      
      if (this.flags.STRICT_COMPATIBILITY_MODE) {
        throw new Error('Feature flag safety validation failed in strict mode');
      }
    }
    
    return issues.length === 0;
  }
  
  /**
   * Get service implementation based on feature flags
   * @param {string} serviceName - Name of the service
   * @returns {string} - 'standardized' or 'legacy'
   */
  getImplementation(serviceName) {
    const flagMapping = {
      'document-generation': 'STANDARDIZED_DOCUMENT_GENERATION',
      'resume-processing': 'STANDARDIZED_RESUME_PROCESSING',
      'cover-letter-processing': 'STANDARDIZED_COVER_LETTER_PROCESSING',
      'keyword-analysis': 'STANDARDIZED_KEYWORD_ANALYSIS',
      'hiring-evaluation': 'STANDARDIZED_HIRING_EVALUATION',
      'error-handling': 'STANDARDIZED_ERROR_HANDLING',
      'cli-interface': 'STANDARDIZED_CLI_INTERFACE',
      'service-communication': 'STANDARDIZED_SERVICE_COMMUNICATION',
      'configuration': 'STANDARDIZED_CONFIGURATION'
    };
    
    const flagName = flagMapping[serviceName];
    if (!flagName) {
      console.warn(`Warning: No feature flag mapping for service: ${serviceName}`);
      return 'legacy';
    }
    
    return this.isEnabled(flagName) ? 'standardized' : 'legacy';
  }
}

// Singleton instance
let instance = null;

/**
 * Get the feature flags singleton instance
 * @returns {FeatureFlags} - The feature flags instance
 */
function getFeatureFlags() {
  if (!instance) {
    instance = new FeatureFlags();
  }
  return instance;
}

/**
 * Convenience function to check if a flag is enabled
 * @param {string} flagName - Name of the feature flag
 * @returns {boolean} - Whether the flag is enabled
 */
function isEnabled(flagName) {
  return getFeatureFlags().isEnabled(flagName);
}

/**
 * Convenience function to get service implementation
 * @param {string} serviceName - Name of the service
 * @returns {string} - 'standardized' or 'legacy'
 */
function getImplementation(serviceName) {
  return getFeatureFlags().getImplementation(serviceName);
}

export {
  FeatureFlags,
  getFeatureFlags,
  isEnabled,
  getImplementation,
  DEFAULT_FLAGS
};
