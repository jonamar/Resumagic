/**
 * Keyword Analysis Service Adapter
 * Standardized wrapper for Python keyword analysis service
 * Proof of concept for the service standardization toolkit
 */

import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { fileURLToPath } from 'url';
import FeatureFlagHelper from './toolkit/feature-flag-helper.js';
import GoldenMasterValidator from './toolkit/golden-master-validator.js';
import { createLogger } from './toolkit/structured-logger.js';

const execAsync = promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Standardized Service Adapter for Keyword Analysis
 * Extracts and ranks keywords from job posting descriptions
 */
class KeywordAnalysisAdapter {
  constructor() {
    this.serviceName = 'keywordAnalysis';
    this.version = '1.0.0';
    this.featureFlags = new FeatureFlagHelper();
    this.validator = new GoldenMasterValidator();
    this.logger = createLogger('keyword-analysis-adapter');
  }

  /**
   * Standard service interface implementation
   */
  async execute(input = {}) {
    const startTime = Date.now();
    const timestamp = new Date().toISOString();
    
    this.logger.serviceStart('keyword-analysis', input);
    
    try {
      // Validate input
      const validationResult = this.validateInput(input);
      if (!validationResult.isValid) {
        this.logger.error('Input validation failed', { errors: validationResult.errors });
        return this.createErrorResponse('INVALID_INPUT', validationResult.errors.join(', '), {
          duration_ms: Date.now() - startTime,
          timestamp
        });
      }

      // Check feature flag to determine implementation
      const useStandardized = this.featureFlags.useStandardizedService(this.serviceName);
      
      let result;
      if (useStandardized) {
        // Use new standardized implementation
        this.logger.info('Using standardized implementation');
        result = await this.executeStandardizedService(input);
      } else {
        // Use legacy implementation
        this.logger.info('Using legacy implementation');
        result = await this.executeLegacyService(input);
      }

      const duration = Date.now() - startTime;
      this.logger.serviceComplete('keyword-analysis', duration, result);

      // Return standardized success response
      return this.createSuccessResponse(result, {
        duration_ms: duration,
        timestamp,
        implementation: useStandardized ? 'standardized' : 'legacy'
      });

    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.serviceError('keyword-analysis', error, input);
      return this.createErrorResponse('EXECUTION_ERROR', error.message, {
        duration_ms: duration,
        timestamp,
        stack: error.stack
      });
    }
  }

  /**
   * Validate input according to service requirements
   */
  validateInput(input) {
    const errors = [];
    
    if (!input || typeof input !== 'object') {
      errors.push('Input must be a valid object');
      return { isValid: false, errors };
    }
    
    // Check for job posting data
    if (!input.jobDescription && !input.jobPostingPath) {
      errors.push('Either jobDescription or jobPostingPath is required');
    }
    
    // Validate job posting path if provided
    if (input.jobPostingPath && !fs.existsSync(input.jobPostingPath)) {
      errors.push(`Job posting file not found: ${input.jobPostingPath}`);
    }
    
    // Validate output path if provided
    if (input.outputPath) {
      const outputDir = path.dirname(input.outputPath);
      if (!fs.existsSync(outputDir)) {
        errors.push(`Output directory does not exist: ${outputDir}`);
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Execute the legacy Python service implementation
   */
  async executeLegacyService(input) {
    const { jobDescription, jobPostingPath, outputPath } = input;
    
    // Prepare input file for Python service
    let inputFilePath = jobPostingPath;
    
    if (jobDescription && !jobPostingPath) {
      // Create temporary input file
      const tempDir = path.join(__dirname, 'tmp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      inputFilePath = path.join(tempDir, `job-posting-${Date.now()}.md`);
      fs.writeFileSync(inputFilePath, jobDescription, 'utf8');
    }
    
    // Determine output path
    const resultPath = outputPath || path.join(path.dirname(inputFilePath), 'keyword_analysis.json');
    
    try {
      // Execute Python keyword analysis service
      const pythonScript = path.join(__dirname, 'services', 'keyword-analysis', 'kw_rank_modular.py');
      const command = `python "${pythonScript}" "${inputFilePath}"`;
      
      this.logger.debug('Executing Python command', { command, inputFilePath, resultPath });
      
      await execAsync(command, { cwd: __dirname });
      
      // Read and parse the result
      if (!fs.existsSync(resultPath)) {
        throw new Error(`Python service did not generate expected output file: ${resultPath}`);
      }
      
      const resultData = fs.readFileSync(resultPath, 'utf8');
      const parsedResult = JSON.parse(resultData);
      
      // Clean up temporary input file if we created it
      if (jobDescription && !jobPostingPath && fs.existsSync(inputFilePath)) {
        fs.unlinkSync(inputFilePath);
      }
      
      return {
        keywords: parsedResult.skills_ranked || [],
        knockout_requirements: parsedResult.knockout_requirements || [],
        analysis_metadata: {
          total_keywords: parsedResult.skills_ranked?.length || 0,
          knockout_count: parsedResult.knockout_requirements?.length || 0,
          processing_method: 'python-legacy'
        }
      };
      
    } catch (error) {
      // Clean up temporary file on error
      if (jobDescription && !jobPostingPath && fs.existsSync(inputFilePath)) {
        try {
          fs.unlinkSync(inputFilePath);
        } catch (cleanupError) {
          this.logger.warn('Failed to clean up temporary file', { inputFilePath, error: cleanupError.message });
        }
      }
      throw error;
    }
  }

  /**
   * Execute the new standardized service implementation
   * (This would be implemented as a pure JavaScript version)
   */
  async executeStandardizedService(input) {
    // For now, this is a placeholder that mirrors the legacy output
    // In a real implementation, this would be a pure JavaScript/Node.js implementation
    // that produces the same results as the Python service
    
    const { jobDescription, jobPostingPath } = input;
    
    // Read job posting content
    let content = jobDescription;
    if (jobPostingPath && !jobDescription) {
      content = fs.readFileSync(jobPostingPath, 'utf8');
    }
    
    // Simple keyword extraction (placeholder implementation)
    // In production, this would implement the same algorithm as the Python version
    const words = content.toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 3)
      .filter(word => /^[a-z]+$/.test(word));
    
    const wordCounts = {};
    words.forEach(word => {
      wordCounts[word] = (wordCounts[word] || 0) + 1;
    });
    
    const sortedWords = Object.entries(wordCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 20)
      .map(([word, count]) => ({
        kw: word,
        count,
        score: count / words.length
      }));
    
    // Identify potential knockout requirements (very basic implementation)
    const knockoutTerms = ['required', 'must have', 'essential', 'mandatory'];
    const knockoutRequirements = knockoutTerms
      .filter(term => content.toLowerCase().includes(term))
      .map(term => ({ kw: term, type: 'requirement' }));
    
    return {
      keywords: sortedWords,
      knockout_requirements: knockoutRequirements,
      analysis_metadata: {
        total_keywords: sortedWords.length,
        knockout_count: knockoutRequirements.length,
        processing_method: 'javascript-standardized'
      }
    };
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
    this.logger.info(`Comparing legacy vs standardized implementation for ${this.serviceName}`);
    
    // Test legacy implementation
    this.featureFlags.disable(`services.${this.serviceName}.useStandardizedWrapper`);
    const legacyResult = await this.execute(testInput);
    
    // Test standardized implementation  
    this.featureFlags.enable(`services.${this.serviceName}.useStandardizedWrapper`);
    const standardizedResult = await this.execute(testInput);
    
    // Compare results
    const legacyNormalized = this.validator.normalizeData(legacyResult.data);
    const standardizedNormalized = this.validator.normalizeData(standardizedResult.data);
    
    const legacyHash = this.validator.generateHash(legacyNormalized);
    const standardizedHash = this.validator.generateHash(standardizedNormalized);
    
    const identical = legacyHash === standardizedHash;
    
    this.logger.info('Implementation comparison results', {
      legacyHash,
      standardizedHash,
      identical
    });
    
    if (!identical) {
      const differences = this.validator.findDifferences(legacyNormalized, standardizedNormalized);
      this.logger.warn('Implementation differences found', { differenceCount: differences.length });
      differences.forEach(diff => {
        this.logger.debug('Difference', { path: diff.path, legacy: diff.expected, standardized: diff.actual });
      });
    }
    
    return {
      identical,
      legacyResult,
      standardizedResult,
      differences: identical ? [] : this.validator.findDifferences(legacyNormalized, standardizedNormalized)
    };
  }
}

// Export for use as module
export default KeywordAnalysisAdapter;

// CLI interface for testing and migration
if (import.meta.url === `file://${process.argv[1]}`) {
  const adapter = new KeywordAnalysisAdapter();
  const command = process.argv[2];

  // Test input for keyword analysis
  const testInput = {
    jobDescription: `
      We are looking for a Senior Product Manager with 5+ years of experience.
      
      Required skills:
      - Product management experience (required)
      - Agile methodologies
      - User experience design
      - Data analysis
      - Technical leadership
      
      Must have:
      - Bachelor's degree in Computer Science or related field
      - Experience with SaaS products
      - Strong communication skills
      
      Nice to have:
      - MBA preferred
      - Experience with AI/ML products
    `
  };

  switch (command) {
    case 'test-legacy':
      console.log('Testing legacy implementation...');
      adapter.featureFlags.disable(`services.${adapter.serviceName}.useStandardizedWrapper`);
      adapter.execute(testInput).then(result => {
        console.log('Legacy result:', JSON.stringify(result, null, 2));
      }).catch(error => {
        console.error('Legacy test failed:', error.message);
      });
      break;
      
    case 'test-standardized':
      console.log('Testing standardized implementation...');
      adapter.featureFlags.enable(`services.${adapter.serviceName}.useStandardizedWrapper`);
      adapter.execute(testInput).then(result => {
        console.log('Standardized result:', JSON.stringify(result, null, 2));
      }).catch(error => {
        console.error('Standardized test failed:', error.message);
      });
      break;
      
    case 'create-golden-master':
      console.log('Creating golden master...');
      adapter.createGoldenMaster(testInput).then(() => {
        console.log('✅ Golden master created successfully');
      }).catch(error => {
        console.error('❌ Failed to create golden master:', error.message);
      });
      break;
      
    case 'validate':
      console.log('Validating against golden master...');
      adapter.validateAgainstGoldenMaster(testInput).then(result => {
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
      adapter.compareLegacyVsStandardized(testInput).then(result => {
        if (result.identical) {
          console.log('✅ Implementations produce identical results');
        } else {
          console.log('❌ Implementations produce different results');
          console.log('Differences found:', result.differences.length);
          result.differences.slice(0, 5).forEach(diff => {
            console.log(`  - ${diff.path}: legacy="${diff.expected}", standardized="${diff.actual}"`);
          });
        }
      }).catch(error => {
        console.error('❌ Comparison failed:', error.message);
      });
      break;
      
    default:
      console.log('Keyword Analysis Service Adapter');
      console.log('Usage:');
      console.log('  node keyword-analysis-adapter.js test-legacy');
      console.log('  node keyword-analysis-adapter.js test-standardized');
      console.log('  node keyword-analysis-adapter.js create-golden-master');
      console.log('  node keyword-analysis-adapter.js validate');
      console.log('  node keyword-analysis-adapter.js compare');
      break;
  }
}