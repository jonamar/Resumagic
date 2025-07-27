/**
 * Feature Flag Helper Utility
 * Simple feature flag system for safe service migration
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class FeatureFlagHelper {
  constructor(flagFilePath = null) {
    // Default to .feature-flags.json in project root
    this.flagFilePath = flagFilePath || path.join(__dirname, '..', '.feature-flags.json');
    this.flags = this.loadFlags();
  }

  /**
   * Load feature flags from file system
   * Creates default flags if file doesn't exist
   */
  loadFlags() {
    try {
      if (fs.existsSync(this.flagFilePath)) {
        const flagData = fs.readFileSync(this.flagFilePath, 'utf8');
        return JSON.parse(flagData);
      } else {
        // Create default flags file
        const defaultFlags = {
          _metadata: {
            version: '1.0.0',
            lastUpdated: new Date().toISOString(),
            description: 'Feature flags for service standardization migration'
          },
          services: {
            keywordAnalysis: {
              useStandardizedWrapper: false,
              description: 'Use new JSON API wrapper for keyword analysis service'
            },
            hiringEvaluation: {
              useStandardizedWrapper: false,
              description: 'Use new JSON API wrapper for hiring evaluation service'
            },
            documentGeneration: {
              useStandardizedWrapper: false,
              description: 'Use new JSON API wrapper for document generation service'
            },
            valeLinting: {
              useStandardizedWrapper: false,
              description: 'Use new JSON API wrapper for Vale linting service'
            }
          },
          logging: {
            useStructuredLogging: false,
            description: 'Use structured logging instead of console.log'
          },
          configuration: {
            useUnifiedConfig: false,
            description: 'Use unified configuration system across services'
          }
        };
        this.saveFlags(defaultFlags);
        return defaultFlags;
      }
    } catch (error) {
      console.warn(`Warning: Could not load feature flags from ${this.flagFilePath}:`, error.message);
      return this.getDefaultFlags();
    }
  }

  /**
   * Get default flags structure
   */
  getDefaultFlags() {
    return {
      _metadata: { version: '1.0.0', lastUpdated: new Date().toISOString() },
      services: {},
      logging: { useStructuredLogging: false },
      configuration: { useUnifiedConfig: false }
    };
  }

  /**
   * Save flags to file system
   */
  saveFlags(flags = null) {
    const flagsToSave = flags || this.flags;
    try {
      // Update metadata
      flagsToSave._metadata = {
        ...flagsToSave._metadata,
        lastUpdated: new Date().toISOString()
      };
      
      fs.writeFileSync(this.flagFilePath, JSON.stringify(flagsToSave, null, 2), 'utf8');
      this.flags = flagsToSave;
    } catch (error) {
      console.error(`Error saving feature flags to ${this.flagFilePath}:`, error.message);
    }
  }

  /**
   * Check if a feature flag is enabled
   * Supports nested flag paths like 'services.keywordAnalysis.useStandardizedWrapper'
   */
  isEnabled(flagPath) {
    const pathParts = flagPath.split('.');
    let current = this.flags;
    
    for (const part of pathParts) {
      if (current && typeof current === 'object' && part in current) {
        current = current[part];
      } else {
        console.warn(`Feature flag path '${flagPath}' not found, defaulting to false`);
        return false;
      }
    }
    
    return Boolean(current);
  }

  /**
   * Enable a feature flag
   */
  enable(flagPath) {
    this.setFlag(flagPath, true);
  }

  /**
   * Disable a feature flag
   */
  disable(flagPath) {
    this.setFlag(flagPath, false);
  }

  /**
   * Set a feature flag value
   */
  setFlag(flagPath, value) {
    const pathParts = flagPath.split('.');
    let current = this.flags;
    
    // Navigate to parent of target
    for (let i = 0; i < pathParts.length - 1; i++) {
      const part = pathParts[i];
      if (!(part in current) || typeof current[part] !== 'object') {
        current[part] = {};
      }
      current = current[part];
    }
    
    // Set the final value
    const finalKey = pathParts[pathParts.length - 1];
    current[finalKey] = value;
    
    this.saveFlags();
    console.log(`Feature flag '${flagPath}' set to: ${value}`);
  }

  /**
   * Get all flags for inspection
   */
  getAllFlags() {
    return { ...this.flags };
  }

  /**
   * Service-specific helper: Check if service should use standardized wrapper
   */
  useStandardizedService(serviceName) {
    return this.isEnabled(`services.${serviceName}.useStandardizedWrapper`);
  }

  /**
   * Configuration helper: Check if unified config is enabled
   */
  useUnifiedConfig() {
    return this.isEnabled('configuration.useUnifiedConfig');
  }

  /**
   * Logging helper: Check if structured logging is enabled
   */
  useStructuredLogging() {
    return this.isEnabled('logging.useStructuredLogging');
  }

  /**
   * Conditional execution helper
   * Execute newImplementation if flag is enabled, otherwise fallback
   */
  async conditional(flagPath, newImplementation, fallbackImplementation) {
    if (this.isEnabled(flagPath)) {
      console.log(`🚀 Using new implementation for ${flagPath}`);
      return newImplementation();
    } else {
      console.log(`⚡ Using legacy implementation for ${flagPath}`);
      return fallbackImplementation();
    }
  }

  /**
   * Migration helper: Gradually roll out a feature
   * Returns true for percentage of calls based on percentage (0-100)
   */
  gradualRollout(flagPath, percentage = 50) {
    if (!this.isEnabled(flagPath)) {
      return false;
    }
    
    // Use consistent hash based on flag path for deterministic rollout
    const hash = this.simpleHash(flagPath);
    return (hash % 100) < percentage;
  }

  /**
   * Simple hash function for consistent rollout decisions
   */
  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }
}

// Export class for use in other modules
export default FeatureFlagHelper;

// CLI interface for managing flags
if (import.meta.url === `file://${process.argv[1]}`) {
  const helper = new FeatureFlagHelper();
  const command = process.argv[2];
  const flagPath = process.argv[3];
  const value = process.argv[4];

  switch (command) {
  case 'list':
    console.log('Current Feature Flags:');
    console.log(JSON.stringify(helper.getAllFlags(), null, 2));
    break;
      
  case 'check':
    if (!flagPath) {
      console.error('Usage: node feature-flag-helper.js check <flag-path>');
      process.exit(1);
    }
    console.log(`${flagPath}: ${helper.isEnabled(flagPath)}`);
    break;
      
  case 'enable':
    if (!flagPath) {
      console.error('Usage: node feature-flag-helper.js enable <flag-path>');
      process.exit(1);
    }
    helper.enable(flagPath);
    break;
      
  case 'disable':
    if (!flagPath) {
      console.error('Usage: node feature-flag-helper.js disable <flag-path>');
      process.exit(1);
    }
    helper.disable(flagPath);
    break;
      
  case 'set': {
    if (!flagPath || value === undefined) {
      console.error('Usage: node feature-flag-helper.js set <flag-path> <value>');
      process.exit(1);
    }
    // Parse boolean and numeric values
    let parsedValue = value;
    if (value === 'true') parsedValue = true;
    else if (value === 'false') parsedValue = false;
    else if (!isNaN(value)) parsedValue = Number(value);
      
    helper.setFlag(flagPath, parsedValue);
    break;
  }
      
  default:
    console.log('Feature Flag Helper CLI');
    console.log('Usage:');
    console.log('  node feature-flag-helper.js list');
    console.log('  node feature-flag-helper.js check <flag-path>');
    console.log('  node feature-flag-helper.js enable <flag-path>');
    console.log('  node feature-flag-helper.js disable <flag-path>');
    console.log('  node feature-flag-helper.js set <flag-path> <value>');
    break;
  }
}