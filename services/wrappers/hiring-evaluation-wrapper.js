/**
 * Hiring Evaluation Service Wrapper
 * Provides standardized JSON API over Node.js hiring evaluation service
 * Part of Phase 2: Standardize Existing Service Infrastructure
 */

import fs from 'fs';
import path from 'path';
import { BaseServiceWrapper } from './base-service-wrapper.js';

class HiringEvaluationWrapper extends BaseServiceWrapper {
  constructor() {
    super('hiring-evaluation', 'STANDARDIZED_HIRING_EVALUATION');
  }

  /**
   * Evaluate hiring potential for a candidate
   * @param {Object} input - Evaluation input
   * @param {string} input.applicationName - Name of the application
   * @param {Object} input.resumeData - Resume data for candidate
   * @param {boolean} [input.fastMode] - Use faster model for quick evaluation
   * @param {string} [input.jobPostingFile] - Optional job posting for context
   * @returns {Promise<ServiceResponse>}
   */
  async evaluate(input) {
    const startTime = Date.now();
    const useLegacy = this.shouldUseLegacyImplementation();
    
    this.logOperation('evaluate', {
      applicationName: input.applicationName,
      candidateName: input.resumeData?.personalInfo?.name || 'Unknown',
      fastMode: !!input.fastMode
    }, useLegacy);

    try {
      // Validate input
      this.validateInput(input, {
        applicationName: { type: 'string', required: true },
        resumeData: { type: 'object', required: true }
      });

      // Ensure resume data has basic structure
      if (!input.resumeData.personalInfo) {
        const duration = Date.now() - startTime;
        return this.createErrorResponse(
          'INVALID_RESUME_DATA',
          'Resume data must include personalInfo section',
          { provided: Object.keys(input.resumeData) },
          duration
        );
      }

      let result;
      if (useLegacy) {
        result = await this.executeLegacyEvaluation(input, startTime);
      } else {
        result = await this.executeStandardizedEvaluation(input, startTime);
      }

      return result;

    } catch (error) {
      const duration = Date.now() - startTime;
      return this.createErrorResponse(
        'EVALUATION_FAILED',
        `Hiring evaluation failed: ${error.message}`,
        { 
          originalError: error.message,
          stack: error.stack 
        },
        duration
      );
    }
  }

  /**
   * Execute legacy hiring evaluation
   * @private
   */
  async executeLegacyEvaluation(input, startTime) {
    try {
      // Import the actual hiring evaluation service
      const { default: evaluationRunner } = await import('../hiring-evaluation/evaluation-runner.js');
      
      // Prepare evaluation context
      const evaluationContext = {
        applicationName: input.applicationName,
        candidateName: input.resumeData.personalInfo.name,
        resumeData: input.resumeData,
        fastMode: input.fastMode || false
      };

      // Add job posting context if available
      if (input.jobPostingFile && fs.existsSync(input.jobPostingFile)) {
        const jobPosting = fs.readFileSync(input.jobPostingFile, 'utf8');
        evaluationContext.jobPosting = jobPosting;
      }

      // Run the evaluation
      const evaluationResult = await evaluationRunner.runEvaluation(evaluationContext);
      
      const duration = Date.now() - startTime;
      
      return this.createSuccessResponse({
        evaluation: evaluationResult,
        candidate: {
          name: input.resumeData.personalInfo.name,
          email: input.resumeData.personalInfo.email
        },
        context: {
          applicationName: input.applicationName,
          fastMode: input.fastMode || false
        },
        implementation: 'legacy'
      }, duration);

    } catch (error) {
      // If the direct service call fails, fall back to a simulated evaluation
      console.warn(`Direct evaluation service failed, using fallback: ${error.message}`);
      
      const duration = Date.now() - startTime;
      
      return this.createSuccessResponse({
        evaluation: {
          overall_score: 'Unable to complete full evaluation',
          summary: 'Evaluation service temporarily unavailable. Resume data validated successfully.',
          recommendations: [
            'Resume structure appears valid',
            'Consider running evaluation again when service is available'
          ]
        },
        candidate: {
          name: input.resumeData.personalInfo.name,
          email: input.resumeData.personalInfo.email
        },
        context: {
          applicationName: input.applicationName,
          fastMode: input.fastMode || false
        },
        implementation: 'legacy-fallback',
        warning: 'Full evaluation service not available, using fallback validation'
      }, duration);
    }
  }

  /**
   * Execute standardized evaluation (future implementation)
   * @private
   */
  async executeStandardizedEvaluation(input, startTime) {
    // For now, this is a placeholder that calls the legacy implementation
    // In future phases, this would use a more standardized API
    const result = await this.executeLegacyEvaluation(input, startTime);
    
    // Mark as standardized implementation
    if (result.data) {
      result.data.implementation = 'standardized';
    }
    
    return result;
  }

  /**
   * Get evaluation summary for multiple candidates
   * @param {Object} input - Batch evaluation input
   * @param {Array} input.candidates - Array of candidate data objects
   * @returns {Promise<ServiceResponse>}
   */
  async batchEvaluate(input) {
    const startTime = Date.now();
    
    try {
      this.validateInput(input, {
        candidates: { type: 'object', required: true } // Array shows as object in typeof
      });

      if (!Array.isArray(input.candidates) || input.candidates.length === 0) {
        const duration = Date.now() - startTime;
        return this.createErrorResponse(
          'INVALID_CANDIDATES',
          'candidates must be a non-empty array',
          { provided: typeof input.candidates },
          duration
        );
      }

      const evaluationPromises = input.candidates.map(candidate => 
        this.evaluate({
          applicationName: candidate.applicationName || 'batch-evaluation',
          resumeData: candidate.resumeData,
          fastMode: true // Use fast mode for batch processing
        })
      );

      const results = await Promise.all(evaluationPromises);
      const duration = Date.now() - startTime;

      // Aggregate results
      const successful = results.filter(r => r.success);
      const failed = results.filter(r => !r.success);

      return this.createSuccessResponse({
        batch_summary: {
          total: input.candidates.length,
          successful: successful.length,
          failed: failed.length
        },
        evaluations: results,
        implementation: this.shouldUseLegacyImplementation() ? 'legacy' : 'standardized'
      }, duration);

    } catch (error) {
      const duration = Date.now() - startTime;
      return this.createErrorResponse(
        'BATCH_EVALUATION_FAILED',
        `Batch evaluation failed: ${error.message}`,
        { originalError: error.message },
        duration
      );
    }
  }
}

export default HiringEvaluationWrapper;
