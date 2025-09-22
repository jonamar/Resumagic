import { executeCommand } from './cli/command-handler.js';
// Services are invoked from CLI modules; keep entry thin

/**
 * Main Resume Generator Application
 * Coordinates CLI parsing, path resolution, and document generation
 */

/**
 * Runs keyword analysis for the specified application
 * @param {string} applicationName - Name of the application
 * @returns {Promise<void>}
 */
// Removed: duplicate helpers now live in CLI; keep main entry thin
/* async function runKeywordAnalysis(applicationName: string): Promise<any> {
  console.log(`${theme.messages.emojis.processing} Starting keyword analysis...`);
  
  try {
    // Construct paths to required files
    const applicationPath = path.join(__dirname, '../data/applications', applicationName);
    const keywordsFile = path.join(applicationPath, 'inputs', 'keywords.json');
    const jobPostingFile = path.join(applicationPath, 'inputs', 'job-posting.md');
    const resumeFile = path.join(applicationPath, 'inputs', 'resume.json');
    
    // Prepare input for direct service function
    const input = {
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
    console.error(`${theme.messages.emojis.error} Keyword analysis failed: ${error.message}`);
    
    // Enhanced error handling
    if (error.message.includes('Keywords file not found') || error.message.includes('Job posting file not found')) {
      console.error(`${theme.messages.emojis.warning} Missing required input files. Ensure keywords.json and job-posting.md exist in inputs/ directory.`);
    } else if (error.message.includes('python')) {
      console.error(`${theme.messages.emojis.warning} Python not found or missing dependencies. Run: pip install -r services/keyword-analysis/requirements.txt`);
    }
    
    throw error;
  }
} */

/**
 * Runs hiring evaluation for the specified application
 * @param {string} applicationName - Name of the application
 * @param {Object} resumeData - Resume data for candidate name extraction
 * @param {boolean} fastMode - Use faster model for quick evaluation
 * @returns {Promise<void>}
 */
/* async function runHiringEvaluation(applicationName: string, resumeData: any, fastMode = false): Promise<any> {
  const mode = fastMode ? 'fast evaluation' : 'detailed evaluation';
  console.log(`${theme.messages.emojis.processing} Starting hiring ${mode}...`);
  
  try {
    // Extract candidate name from resume data
    const candidateName = resumeData.basics?.name || resumeData.personalInfo?.name || 'Candidate';
    
    console.log(`${theme.messages.emojis.processing} Evaluating candidate: ${candidateName} (${mode})`);
    
    // Execute evaluation using direct function
    const result = await evaluateCandidate(applicationName, resumeData, fastMode);
    
    console.log(`${theme.messages.emojis.success} Hiring ${mode} completed successfully!`);
    console.log(`${theme.messages.emojis.folder} Evaluation results saved to working directory`);
    
    return result;
  } catch (error) {
    console.error(`${theme.messages.emojis.error} Hiring evaluation failed: ${error.message}`);
    
    // Enhanced error handling
    if (error.message.includes('localhost:11434') || error.message.includes('connection refused')) {
      console.error(`${theme.messages.emojis.warning} Make sure Ollama is running: ollama serve`);
      console.error(`${theme.messages.emojis.warning} And dolphin3:latest model is available: ollama pull dolphin3:latest`);
      if (fastMode) {
        console.error(`${theme.messages.emojis.warning} For fast mode, also ensure phi3:mini is available: ollama pull phi3:mini`);
      }
    }
    
    throw error;
  }
} */

// Main function
(async () => {
  // Execute the CLI command with the provided arguments
  await executeCommand(process.argv.slice(2));
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
