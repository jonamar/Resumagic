import path from 'path';
import { fileURLToPath } from 'url';
import { parseCliArguments, validateCliArguments, displayUsage } from './argument-parser.js';
import { determineGenerationPlan, validateGenerationPlan } from '../services/document-generation/generation-planning.js';
import { resolvePaths, validatePaths, hasMarkdownFile, loadResumeData, displayApplicationNotFoundError, resolveCanonicalPaths } from '../services/document-generation/path-resolution.js';
import { orchestrateGeneration } from '../services/document-generation/document-orchestration.js';
import { createNewApplication } from '../services/document-generation/new-application.js';
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
    // Construct paths to required files (resolve from app root, not dist/cli)
    const appDir = path.dirname(path.dirname(__dirname));
    const applicationPath = path.resolve(appDir, theme.fileNaming.dataDir, theme.fileNaming.applicationsDir, applicationName);
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
    
    // Execute analysis using direct function (dynamically imported to avoid TS compile of services)
    const { analyzeKeywords } = await import('../services/' + 'keyword-analysis.js');
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
 * Extract keywords only (no analysis), generating inputs/keywords.json from job-posting.md
 */
async function extractKeywordsOnly(applicationName: string): Promise<void> {
  const appDir = path.dirname(path.dirname(__dirname));
  const applicationPath = path.resolve(appDir, theme.fileNaming.dataDir, theme.fileNaming.applicationsDir, applicationName);
  const keywordsFile = path.join(applicationPath, 'inputs', 'keywords.json');
  const jobPostingFile = path.join(applicationPath, 'inputs', 'job-posting.md');
  const extractorPath = path.resolve(appDir, 'dist/services/keyword-extraction.js');
  const { exec } = await import('child_process');
  const { promisify } = await import('util');
  const execAsync = promisify(exec);
  await execAsync(`node "${extractorPath}" "${jobPostingFile}" "${keywordsFile}"`, { cwd: appDir, timeout: 180000 });
}

/**
 * Runs hiring evaluation for the specified application
 */
async function runHiringEvaluation(applicationName: string, resumeData: unknown, fastMode = false, evalModel?: string | null, evalParallel?: number | null, evalTemperature?: number | null): Promise<any> {
  const mode = fastMode ? 'fast evaluation' : 'detailed evaluation';
  console.log(`${theme.messages.emojis.processing} Starting hiring ${mode}...`);
  
  try {
    // Extract candidate name from resume data
    const candidateName = (resumeData as any)?.basics?.name || (resumeData as any)?.personalInfo?.name || 'Candidate';
    
    console.log(`${theme.messages.emojis.processing} Evaluating candidate: ${candidateName} (${mode})`);
    
    console.log(`${theme.messages.emojis.processing} Running hiring evaluation...`);
    
    // Execute evaluation using direct function (dynamically imported to avoid TS compile of services)
    // Resolve hiring evaluation at runtime; prefer app-root path when dist module not present
    let evaluateCandidate: any;
    try {
      ({ evaluateCandidate } = await import('../services/' + 'hiring-evaluation.js'));
    } catch {
      ({ evaluateCandidate } = await import('../../services/' + 'hiring-evaluation.js'));
    }
    const result = await evaluateCandidate(applicationName, resumeData, fastMode, evalModel, evalParallel, evalTemperature);
    
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
    const validation = validateCliArguments(cliConfig) as unknown as { isValid: boolean; error?: string; details?: string[] };
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
      const result = createNewApplication(newAppConfig!.company, newAppConfig!.jobTitle, appDir);
      
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
    
    // Need to go up two levels from dist/cli/ to app/
    const appDir = path.dirname(path.dirname(__dirname));

    // Special handling: canonical output flag directs outputs to data/canonical/outputs
    if ((flags as any).canonicalOutput) {
      const canonical = resolveCanonicalPaths(appDir);
      // Ensure outputs directory exists
      const fs = await import('fs');
      if (!fs.default.existsSync(canonical.outputsDir)) {
        fs.default.mkdirSync(canonical.outputsDir, { recursive: true });
      }

      // Build output paths using existing naming patterns
      const companyName = 'Canonical';
      const canonicalPaths = {
        resumeDataPath: canonical.resumeFile,
        markdownFilePath: canonical.coverLetterFile,
        resumeDocxPath: path.join(canonical.outputsDir, theme.fileNaming.resumePattern.replace('{company}', companyName)),
        coverLetterDocxPath: path.join(canonical.outputsDir, theme.fileNaming.coverLetterPattern.replace('{company}', companyName)),
        combinedDocxPath: path.join(canonical.outputsDir, theme.fileNaming.combinedPattern.replace('{company}', companyName)),
      } as const;

      // Load resume data
      const resumeDataResult = loadResumeData(canonicalPaths.resumeDataPath);
      if (!resumeDataResult.isValid) {
        console.error(`${theme.messages.emojis.error} ${resumeDataResult.error}`);
        process.exit(1);
      }
      const resumeData = resumeDataResult.data;
      console.log('Resume data loaded successfully');

      // Check for markdown file and determine plan
      const markdownFileExists = hasMarkdownFile(canonicalPaths.markdownFilePath);
      const generationPlan = determineGenerationPlan(flags, markdownFileExists);
      if (generationPlan.behaviorDescription) {
        console.log(`${theme.messages.emojis.document} ${generationPlan.behaviorDescription}`);
      }
      const planValidation = await validateGenerationPlan(generationPlan, markdownFileExists, canonicalPaths.markdownFilePath);
      if (!planValidation.isValid) {
        console.error(`${theme.messages.emojis.error} ${planValidation.error}`);
        if (planValidation.details) {
          planValidation.details.forEach((detail: string) => console.error(`   ${detail}`));
        }
        process.exit(1);
      }

      // Only generate documents for canonical output flag (skip keyword analysis/evaluation)
      await orchestrateGeneration(generationPlan, canonicalPaths as any, resumeData, Boolean(flags.preview));
      process.exit(0);
    }

    // Resolve and validate paths for normal application flow
    const safeAppName = applicationName ?? '';
    const paths = resolvePaths(safeAppName, appDir, Boolean(flags.test));
    const pathValidation = validatePaths(paths);
    if (!pathValidation.isValid) {
      console.error(`${theme.messages.emojis.error} ${pathValidation.error}`);
      if (pathValidation.details) {
        pathValidation.details.forEach(detail => console.error(`   ${detail}`));
      }
      // Display application not found error with helpful information
      if (pathValidation.errorType === 'APPLICATION_NOT_FOUND') {
        displayApplicationNotFoundError(safeAppName, __dirname);
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
    const planValidation = await validateGenerationPlan(generationPlan, markdownFileExists, paths.markdownFilePath);
    if (!planValidation.isValid) {
      console.error(`${theme.messages.emojis.error} ${planValidation.error}`);
      if (planValidation.details) {
        planValidation.details.forEach((detail: string) => console.error(`   ${detail}`));
      }
      process.exit(1);
    }

    // Optional: extract keywords only
    if (flags.extractKeywords) {
      await extractKeywordsOnly(safeAppName);
      process.exit(0);
    }

    // Execute document generation unless evaluate-only is requested
    if (!flags.evaluateOnly) {
      await orchestrateGeneration(generationPlan, paths as any, resumeData, Boolean(flags.preview));
    }

    // Execute additional services if requested
    if (generationPlan.runHiringEvaluation || flags.evaluateOnly) {
      // For --all flag, run keyword analysis first, then hiring evaluation
      if (flags.all) {
        await runKeywordAnalysis(safeAppName);
      }
      await runHiringEvaluation(safeAppName, resumeData, flags.fast, flags.evalModel, flags.evalParallel, flags.evalTemperature);
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
