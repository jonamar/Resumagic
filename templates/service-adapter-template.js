/**
 * Service Adapter Template
 * Copy-paste template for standardizing service interfaces
 * 
 * INSTRUCTIONS:
 * 1. Copy this file and rename to match your service (e.g., keyword-analysis-adapter.js)
 * 2. Replace all [SERVICE_NAME] placeholders with your actual service name
 * 3. Replace all [SERVICE_DESCRIPTION] with description of what the service does
 * 4. Implement the executeService method with your service logic
 * 5. Update the input validation schema in validateInput method
 * 6. Test with golden master validation before switching feature flag
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import FeatureFlagHelper from '../toolkit/feature-flag-helper.js';
import GoldenMasterValidator from '../toolkit/golden-master-validator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Standardized Service Adapter for [SERVICE_NAME]
 * [SERVICE_DESCRIPTION]
 */
class [SERVICE_NAME]Adapter {
  constructor() {
    this.serviceName = '[SERVICE_NAME]';
    this.version = '1.0.0';
    this.featureFlags = new FeatureFlagHelper();
    this.validator = new GoldenMasterValidator();
  }

  /**
   * Standard service interface implementation
   * All services implement this exact interface for consistency
   */
  async execute(input = {}) {
    const startTime = Date.now();
    const timestamp = new Date().toISOString();
    
    try {
      // Validate input
      const validationResult = this.validateInput(input);
      if (!validationResult.isValid) {
        return this.createErrorResponse('INVALID_INPUT', validationResult.errors, {
          duration_ms: Date.now() - startTime,
          timestamp
        });
      }

      // Check feature flag to determine implementation
      const useStandardized = this.featureFlags.useStandardizedService(this.serviceName);
      
      let result;
      if (useStandardized) {
        // Use new standardized implementation
        result = await this.executeStandardizedService(input);
      } else {
        // Use legacy implementation
        result = await this.executeLegacyService(input);
      }

      // Return standardized success response
      return this.createSuccessResponse(result, {
        duration_ms: Date.now() - startTime,
        timestamp,
        implementation: useStandardized ? 'standardized' : 'legacy'
      });

    } catch (error) {
      return this.createErrorResponse('EXECUTION_ERROR', error.message, {
        duration_ms: Date.now() - startTime,
        timestamp,
        stack: error.stack
      });
    }
  }

  /**
   * Validate input according to service requirements
   * CUSTOMIZE: Update validation rules for your service
   */
  validateInput(input) {
    const errors = [];
    
    // Example validation - customize for your service
    if (!input || typeof input !== 'object') {
      errors.push('Input must be a valid object');
    }
    
    // Add service-specific validation rules here
    // Example:
    // if (!input.requiredField) {
    //   errors.push('requiredField is required');
    // }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Execute the legacy service implementation
   * CUSTOMIZE: Implement calls to existing service logic
   */
  async executeLegacyService(input) {
    // TODO: Implement legacy service call
    // This should call your existing service implementation
    // Examples:
    // - Shell execution: execAsync('python my-service.py', input)
    // - Direct function call: existingServiceFunction(input)
    // - File-based communication: writeInputFile -> executeCommand -> readOutputFile
    
    throw new Error('Legacy service implementation not yet implemented');
  }

  /**
   * Execute the new standardized service implementation
   * CUSTOMIZE: Implement new JSON-based service logic
   */
  async executeStandardizedService(input) {
    // TODO: Implement standardized service logic
    // This should be a clean, JSON-in/JSON-out implementation
    // that produces the same output as the legacy version
    
    throw new Error('Standardized service implementation not yet implemented');
  }

  /**
   * Create standardized success response
   */
  createSuccessResponse(data, metadata = {}) {
    return {
      service: this.serviceName,
      version: this.version,
      success: true,
      data,
      error: null,
      metadata: {
        duration_ms: 0,
        timestamp: new Date().toISOString(),
        ...metadata
      }
    };
  }

  /**
   * Create standardized error response
   */
  createErrorResponse(errorCode, errorMessage, metadata = {}) {
    return {
      service: this.serviceName,
      version: this.version,
      success: false,
      data: null,
      error: {
        code: errorCode,
        message: errorMessage,
        details: metadata.stack ? { stack: metadata.stack } : {}
      },
      metadata: {
        duration_ms: 0,
        timestamp: new Date().toISOString(),
        ...metadata
      }
    };
  }

  /**
   * Golden master testing helper
   * Use this to create baseline and validate implementations match
   */
  async createGoldenMaster(testInput) {
    const testName = `${this.serviceName}-golden-master`;
    
    // Temporarily disable feature flag to test legacy implementation
    const originalFlag = this.featureFlags.useStandardizedService(this.serviceName);
    this.featureFlags.disable(`services.${this.serviceName}.useStandardizedWrapper`);
    
    try {
      await this.validator.createBaseline(testName, async (input) => {
        return await this.execute(input);
      }, testInput);
    } finally {
      // Restore original flag state
      if (originalFlag) {
        this.featureFlags.enable(`services.${this.serviceName}.useStandardizedWrapper`);
      }
    }
  }

  /**
   * Validate current implementation against golden master
   */
  async validateAgainstGoldenMaster(testInput) {
    const testName = `${this.serviceName}-golden-master`;
    
    return await this.validator.validate(testName, async (input) => {
      return await this.execute(input);
    }, testInput);
  }

  /**
   * Migration helper: Test both implementations and compare
   */
  async compareLegacyVsStandardized(testInput) {
    console.log(`🔄 Comparing legacy vs standardized implementation for ${this.serviceName}`);
    
    // Test legacy implementation
    this.featureFlags.disable(`services.${this.serviceName}.useStandardizedWrapper`);
    const legacyResult = await this.execute(testInput);
    
    // Test standardized implementation  
    this.featureFlags.enable(`services.${this.serviceName}.useStandardizedWrapper`);
    const standardizedResult = await this.execute(testInput);
    
    // Compare results
    const validator = new GoldenMasterValidator();
    const legacyNormalized = validator.normalizeData(legacyResult.data);
    const standardizedNormalized = validator.normalizeData(standardizedResult.data);
    
    const legacyHash = validator.generateHash(legacyNormalized);
    const standardizedHash = validator.generateHash(standardizedNormalized);
    
    const identical = legacyHash === standardizedHash;
    
    console.log(`Legacy hash: ${legacyHash}`);
    console.log(`Standardized hash: ${standardizedHash}`);
    console.log(`Results identical: ${identical ? '✅ YES' : '❌ NO'}`);
    
    if (!identical) {
      const differences = validator.findDifferences(legacyNormalized, standardizedNormalized);
      console.log('Differences found:');
      differences.forEach(diff => {
        console.log(`  - ${diff.path}: legacy="${diff.expected}", standardized="${diff.actual}"`);
      });
    }
    
    return {
      identical,
      legacyResult,
      standardizedResult,
      differences: identical ? [] : validator.findDifferences(legacyNormalized, standardizedNormalized)
    };
  }
}

// Export for use as module
export default [SERVICE_NAME]Adapter;

// CLI interface for testing and migration
if (import.meta.url === `file://${process.argv[1]}`) {
  const adapter = new [SERVICE_NAME]Adapter();
  const command = process.argv[2];

  switch (command) {
    case 'test-legacy':
      console.log('Testing legacy implementation...');
      // Add test input for your service
      const testInput = {}; // TODO: Add appropriate test input
      adapter.featureFlags.disable(`services.${adapter.serviceName}.useStandardizedWrapper`);
      adapter.execute(testInput).then(result => {
        console.log('Legacy result:', JSON.stringify(result, null, 2));
      }).catch(error => {
        console.error('Legacy test failed:', error.message);
      });
      break;
      
    case 'test-standardized':
      console.log('Testing standardized implementation...');
      // Add test input for your service
      const testInput2 = {}; // TODO: Add appropriate test input
      adapter.featureFlags.enable(`services.${adapter.serviceName}.useStandardizedWrapper`);
      adapter.execute(testInput2).then(result => {
        console.log('Standardized result:', JSON.stringify(result, null, 2));
      }).catch(error => {
        console.error('Standardized test failed:', error.message);
      });
      break;
      
    case 'create-golden-master':
      console.log('Creating golden master...');
      const goldenInput = {}; // TODO: Add appropriate test input
      adapter.createGoldenMaster(goldenInput).then(() => {
        console.log('✅ Golden master created successfully');
      }).catch(error => {
        console.error('❌ Failed to create golden master:', error.message);
      });
      break;
      
    case 'validate':
      console.log('Validating against golden master...');
      const validateInput = {}; // TODO: Add appropriate test input
      adapter.validateAgainstGoldenMaster(validateInput).then(result => {
        if (result.success) {
          console.log('✅ Validation passed');
        } else {
          console.log('❌ Validation failed:', result.message);
        }
      }).catch(error => {
        console.error('❌ Validation error:', error.message);
      });
      break;
      
    case 'compare':
      console.log('Comparing legacy vs standardized...');
      const compareInput = {}; // TODO: Add appropriate test input
      adapter.compareLegacyVsStandardized(compareInput).then(result => {
        if (result.identical) {
          console.log('✅ Implementations produce identical results');
        } else {
          console.log('❌ Implementations produce different results');
          console.log('Use this information to debug the standardized implementation');
        }
      }).catch(error => {
        console.error('❌ Comparison failed:', error.message);
      });
      break;
      
    default:
      console.log('[SERVICE_NAME] Service Adapter');
      console.log('Usage:');
      console.log('  node [service-name]-adapter.js test-legacy');
      console.log('  node [service-name]-adapter.js test-standardized');
      console.log('  node [service-name]-adapter.js create-golden-master');
      console.log('  node [service-name]-adapter.js validate');
      console.log('  node [service-name]-adapter.js compare');
      break;
  }
}

/*
IMPLEMENTATION CHECKLIST:

□ 1. Copy and rename this template file
□ 2. Replace all [SERVICE_NAME] and [SERVICE_DESCRIPTION] placeholders
□ 3. Implement validateInput() with service-specific validation rules
□ 4. Implement executeLegacyService() to call existing service
□ 5. Implement executeStandardizedService() with new JSON logic
□ 6. Add appropriate test input in CLI commands
□ 7. Create golden master: node [service]-adapter.js create-golden-master
□ 8. Test legacy works: node [service]-adapter.js test-legacy
□ 9. Implement standardized version iteratively
□ 10. Compare implementations: node [service]-adapter.js compare
□ 11. When identical, enable feature flag and validate
□ 12. Switch production to use standardized implementation
□ 13. Remove legacy code after validation period

FEATURE FLAG PATTERN:
- services.[serviceName].useStandardizedWrapper controls which implementation runs
- Use toolkit/feature-flag-helper.js to toggle implementations
- Golden master validation ensures behavioral consistency
- Instant rollback capability via feature flag disable
*/