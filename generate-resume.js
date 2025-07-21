const path = require('path');
const { parseCliArguments, validateCliArguments, determineGenerationPlan, validateGenerationPlan, displayUsage } = require('./cli-parser');
const { resolvePaths, validatePaths, hasMarkdownFile, loadResumeData, displayApplicationNotFoundError } = require('./path-resolver');
const { orchestrateGeneration } = require('./document-orchestrator');
const theme = require('./theme');

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
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);
    const path = require('path');
    const fs = require('fs');
    
    // Construct paths to required files
    const applicationPath = path.join(__dirname, '../data/applications', applicationName);
    const keywordsFile = path.join(applicationPath, 'inputs', 'keywords.json');
    const jobPostingFile = path.join(applicationPath, 'inputs', 'job-posting.md');
    const resumeFile = path.join(applicationPath, 'inputs', 'resume.json');
    
    // Check if required files exist
    if (!fs.existsSync(keywordsFile)) {
      throw new Error(`Keywords file not found: ${keywordsFile}`);
    }
    if (!fs.existsSync(jobPostingFile)) {
      throw new Error(`Job posting file not found: ${jobPostingFile}`);
    }
    
    // Construct the command with proper arguments
    let keywordAnalysisCommand = `python services/keyword-analysis/kw_rank_modular.py "${keywordsFile}" "${jobPostingFile}"`;
    
    // Add resume file if it exists for sentence matching
    if (fs.existsSync(resumeFile)) {
      keywordAnalysisCommand += ` --resume "${resumeFile}"`;
    }
    
    console.log(`${theme.messages.emojis.processing} Running: ${keywordAnalysisCommand}`);
    
    const { stdout, stderr } = await execAsync(keywordAnalysisCommand, {
      cwd: __dirname,
      timeout: 60000 // 1 minute timeout
    });
    
    if (stderr) {
      console.warn(`${theme.messages.emojis.warning} Keyword analysis warnings: ${stderr}`);
    }
    
    console.log(`${theme.messages.emojis.success} Keyword analysis completed successfully!`);
    return stdout;
  } catch (error) {
    console.error(`${theme.messages.emojis.error} Keyword analysis failed: ${error.message}`);
    
    // Check common issues
    if (error.message.includes('python: command not found')) {
      console.error(`${theme.messages.emojis.warning} Python not found. Make sure Python is installed and in PATH.`);
    } else if (error.message.includes('No module named')) {
      console.error(`${theme.messages.emojis.warning} Missing Python dependencies. Run: pip install -r services/keyword-analysis/requirements.txt`);
    } else if (error.message.includes('not found:')) {
      console.error(`${theme.messages.emojis.warning} Missing required input files. Ensure keywords.json and job-posting.md exist in inputs/ directory.`);
    }
    
    throw error;
  }
}

/**
 * Runs hiring evaluation for the specified application
 * @param {string} applicationName - Name of the application
 * @param {Object} resumeData - Resume data for candidate name extraction
 * @returns {Promise<void>}
 */
async function runHiringEvaluation(applicationName, resumeData) {
  console.log(`${theme.messages.emojis.processing} Starting hiring evaluation...`);
  
  try {
    const EvaluationRunner = require('./services/hiring-evaluation/evaluation-runner');
    const evaluator = new EvaluationRunner(applicationName);
    
    // Extract candidate name from resume data
    const candidateName = resumeData.basics?.name || 'Candidate';
    
    console.log(`${theme.messages.emojis.processing} Evaluating candidate: ${candidateName}`);
    
    // Run the evaluation
    const results = await evaluator.runEvaluation(candidateName);
    
    console.log(`${theme.messages.emojis.success} Hiring evaluation completed successfully!`);
    console.log(`${theme.messages.emojis.folder} Evaluation results saved to working directory`);
    
    return results;
  } catch (error) {
    console.error(`${theme.messages.emojis.error} Hiring evaluation failed: ${error.message}`);
    
    // Check if it's an Ollama connection error
    if (error.message.includes('localhost:11434') || error.message.includes('connection refused')) {
      console.error(`${theme.messages.emojis.warning} Make sure Ollama is running: ollama serve`);
      console.error(`${theme.messages.emojis.warning} And dolphin3:latest model is available: ollama pull dolphin3:latest`);
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
    const generatedFiles = await orchestrateGeneration(generationPlan, paths, resumeData, flags.preview);
    
    // Execute additional services if requested
    if (generationPlan.runHiringEvaluation) {
      // For --all flag, run keyword analysis first, then hiring evaluation
      if (flags.all) {
        await runKeywordAnalysis(applicationName);
      }
      await runHiringEvaluation(applicationName, resumeData);
    }
    
    // Exit successfully
    process.exit(0);
    
  } catch (error) {
    console.error('Error generating documents:', error);
    process.exit(1);
  }
})();
