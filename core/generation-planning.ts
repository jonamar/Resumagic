import theme from '../theme.js';
import ErrorHandler from '../utils/error-handler.js';
import { ERROR_TYPES } from '../utils/error-types.js';

// ErrorHandler provides static utilities; no instance required

/**
 * Generation Planning Module
 * Handles document generation planning logic based on CLI flags and file availability
 */

interface CLIFlags {
  all?: boolean;
  evaluate?: boolean;
  coverLetter?: boolean;
  both?: boolean;
  combined?: boolean;
  auto?: boolean;
}

interface GenerationPlan {
  generateResume: boolean;
  generateCoverLetter: boolean;
  generateCombinedDoc: boolean;
  runHiringEvaluation: boolean;
  behaviorDescription: string;
}

interface ValidationResult {
  isValid: boolean;
  error?: string;
  errorType?: string;
  details?: string[];
  data?: unknown;
}

/**
 * Determines what document types to generate based on flags and file availability
 */
function determineGenerationPlan(flags: CLIFlags, hasMarkdownFile: boolean): GenerationPlan {
  let generateResume = false;
  let generateCoverLetter = false;
  let generateCombinedDoc = false;
  let runHiringEvaluation = false;
  let behaviorDescription = '';
  
  // Handle --all flag (complete workflow)
  if (flags.all) {
    generateResume = true;
    generateCoverLetter = hasMarkdownFile;
    generateCombinedDoc = hasMarkdownFile;
    runHiringEvaluation = true;
    behaviorDescription = hasMarkdownFile ? 
      'Complete workflow: documents + keyword analysis + hiring evaluation' : 
      'Complete workflow: resume + keyword analysis + hiring evaluation';
  }
  // Handle --evaluate flag (documents + hiring evaluation)
  else if (flags.evaluate) {
    if (hasMarkdownFile) {
      generateResume = true;
      generateCoverLetter = true;
      generateCombinedDoc = true;
    } else {
      generateResume = true;
    }
    runHiringEvaluation = true;
    behaviorDescription = hasMarkdownFile ?
      'Document generation + hiring evaluation' :
      'Resume generation + hiring evaluation';
  }
  // Existing document-only flags
  else if (flags.coverLetter) {
    generateCoverLetter = true;
    behaviorDescription = 'Cover letter only mode';
  } else if (flags.both) {
    generateResume = true;
    generateCoverLetter = true;
    behaviorDescription = 'Both resume and cover letter mode';
  } else if (flags.combined) {
    generateCombinedDoc = true;
    behaviorDescription = 'Combined document mode';
  } else if (flags.auto) {
    generateResume = true;
    generateCoverLetter = hasMarkdownFile;
    behaviorDescription = hasMarkdownFile ? 
      'Auto mode: generating resume and cover letter' : 
      'Auto mode: generating resume only';
  } else {
    // Default behavior - generate all three formats if both content types are available
    if (hasMarkdownFile) {
      generateResume = true;
      generateCoverLetter = true;
      generateCombinedDoc = true;
      behaviorDescription = theme.messages.usage.defaultBehavior;
    } else {
      // Only resume content available - generate resume only
      generateResume = true;
      behaviorDescription = theme.messages.usage.defaultResumeOnly;
    }
  }
  
  return {
    generateResume,
    generateCoverLetter,
    generateCombinedDoc,
    runHiringEvaluation,
    behaviorDescription,
  };
}

/**
 * Validates that the generation plan is feasible given available files
 */
async function validateGenerationPlan(plan: GenerationPlan, hasMarkdownFile: boolean, markdownFilePath: string): Promise<ValidationResult> {
  const { generateCoverLetter, generateCombinedDoc } = plan;
  
  // Check if cover letter generation is requested but no markdown file exists
  if ((generateCoverLetter || generateCombinedDoc) && !hasMarkdownFile) {
    const context = await ErrorHandler.buildFileContext(markdownFilePath, {
      operation: 'cover letter generation',
      required: true,
      generateCoverLetter,
      generateCombinedDoc,
    });
    
    // Log with proper parameters: component, message, error, details, context
    ErrorHandler.logAppError(
      'generation-planning',
      'Cover letter generation requested but markdown file not found',
      null,
      [],
      context,
    );
    
    return ErrorHandler.createResult(
      false,
      null,
      theme.messages.errors.coverLetterNotFound,
      ERROR_TYPES.FILE_NOT_FOUND,
      [
        theme.messages.errors.coverLetterRequired.replace('{path}', markdownFilePath),
      ],
    );
  }
  
  return ErrorHandler.createResult(true);
}

export {
  determineGenerationPlan,
  validateGenerationPlan,
};
