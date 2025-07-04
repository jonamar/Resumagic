const path = require('path');
const { parseCliArguments, validateCliArguments, determineGenerationPlan, validateGenerationPlan, displayUsage } = require('./cli-parser');
const { resolvePaths, validatePaths, hasMarkdownFile, loadResumeData, displayApplicationNotFoundError } = require('./path-resolver');
const { orchestrateGeneration } = require('./document-orchestrator');
const theme = require('./theme');

/**
 * Main Resume Generator Application
 * Coordinates CLI parsing, path resolution, and document generation
 */

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
    
    // Exit successfully
    process.exit(0);
    
  } catch (error) {
    console.error('Error generating documents:', error);
    process.exit(1);
  }
})();
