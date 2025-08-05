/**
 * Direct Hiring Evaluation Service
 * Provides typed, direct function for hiring evaluation without wrapper abstraction
 */

import { HiringEvaluation, HiringEvaluationInput } from '../types/services';

/**
 * Evaluate hiring potential for a candidate
 * @param applicationName - Name of the application
 * @param resumeData - Resume data object
 * @param fastMode - Optional fast mode flag
 * @returns Promise resolving to hiring evaluation results
 */
export async function evaluateCandidate(
  applicationName: string,
  resumeData: any,
  fastMode = false
): Promise<HiringEvaluation> {
  const input = { applicationName, resumeData, fastMode };
  // Validate input
  if (!input.applicationName || typeof input.applicationName !== 'string') {
    throw new Error('applicationName is required and must be a string');
  }
  if (!input.resumeData || typeof input.resumeData !== 'object') {
    throw new Error('resumeData is required and must be an object');
  }

  // Ensure resume data has basic structure
  if (!input.resumeData.personalInfo && !input.resumeData.basics) {
    throw new Error('Resume data must include personalInfo or basics section');
  }

  try {
    // Dynamic import of the evaluation runner service
    const { default: EvaluationRunner } = await import('./hiring-evaluation/evaluation-runner.js');
    
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
    
    // Transform the result to match the expected interface
    return {
      overallScore: evaluationResult.summary?.composite_score || evaluationResult.composite_score || 0,
      summary: evaluationResult.summary?.overall_assessment || 'Evaluation completed successfully',
      applicationName: input.applicationName,
      fitScore: evaluationResult.summary?.composite_score || evaluationResult.composite_score,
      matchedKeywords: evaluationResult.matched_keywords || [],
      missingKeywords: evaluationResult.missing_keywords || [],
      keyStrengths: evaluationResult.key_strengths || [],
      composite_score: evaluationResult.summary?.composite_score || evaluationResult.composite_score,
      persona_evaluations: evaluationResult.personas || evaluationResult.evaluations || [],
      recommendations: evaluationResult.summary?.key_recommendations || []
    };
    
  } catch (error) {
    console.error(`Evaluation failed: ${error.message}`);
    throw new Error(`Hiring evaluation failed: ${error.message}`);
  }
}

/**
 * Batch evaluate multiple candidates
 * @param candidates - Array of candidate evaluation inputs
 * @returns Promise resolving to array of evaluation results
 */
export async function batchEvaluateCandidates(
  candidates: Array<{
    applicationName?: string;
    resumeData: HiringEvaluationInput['resumeData'];
  }>
): Promise<{
  batch_summary: {
    total: number;
    successful: number;
    failed: number;
  };
  evaluations: Array<{
    success: boolean;
    data?: HiringEvaluation;
    error?: string;
  }>;
}> {
  if (!Array.isArray(candidates) || candidates.length === 0) {
    throw new Error('candidates must be a non-empty array');
  }

  const evaluationPromises = candidates.map(async candidate => {
    try {
      const result = await evaluateCandidate({
        applicationName: candidate.applicationName || 'batch-evaluation',
        resumeData: candidate.resumeData,
        fastMode: true, // Use fast mode for batch processing
      });
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  const results = await Promise.all(evaluationPromises);

  // Aggregate results
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  return {
    batch_summary: {
      total: candidates.length,
      successful: successful.length,
      failed: failed.length,
    },
    evaluations: results,
  };
}