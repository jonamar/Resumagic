import path from 'path';
import { fileURLToPath } from 'url';
import { parseCliArguments, validateCliArguments, displayUsage } from './argument-parser.js';
import { determineGenerationPlan, validateGenerationPlan } from '../core/generation-planning.js';
import { resolvePaths, validatePaths, hasMarkdownFile, loadResumeData, displayApplicationNotFoundError } from '../core/path-resolution.js';
import { orchestrateGeneration } from '../core/document-orchestration.js';
import { createNewApplication } from '../core/new-application.js';
import { analyzeKeywords } from '../services/keyword-analysis.js';
import { evaluateCandidate } from '../services/hiring-evaluation.js';
import theme from '../theme.js';

// ESM equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * CLI Command Handler Module
 * Main entry point for CLI command execution
 */

import { KeywordAnalysisInput } from '../types/services';

/**
 * Runs keyword analysis for the specified application
 */
async function runKeywordAnalysis(applicationName: string): Promise<any> {
  console.log(`${theme.messages.emojis.processing} Starting keyword analysis...`);
  
  try {
    // Construct paths to required files
    const applicationPath = path.join(__dirname, '../data/applications', applicationName);
    const keywordsFile = path.join(applicationPath, 'inputs', 'keywords.json');
    const jobPostingFile = path.join(applicationPath, 'inputs', 'job-posting.md');
    const resumeFile = path.join(applicationPath, 'inputs', 'resume.json');
    
    // Prepare input for direct service function
    const input: KeywordAnalysisInput = {
      applicationName,
      keywordsFile,
      jobPostingFile,
    };
    
    // Add resume file if it exists
    const fs = await import('fs');
    if (fs.default.existsSync(resumeFile)) {
      input.resumeFile = resumeFile;
    }
    
    console.log(`${theme.messages.emojis.processing} Running keyword analysis...`);
    
    // Execute analysis using direct function
    const result = await analyzeKeywords(
      applicationName,
      keywordsFile, 
      jobPostingFile,
      input.resumeFile,
    );
    
    console.log(`${theme.messages.emojis.success} Keyword analysis completed successfully!`);
    console.log(`${theme.messages.emojis.folder} Analysis results saved to working directory`);
    
    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`${theme.messages.emojis.error} Keyword analysis failed: ${errorMessage}`);
    
    // Enhanced error handling
    if (errorMessage.includes('Keywords file not found') || errorMessage.includes('Job posting file not found')) {
      console.error(`${theme.messages.emojis.warning} Missing required input files. Ensure keywords.json and job-posting.md exist in inputs/ directory.`);
    } else if (errorMessage.includes('python')) {
      console.error(`${theme.messages.emojis.warning} Python not found or missing dependencies. Run: pip install -r services/keyword-analysis/requirements.txt`);
    }
    
    throw error;
  }
}

/**
 * Runs hiring evaluation for the specified application
 */
async function runHiringEvaluation(applicationName: string, resumeData: unknown, fastMode = false): Promise<any> {
  const mode = fastMode ? 'fast evaluation' : 'detailed evaluation';
  console.log(`${theme.messages.emojis.processing} Starting hiring ${mode}...`);
  
  try {
    // Extract candidate name from resume data
    const candidateName = (resumeData as any)?.basics?.name || (resumeData as any)?.personalInfo?.name || 'Candidate';
    
    console.log(`${theme.messages.emojis.processing} Evaluating candidate: ${candidateName} (${mode})`);
    
    console.log(`${theme.messages.emojis.processing} Running hiring evaluation...`);
    
    // Execute evaluation using direct function
    const result = await evaluateCandidate(applicationName, resumeData, fastMode);
    
    // Display evaluation results
    console.log(`${theme.messages.emojis.success} Hiring evaluation completed successfully!`);
    console.log(`${theme.messages.emojis.document} Evaluation Summary:`);
    console.log(`   Fit Score: ${result.fitScore || result.overallScore}/100`);
    console.log(`   Matched Keywords: ${result.matchedKeywords?.length || 0}`);
    console.log(`   Missing Keywords: ${result.missingKeywords?.length || 0}`);
    console.log(`   Key Strengths: ${result.keyStrengths?.join(', ') || 'None identified'}`);
    console.log(`${theme.messages.emojis.folder} Full evaluation saved to working directory`);
    
    return result;
  } catch (error) {
    console.error(`${theme.messages.emojis.error} Hiring evaluation failed: ${(error as Error).message}`);
    
    // Enhanced error handling
    if ((error as Error).message.includes('python')) {
      console.error(`${theme.messages.emojis.warning} Python not found or missing dependencies. Run: pip install -r services/hiring-evaluation/requirements.txt`);
    }
    
    throw error;
  }
}

/**
 * Main CLI command execution function
 * @param {Array} args - Command line arguments
 * @returns {Promise<void>}
 */
async function executeCommand(args: string[]): Promise<void> {
  try {
    // Parse command line arguments
    const cliConfig = parseCliArguments(args);
    const { applicationName, flags, newAppConfig } = cliConfig;
    
    // Validate CLI arguments
    const validation = validateCliArguments(cliConfig);
    if (!validation.isValid) {
      console.error(`${theme.messages.emojis.error} ${validation.error}`);
      if (validation.details) {
        validation.details.forEach(detail => console.error(`   ${detail}`));
      }
      
      // Display usage information (only for non-new-app cases)
      if (!flags.newApp) {
        const applicationsDir = path.resolve(__dirname, '../data/applications');
        displayUsage(applicationsDir, applicationName);
      }
      process.exit(1);
    }
    
    console.log(`${theme.messages.emojis.start} ResumeMagic CLI starting...`);
    
    // Handle new application creation
    if (flags.newApp) {
      const appDir = path.dirname(path.dirname(__dirname));
      const result = createNewApplication(newAppConfig.company, newAppConfig.jobTitle, appDir);
      
      if (!result.isValid) {
        console.error(`${theme.messages.emojis.error} ${result.error}`);
        if (result.details) {
          result.details.forEach(detail => console.error(`   ${detail}`));
        }
        process.exit(1);
      }
      
      const appInfo = result.data;
      console.log(`${theme.messages.emojis.success} New application created successfully!`);
      console.log(`${theme.messages.emojis.folder} Application: ${appInfo.applicationName}`);
      console.log(`${theme.messages.emojis.folder} Directory: ${appInfo.applicationPath}`);
      console.log(`${theme.messages.emojis.document} Company: ${appInfo.company}`);
      console.log(`${theme.messages.emojis.document} Role: ${appInfo.jobTitle}`);
      console.log('');
      console.log(`${theme.messages.emojis.document} Next steps:`);
      console.log('   1. Edit inputs/job-posting.md with the full job description');
      console.log('   2. Customize inputs/cover-letter.md for this role');
      console.log(`   3. Generate documents: node generate-resume.js ${appInfo.applicationName}`);
      
      process.exit(0);
    }
    
    // Resolve and validate paths
    // Need to go up two levels from dist/cli/ to app/, then resolvePaths handles ../data
    const appDir = path.dirname(path.dirname(__dirname));
    const paths = resolvePaths(applicationName, appDir, flags.test);
    const pathValidation = validatePaths(paths);
    if (!pathValidation.isValid) {
      console.error(`${theme.messages.emojis.error} ${pathValidation.error}`);
      if (pathValidation.details) {
        pathValidation.details.forEach(detail => console.error(`   ${detail}`));
      }
      
      // Display application not found error with helpful information
      if (pathValidation.errorType === 'APPLICATION_NOT_FOUND') {
        displayApplicationNotFoundError(applicationName, __dirname);
      }
      
      process.exit(1);
    }
    
    // Load resume data
    const resumeDataResult = loadResumeData(paths.resumeDataPath);
    if (!resumeDataResult.isValid) {
      console.error(`${theme.messages.emojis.error} ${resumeDataResult.error}`);
      process.exit(1);
    }
    
    const resumeData = resumeDataResult.data;
    console.log('Resume data loaded successfully');
    
    // Check for markdown file
    const markdownFileExists = hasMarkdownFile(paths.markdownFilePath);
    
    // Determine generation plan
    const generationPlan = determineGenerationPlan(flags, markdownFileExists);
    
    // Display behavior description
    if (generationPlan.behaviorDescription) {
      console.log(`${theme.messages.emojis.document} ${generationPlan.behaviorDescription}`);
    }
    
    // Validate generation plan
    const planValidation = validateGenerationPlan(generationPlan, markdownFileExists, paths.markdownFilePath);
    if (!planValidation.isValid) {
      console.error(`${theme.messages.emojis.error} ${planValidation.error}`);
      if (planValidation.details) {
        planValidation.details.forEach(detail => console.error(`   ${detail}`));
      }
      process.exit(1);
    }
    
    // Execute document generation
    const _generatedFiles = await orchestrateGeneration(generationPlan, paths, resumeData, flags.preview);
    
    // Execute additional services if requested
    if (generationPlan.runHiringEvaluation) {
      // For --all flag, run keyword analysis first, then hiring evaluation
      if (flags.all) {
        await runKeywordAnalysis(applicationName);
      }
      await runHiringEvaluation(applicationName, resumeData, flags.fast);
    }
    
    // Exit successfully
    process.exit(0);
    
  } catch (error) {
    console.error('Error generating documents:', error);
    process.exit(1);
  }
}

export {
  executeCommand,
  runKeywordAnalysis,
  runHiringEvaluation,
};
