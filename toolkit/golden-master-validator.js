/**
 * Golden Master Validator
 * Captures and validates service outputs to ensure behavioral consistency during migration
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class GoldenMasterValidator {
  constructor(masterDir = null) {
    // Default to .golden-masters directory in project root
    this.masterDir = masterDir || path.join(__dirname, '..', '.golden-masters');
    this.ensureMasterDirectory();
  }

  /**
   * Ensure master directory exists
   */
  ensureMasterDirectory() {
    if (!fs.existsSync(this.masterDir)) {
      fs.mkdirSync(this.masterDir, { recursive: true });
    }
  }

  /**
   * Generate a consistent hash for complex objects
   */
  generateHash(data) {
    const serialized = JSON.stringify(data, Object.keys(data).sort());
    return crypto.createHash('sha256').update(serialized).digest('hex').substring(0, 16);
  }

  /**
   * Normalize data for comparison (remove timestamps, etc.)
   */
  normalizeData(data) {
    if (data === null || data === undefined) {
      return data;
    }

    if (Array.isArray(data)) {
      return data.map(item => this.normalizeData(item));
    }

    if (typeof data === 'object') {
      const normalized = {};
      for (const [key, value] of Object.entries(data)) {
        // Skip timestamp fields that will always be different
        if (this.isTimestampField(key)) {
          continue;
        }
        normalized[key] = this.normalizeData(value);
      }
      return normalized;
    }

    return data;
  }

  /**
   * Check if a field appears to be a timestamp
   */
  isTimestampField(fieldName) {
    const timestampFields = [
      'timestamp',
      'created_at',
      'updated_at',
      'generated_at',
      'execution_time',
      'duration_ms',
      'start_time',
      'end_time'
    ];
    
    return timestampFields.some(pattern => 
      fieldName.toLowerCase().includes(pattern)
    );
  }

  /**
   * Create a golden master baseline for a service operation
   */
  async createBaseline(testName, serviceFunction, input = null) {
    try {
      console.log(`📸 Creating golden master baseline for: ${testName}`);
      
      // Execute the service function
      const result = await serviceFunction(input);
      
      // Normalize the result for consistent comparison
      const normalizedResult = this.normalizeData(result);
      
      // Create master record
      const masterRecord = {
        testName,
        input: this.normalizeData(input),
        output: normalizedResult,
        metadata: {
          createdAt: new Date().toISOString(),
          hash: this.generateHash(normalizedResult),
          inputHash: input ? this.generateHash(this.normalizeData(input)) : null
        }
      };
      
      // Save to file
      const masterFile = path.join(this.masterDir, `${testName}.json`);
      fs.writeFileSync(masterFile, JSON.stringify(masterRecord, null, 2), 'utf8');
      
      console.log(`✅ Golden master baseline created: ${masterFile}`);
      return masterRecord;
      
    } catch (error) {
      console.error(`❌ Failed to create golden master baseline for ${testName}:`, error.message);
      throw error;
    }
  }

  /**
   * Validate current output against golden master
   */
  async validate(testName, serviceFunction, input = null) {
    try {
      console.log(`🔍 Validating against golden master: ${testName}`);
      
      // Load master record
      const masterFile = path.join(this.masterDir, `${testName}.json`);
      if (!fs.existsSync(masterFile)) {
        throw new Error(`Golden master not found: ${masterFile}. Run createBaseline first.`);
      }
      
      const masterRecord = JSON.parse(fs.readFileSync(masterFile, 'utf8'));
      
      // Execute current implementation
      const currentResult = await serviceFunction(input);
      const normalizedCurrent = this.normalizeData(currentResult);
      
      // Compare hashes for quick check
      const currentHash = this.generateHash(normalizedCurrent);
      const masterHash = masterRecord.metadata.hash;
      
      if (currentHash === masterHash) {
        console.log(`✅ Golden master validation passed: ${testName}`);
        return {
          success: true,
          testName,
          message: 'Output matches golden master exactly'
        };
      }
      
      // If hashes don't match, provide detailed comparison
      const differences = this.findDifferences(masterRecord.output, normalizedCurrent);
      
      console.log(`❌ Golden master validation failed: ${testName}`);
      console.log('Differences found:');
      differences.forEach(diff => {
        console.log(`  - ${diff.path}: expected "${diff.expected}", got "${diff.actual}"`);
      });
      
      return {
        success: false,
        testName,
        message: 'Output differs from golden master',
        differences,
        expectedHash: masterHash,
        actualHash: currentHash
      };
      
    } catch (error) {
      console.error(`❌ Golden master validation error for ${testName}:`, error.message);
      return {
        success: false,
        testName,
        message: `Validation error: ${error.message}`,
        error: error.message
      };
    }
  }

  /**
   * Find specific differences between two objects
   */
  findDifferences(expected, actual, path = '') {
    const differences = [];
    
    if (typeof expected !== typeof actual) {
      differences.push({
        path: path || 'root',
        expected: typeof expected,
        actual: typeof actual,
        type: 'type_mismatch'
      });
      return differences;
    }
    
    if (expected === null || actual === null) {
      if (expected !== actual) {
        differences.push({
          path: path || 'root',
          expected,
          actual,
          type: 'value_mismatch'
        });
      }
      return differences;
    }
    
    if (Array.isArray(expected)) {
      if (expected.length !== actual.length) {
        differences.push({
          path: `${path}.length`,
          expected: expected.length,
          actual: actual.length,
          type: 'length_mismatch'
        });
      }
      
      const maxLength = Math.max(expected.length, actual.length);
      for (let i = 0; i < maxLength; i++) {
        const itemPath = `${path}[${i}]`;
        if (i >= expected.length) {
          differences.push({
            path: itemPath,
            expected: 'undefined',
            actual: actual[i],
            type: 'extra_item'
          });
        } else if (i >= actual.length) {
          differences.push({
            path: itemPath,
            expected: expected[i],
            actual: 'undefined',
            type: 'missing_item'
          });
        } else {
          differences.push(...this.findDifferences(expected[i], actual[i], itemPath));
        }
      }
      
      return differences;
    }
    
    if (typeof expected === 'object') {
      const expectedKeys = Object.keys(expected);
      const actualKeys = Object.keys(actual);
      
      // Check for missing keys
      for (const key of expectedKeys) {
        if (!(key in actual)) {
          differences.push({
            path: `${path}.${key}`,
            expected: expected[key],
            actual: 'undefined',
            type: 'missing_key'
          });
        }
      }
      
      // Check for extra keys
      for (const key of actualKeys) {
        if (!(key in expected)) {
          differences.push({
            path: `${path}.${key}`,
            expected: 'undefined',
            actual: actual[key],
            type: 'extra_key'
          });
        }
      }
      
      // Check for value differences in common keys
      for (const key of expectedKeys) {
        if (key in actual) {
          const keyPath = path ? `${path}.${key}` : key;
          differences.push(...this.findDifferences(expected[key], actual[key], keyPath));
        }
      }
      
      return differences;
    }
    
    // Primitive value comparison
    if (expected !== actual) {
      differences.push({
        path: path || 'root',
        expected,
        actual,
        type: 'value_mismatch'
      });
    }
    
    return differences;
  }

  /**
   * List all available golden masters
   */
  listMasters() {
    const masters = [];
    if (!fs.existsSync(this.masterDir)) {
      return masters;
    }
    
    const files = fs.readdirSync(this.masterDir);
    for (const file of files) {
      if (file.endsWith('.json')) {
        const filePath = path.join(this.masterDir, file);
        try {
          const masterRecord = JSON.parse(fs.readFileSync(filePath, 'utf8'));
          masters.push({
            testName: masterRecord.testName,
            file,
            createdAt: masterRecord.metadata.createdAt,
            hash: masterRecord.metadata.hash
          });
        } catch (error) {
          console.warn(`Warning: Could not parse golden master file ${file}:`, error.message);
        }
      }
    }
    
    return masters;
  }

  /**
   * Delete a golden master (for cleanup or re-baselining)
   */
  deleteMaster(testName) {
    const masterFile = path.join(this.masterDir, `${testName}.json`);
    if (fs.existsSync(masterFile)) {
      fs.unlinkSync(masterFile);
      console.log(`🗑️  Deleted golden master: ${testName}`);
      return true;
    } else {
      console.warn(`⚠️  Golden master not found: ${testName}`);
      return false;
    }
  }

  /**
   * Batch validation of multiple services
   */
  async validateAll(testSuite) {
    const results = [];
    
    console.log(`🔍 Running batch golden master validation (${testSuite.length} tests)`);
    
    for (const test of testSuite) {
      const result = await this.validate(test.testName, test.serviceFunction, test.input);
      results.push(result);
    }
    
    const passedTests = results.filter(r => r.success);
    const failedTests = results.filter(r => !r.success);
    
    console.log(`\n📊 Golden Master Validation Summary:`);
    console.log(`✅ Passed: ${passedTests.length}/${results.length}`);
    console.log(`❌ Failed: ${failedTests.length}/${results.length}`);
    
    if (failedTests.length > 0) {
      console.log(`\nFailed tests:`);
      failedTests.forEach(test => {
        console.log(`  - ${test.testName}: ${test.message}`);
      });
    }
    
    return {
      totalTests: results.length,
      passedTests: passedTests.length,
      failedTests: failedTests.length,
      results,
      success: failedTests.length === 0
    };
  }
}

// Export class for use in other modules
export default GoldenMasterValidator;

// CLI interface for managing golden masters
if (import.meta.url === `file://${process.argv[1]}`) {
  const validator = new GoldenMasterValidator();
  const command = process.argv[2];
  const testName = process.argv[3];

  switch (command) {
    case 'list':
      const masters = validator.listMasters();
      console.log('Available Golden Masters:');
      if (masters.length === 0) {
        console.log('  (none found)');
      } else {
        masters.forEach(master => {
          console.log(`  - ${master.testName} (created: ${master.createdAt})`);
        });
      }
      break;
      
    case 'delete':
      if (!testName) {
        console.error('Usage: node golden-master-validator.js delete <test-name>');
        process.exit(1);
      }
      validator.deleteMaster(testName);
      break;
      
    case 'clean':
      const allMasters = validator.listMasters();
      console.log(`🧹 Cleaning ${allMasters.length} golden masters...`);
      allMasters.forEach(master => {
        validator.deleteMaster(master.testName);
      });
      console.log('✅ All golden masters deleted');
      break;
      
    default:
      console.log('Golden Master Validator CLI');
      console.log('Usage:');
      console.log('  node golden-master-validator.js list');
      console.log('  node golden-master-validator.js delete <test-name>');
      console.log('  node golden-master-validator.js clean');
      console.log('');
      console.log('Note: Use this utility programmatically to create and validate masters');
      break;
  }
}