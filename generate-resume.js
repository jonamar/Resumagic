import path from 'path';
import { fileURLToPath } from 'url';
import { parseCliArguments, validateCliArguments, determineGenerationPlan, validateGenerationPlan, displayUsage } from './cli-parser.js';
import { resolvePaths, validatePaths, hasMarkdownFile, loadResumeData, displayApplicationNotFoundError } from './path-resolver.js';
import { orchestrateGeneration } from './document-orchestrator.js';
import { getServiceWrapper } from './services/wrappers/service-registry.js';
import theme from './theme.js';

// ESM equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Main Resume Generator Application
 * Coordinates CLI parsing, path resolution, and document generation
 */

/**
 * Runs keyword analysis for the specified application
 * @param {string} applicationName - Name of the application
 * @returns {Promise<void>}
 */
async function runKeywordAnalysis(applicationName) {
  console.log(`${theme.messages.emojis.processing} Starting keyword analysis...`);
  
  try {
    // Use standardized keyword analysis service wrapper
    const keywordService = getServiceWrapper('keyword-analysis');
    
    // Construct paths to required files
    const applicationPath = path.join(__dirname, '../data/applications', applicationName);
    const keywordsFile = path.join(applicationPath, 'inputs', 'keywords.json');
    const jobPostingFile = path.join(applicationPath, 'inputs', 'job-posting.md');
    const resumeFile = path.join(applicationPath, 'inputs', 'resume.json');
    
    // Prepare input for service wrapper
    const input = {
      applicationName,
      keywordsFile,
      jobPostingFile
    };
    
    // Add resume file if it exists
    const fs = await import('fs');
    if (fs.default.existsSync(resumeFile)) {
      input.resumeFile = resumeFile;
    }
    
    console.log(`${theme.messages.emojis.processing} Running keyword analysis via service wrapper...`);
    
    // Execute analysis using service wrapper
    const result = await keywordService.analyze(input);
    
    if (!result.success) {
      throw new Error(result.error?.message || 'Keyword analysis failed');
    }
    
    console.log(`${theme.messages.emojis.success} Keyword analysis completed successfully!`);
    console.log(`${theme.messages.emojis.folder} Analysis results saved to working directory`);
    
    return result.data;
  } catch (error) {
    console.error(`${theme.messages.emojis.error} Keyword analysis failed: ${error.message}`);
    
    // Enhanced error handling through service wrapper
    if (error.message.includes('FILE_NOT_FOUND')) {
      console.error(`${theme.messages.emojis.warning} Missing required input files. Ensure keywords.json and job-posting.md exist in inputs/ directory.`);
    } else if (error.message.includes('python')) {
      console.error(`${theme.messages.emojis.warning} Python not found or missing dependencies. Run: pip install -r services/keyword-analysis/requirements.txt`);
    }
    
    throw error;
  }
}

/**
 * Runs hiring evaluation for the specified application
 * @param {string} applicationName - Name of the application
 * @param {Object} resumeData - Resume data for candidate name extraction
 * @param {boolean} fastMode - Use faster model for quick evaluation
 * @returns {Promise<void>}
 */
async function runHiringEvaluation(applicationName, resumeData, fastMode = false) {
  const mode = fastMode ? 'fast evaluation' : 'detailed evaluation';
  console.log(`${theme.messages.emojis.processing} Starting hiring ${mode}...`);
  
  try {
    // Use standardized hiring evaluation service wrapper
    const hiringService = getServiceWrapper('hiring-evaluation');
    
    // Extract candidate name from resume data
    const candidateName = resumeData.basics?.name || resumeData.personalInfo?.name || 'Candidate';
    
    console.log(`${theme.messages.emojis.processing} Evaluating candidate: ${candidateName} (${mode})`);
    
    // Prepare input for service wrapper
    const input = {
      applicationName,
      resumeData,
      fastMode
    };
    
    // Execute evaluation using service wrapper
    const result = await hiringService.evaluate(input);
    
    if (!result.success) {
      throw new Error(result.error?.message || 'Hiring evaluation failed');
    }
    
    console.log(`${theme.messages.emojis.success} Hiring ${mode} completed successfully!`);
    console.log(`${theme.messages.emojis.folder} Evaluation results saved to working directory`);
    
    return result.data;
  } catch (error) {
    console.error(`${theme.messages.emojis.error} Hiring evaluation failed: ${error.message}`);
    
    // Enhanced error handling through service wrapper
    if (error.message.includes('localhost:11434') || error.message.includes('connection refused')) {
      console.error(`${theme.messages.emojis.warning} Make sure Ollama is running: ollama serve`);
      console.error(`${theme.messages.emojis.warning} And dolphin3:latest model is available: ollama pull dolphin3:latest`);
      if (fastMode) {
        console.error(`${theme.messages.emojis.warning} For fast mode, also ensure phi3:mini is available: ollama pull phi3:mini`);
      }
    }
    
    throw error;
  }
}

// Main function
(async () => {
  try {
    // Parse command line arguments
    const args = process.argv.slice(2);
    const cliConfig = parseCliArguments(args);
    
    // Validate CLI arguments
    const cliValidation = validateCliArguments(cliConfig);
    if (!cliValidation.isValid) {
      displayUsage(path.resolve(__dirname, theme.fileNaming.dataDir, theme.fileNaming.applicationsDir), cliConfig.applicationName);
      process.exit(1);
    }
    
    const { applicationName, flags } = cliConfig;
    
    console.log(`Command line argument received: ${applicationName}`);
    
    // Resolve all file paths
    const paths = resolvePaths(applicationName, __dirname);
    
    console.log(`${theme.messages.emojis.folder} ${theme.messages.processing.usingFolder.replace('{path}', paths.applicationFolderPath)}`);
    console.log(`${theme.messages.emojis.company} ${theme.messages.processing.companyName.replace('{company}', paths.companyName)}`);
    
    // Validate paths and create output directory
    const pathValidation = validatePaths(paths);
    if (!pathValidation.isValid) {
      if (pathValidation.errorType === 'APPLICATION_NOT_FOUND') {
        displayApplicationNotFoundError(applicationName, __dirname);
      } else {
        console.error(`${theme.messages.emojis.error} ${pathValidation.error}`);
        if (pathValidation.details) {
          pathValidation.details.forEach(detail => console.error(`   ${detail}`));
        }
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
})();
