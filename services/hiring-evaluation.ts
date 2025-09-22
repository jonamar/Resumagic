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
  fastMode = false,
  evalModel?: string | null,
  evalParallel?: number | null,
  evalTemperature?: number | null,
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
    
    // Default parallelism: fast mode → 4, quality mode (dolphin) → 1 (if not explicitly set)
    if (process.env.OLLAMA_NUM_PARALLEL === undefined || process.env.OLLAMA_NUM_PARALLEL === '') {
      process.env.OLLAMA_NUM_PARALLEL = input.fastMode ? '4' : '1';
      console.log(`⚙️ Default OLLAMA_NUM_PARALLEL set to: ${process.env.OLLAMA_NUM_PARALLEL}`);
    }
    
    // Configure model if specified
    if (typeof evalModel === 'string' && evalModel.trim() !== '') {
      console.log(`🔧 Setting evaluation model to: ${evalModel}`);
      // Set the model on the evaluation runner
      // We'll need to check if this method exists
      if (typeof evaluationRunner.setModel === 'function') {
        evaluationRunner.setModel(evalModel);
      }
    }
    
    // Configure parallel setting if specified
    if (typeof evalParallel === 'number' && Number.isFinite(evalParallel)) {
      console.log(`⚙️ Setting OLLAMA_NUM_PARALLEL to: ${evalParallel}`);
      process.env.OLLAMA_NUM_PARALLEL = evalParallel.toString();
    }
    
    // Configure temperature if specified
    if (typeof evalTemperature === 'number' && Number.isFinite(evalTemperature)) {
      console.log(`🌡️ Setting temperature override to: ${evalTemperature}`);
      if (typeof evaluationRunner.setTemperature === 'function') {
        evaluationRunner.setTemperature(evalTemperature);
      }
    }
    
    // Extract candidate name from resume data
    const candidateName = input.resumeData.personalInfo?.name || 
                         input.resumeData.basics?.name || 
                         'Unknown Candidate';
    
    console.log(`🔄 Running evaluation for ${candidateName} (application: ${input.applicationName})`);
    
    // Execute the evaluation using the service's native API
    const evaluationResult = await evaluationRunner.runEvaluation(candidateName);
    const raw = evaluationResult.rawResults;
    const summaryMd = evaluationResult.summary;
    const personaScores = Array.isArray(raw?.evaluations)
      ? raw.evaluations
        .map(e => (e?.overall_assessment?.persona_score ?? null))
        .filter((v): v is number => typeof v === 'number')
      : [];
    const compositeAvg = personaScores.length > 0
      ? personaScores.reduce((a, b) => a + b, 0) / personaScores.length
      : 0;

    // Transform to expected interface while we incrementally type internals
    return {
      overallScore: compositeAvg,
      summary: summaryMd || 'Evaluation completed successfully',
      applicationName: input.applicationName,
      fitScore: compositeAvg,
      matchedKeywords: [],
      missingKeywords: [],
      keyStrengths: [],
      composite_score: compositeAvg,
      persona_evaluations: (raw?.evaluations || []) as any,
      recommendations: [],
    };
    
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Evaluation failed: ${message}`);
    throw new Error(`Hiring evaluation failed: ${message}`);
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
  }>,
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
      const result = await evaluateCandidate(
        candidate.applicationName || 'batch-evaluation',
        candidate.resumeData,
        true,
      );
      return { success: true, data: result };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return { success: false, error: message };
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
