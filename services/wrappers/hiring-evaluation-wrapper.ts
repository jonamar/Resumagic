/**
 * Hiring Evaluation Service Wrapper
 * Provides standardized JSON API over Node.js hiring evaluation service
 * Part of Phase 2: Standardize Existing Service Infrastructure
 */

import { BaseServiceWrapper, ServiceResponse } from './base-service-wrapper';

interface HiringEvaluationInput {
  applicationName: string;
  resumeData: {
    personalInfo?: {
      name?: string;
      email?: string;
    };
    basics?: {
      name?: string;
      email?: string;
    };
  };
  fastMode?: boolean;
  jobPostingFile?: string;
}

interface BatchEvaluationInput {
  candidates: Array<{
    applicationName?: string;
    resumeData: HiringEvaluationInput['resumeData'];
  }>;
}

class HiringEvaluationWrapper extends BaseServiceWrapper {
  constructor() {
    super('hiring-evaluation');
  }

  /**
   * Evaluate hiring potential for a candidate
   */
  async evaluate(input: HiringEvaluationInput): Promise<ServiceResponse> {
    const startTime = Date.now();
    
    this.logOperation('evaluate', {
      applicationName: input.applicationName,
      candidateName: input.resumeData?.personalInfo?.name || 'Unknown',
      fastMode: !!input.fastMode,
    });

    try {
      // Validate input
      this.validateInput(input, {
        applicationName: { type: 'string', required: true },
        resumeData: { type: 'object', required: true },
      });

      // Ensure resume data has basic structure
      if (!input.resumeData.personalInfo) {
        const duration = Date.now() - startTime;
        return this.createErrorResponse(
          'INVALID_RESUME_DATA',
          'Resume data must include personalInfo section',
          { provided: Object.keys(input.resumeData) },
          duration,
        );
      }

      const result = await this.executeEvaluation(input, startTime);

      return result;

    } catch (error) {
      const duration = Date.now() - startTime;
      return this.createErrorResponse(
        'EVALUATION_FAILED',
        `Hiring evaluation failed: ${error.message}`,
        { 
          originalError: error.message,
          stack: error.stack, 
        },
        duration,
      );
    }
  }

  /**
   * Execute hiring evaluation using direct EvaluationRunner API
   */
  private async executeEvaluation(input: HiringEvaluationInput, startTime: number): Promise<ServiceResponse> {
    try {
      // Dynamic import of the evaluation runner service
      const { default: EvaluationRunner } = await import('../hiring-evaluation/evaluation-runner');
      
      // Initialize evaluation runner with application context
      const evaluationRunner = new EvaluationRunner(input.applicationName);
      
      // Configure fast mode if requested
      if (input.fastMode) {
        evaluationRunner.setFastMode(true);
      }
      
      // Extract candidate name from resume data
      const candidateName = input.resumeData.personalInfo?.name || 
                           input.resumeData.basics?.name || 
                           'Unknown Candidate';
      
      console.log(`🔄 Running evaluation for ${candidateName} (application: ${input.applicationName})`);
      
      // Execute the evaluation using the service's native API
      const evaluationResult = await evaluationRunner.runEvaluation(candidateName);
      
      // Return standardized response format
      const duration = Date.now() - startTime;
      return this.createSuccessResponse({
        evaluation: {
          overall_score: evaluationResult.summary?.composite_score || evaluationResult.composite_score,
          summary: evaluationResult.summary?.overall_assessment || 'Evaluation completed successfully',
          persona_evaluations: evaluationResult.personas || evaluationResult.evaluations,
          recommendations: evaluationResult.summary?.key_recommendations || [],
          composite_score: evaluationResult.summary?.composite_score || evaluationResult.composite_score,
          individual_scores: evaluationResult.summary?.persona_scores || {},
        },
        candidate: {
          name: candidateName,
          email: input.resumeData.personalInfo?.email || input.resumeData.basics?.email,
        },
        context: {
          applicationName: input.applicationName,
          fastMode: input.fastMode || false,
          evaluation_timestamp: new Date().toISOString(),
        },
        implementation: 'hiring-evaluation',
      }, duration);
      
    } catch (error) {
      console.error(`Evaluation failed: ${error.message}`);
      
      // If evaluation fails, provide a structured error response
      const duration = Date.now() - startTime;
      return this.createErrorResponse(
        'STANDARDIZED_EVALUATION_FAILED',
        `Hiring evaluation failed: ${error.message}`,
        { 
          originalError: error.message,
          stack: error.stack,
          applicationName: input.applicationName,
          candidateName: input.resumeData.personalInfo?.name,
        },
        duration,
      );
    }
  }

  /**
   * Get evaluation summary for multiple candidates
   */
  async batchEvaluate(input: BatchEvaluationInput): Promise<ServiceResponse> {
    const startTime = Date.now();
    
    try {
      this.validateInput(input, {
        candidates: { type: 'object', required: true }, // Array shows as object in typeof
      });

      if (!Array.isArray(input.candidates) || input.candidates.length === 0) {
        const duration = Date.now() - startTime;
        return this.createErrorResponse(
          'INVALID_CANDIDATES',
          'candidates must be a non-empty array',
          { provided: typeof input.candidates },
          duration,
        );
      }

      const evaluationPromises = input.candidates.map(candidate => 
        this.evaluate({
          applicationName: candidate.applicationName || 'batch-evaluation',
          resumeData: candidate.resumeData,
          fastMode: true, // Use fast mode for batch processing
        }),
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
          failed: failed.length,
        },
        evaluations: results,
        implementation: 'hiring-evaluation',
      }, duration);

    } catch (error) {
      const duration = Date.now() - startTime;
      return this.createErrorResponse(
        'BATCH_EVALUATION_FAILED',
        `Batch evaluation failed: ${error.message}`,
        { originalError: error.message },
        duration,
      );
    }
  }
}

export default HiringEvaluationWrapper;
