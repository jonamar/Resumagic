const fs = require('fs');
const { execSync } = require('child_process');
const { Packer } = require('docx');
const JSZip = require('jszip');
const { createResumeDocx, createCoverLetterDocx, createCombinedDocx } = require('./docx-template');
const { parseMarkdownCoverLetter } = require('./markdown-to-data');
const theme = require('./theme');

/**
 * Document Orchestrator Module
 * Handles document generation coordination, file operations, and optimization
 */

/**
 * Post-processes the DOCX buffer to remove compatibility mode and empty sections
 * This improves ATS compatibility by removing Word compatibility flags and empty sections
 * @param {Buffer} buffer - The DOCX buffer from Packer
 * @returns {Promise<Buffer>} - Optimized DOCX buffer
 */
async function removeCompatibilityMode(buffer) {
  try {
    // Load the docx file as a zip
    const zip = await JSZip.loadAsync(buffer);
    
    // Check if settings.xml exists and modify it to remove compatibility mode
    if (zip.files['word/settings.xml']) {
      let settingsXml = await zip.files['word/settings.xml'].async('string');
      
      // Remove the compatibility section
      settingsXml = settingsXml.replace(/<w:compat>[\s\S]*?<\/w:compat>/g, '');
      
      // Remove mc:Ignorable attribute and legacy namespace declarations
      settingsXml = settingsXml.replace(/\s+mc:Ignorable="[^"]*"/g, '');
      
      // Remove w14, w15, wp14 namespace declarations
      settingsXml = settingsXml.replace(/\s+xmlns:w14="[^"]*"/g, '');
      settingsXml = settingsXml.replace(/\s+xmlns:w15="[^"]*"/g, '');
      settingsXml = settingsXml.replace(/\s+xmlns:wp14="[^"]*"/g, '');
      
      // Create a much simpler settings.xml file
      const cleanSettings = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<w:settings xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">' +
        '<w:displayBackgroundShape/><w:evenAndOddHeaders w:val="false"/></w:settings>';
      
      // Update the settings file with the clean version
      zip.file('word/settings.xml', cleanSettings);
      console.log('Enhanced compatibility mode removal: settings.xml optimized');
    }
    
    // Remove empty footnotes.xml, comments.xml, and endnotes.xml if they exist
    // These can cause issues with some ATS systems
    ['word/footnotes.xml', 'word/comments.xml', 'word/endnotes.xml'].forEach(file => {
      if (zip.files[file]) {
        zip.remove(file);
        console.log(`Removed unnecessary file: ${file}`);
      }
    });
    
    // Generate the new docx file
    const optimizedBuffer = await zip.generateAsync({ type: 'nodebuffer' });
    return optimizedBuffer;
  } catch (error) {
    console.warn('Warning: Could not optimize DOCX file. Using original version.', error);
    return buffer; // Fall back to the original buffer if post-processing fails
  }
}

/**
 * Generates a resume document
 * @param {Object} resumeData - Resume data object
 * @param {string} outputPath - Path where to save the document
 * @returns {Promise<string>} - Path to the generated file
 */
async function generateResumeDocument(resumeData, outputPath) {
  console.log(`\n${theme.messages.emojis.processing} ${theme.messages.processing.processingResume.replace('{path}', outputPath)}`);
  console.log(`${theme.messages.emojis.document} ${theme.messages.processing.willGenerateResume.replace('{path}', outputPath)}\n`);
  
  // Generate DOCX document using our template
  console.log(theme.messages.processing.generatingResume);
  const resumeDoc = createResumeDocx(resumeData);
  
  // Use Packer to get the buffer
  console.log(theme.messages.processing.savingResume);
  const resumeBuffer = await Packer.toBuffer(resumeDoc);
  
  // Post-process the DOCX file to remove compatibility mode and empty sections
  console.log(theme.messages.processing.optimizing);
  const optimizedResumeBuffer = await removeCompatibilityMode(resumeBuffer);
  
  // Save the optimized DOCX
  fs.writeFileSync(outputPath, optimizedResumeBuffer);
  
  console.log(`${theme.messages.emojis.success} ${theme.messages.success.resumeGenerated.replace('{path}', outputPath)}`);
  return outputPath;
}

/**
 * Generates a cover letter document
 * @param {string} markdownFilePath - Path to markdown cover letter file
 * @param {string} resumeDataPath - Path to resume data file (for context)
 * @param {string} outputPath - Path where to save the document
 * @returns {Promise<string>} - Path to the generated file
 */
async function generateCoverLetterDocument(markdownFilePath, resumeDataPath, outputPath) {
  console.log(`\n${theme.messages.emojis.processing} ${theme.messages.processing.processingCoverLetter.replace('{path}', markdownFilePath)}`);
  console.log(`${theme.messages.emojis.document} ${theme.messages.processing.willGenerateCoverLetter.replace('{path}', outputPath)}\n`);
  
  // Parse markdown cover letter
  console.log(theme.messages.processing.parsingMarkdown);
  const coverLetterData = parseMarkdownCoverLetter(markdownFilePath, resumeDataPath);
  
  // Generate DOCX document using our template
  console.log(theme.messages.processing.generatingCoverLetter);
  const coverLetterDoc = createCoverLetterDocx(coverLetterData);
  
  // Use Packer to get the buffer
  console.log(theme.messages.processing.savingCoverLetter);
  const coverLetterBuffer = await Packer.toBuffer(coverLetterDoc);
  
  // Post-process the DOCX file to remove compatibility mode and empty sections
  console.log(theme.messages.processing.optimizingCoverLetter);
  const optimizedCoverLetterBuffer = await removeCompatibilityMode(coverLetterBuffer);
  
  // Save the optimized DOCX
  fs.writeFileSync(outputPath, optimizedCoverLetterBuffer);
  
  console.log(`${theme.messages.emojis.success} ${theme.messages.success.coverLetterGenerated.replace('{path}', outputPath)}`);
  return outputPath;
}

/**
 * Generates a combined cover letter + resume document
 * @param {string} markdownFilePath - Path to markdown cover letter file
 * @param {string} resumeDataPath - Path to resume data file
 * @param {Object} resumeData - Resume data object
 * @param {string} outputPath - Path where to save the document
 * @returns {Promise<string>} - Path to the generated file
 */
async function generateCombinedDocument(markdownFilePath, resumeDataPath, resumeData, outputPath) {
  console.log(`\n${theme.messages.emojis.processing} ${theme.messages.processing.processingCombined.replace('{resumePath}', resumeDataPath).replace('{coverPath}', markdownFilePath)}`);
  console.log(`${theme.messages.emojis.document} ${theme.messages.processing.willGenerateCombined.replace('{path}', outputPath)}\n`);
  
  // Parse markdown cover letter
  console.log(theme.messages.processing.parsingMarkdown);
  const coverLetterData = parseMarkdownCoverLetter(markdownFilePath, resumeDataPath);
  
  // Generate combined DOCX document
  console.log('Generating cover letter + resume DOCX document...');
  const combinedDoc = createCombinedDocx(coverLetterData, resumeData);
  
  // Use Packer to get the buffer
  console.log('Saving cover letter + resume DOCX file...');
  const combinedBuffer = await Packer.toBuffer(combinedDoc);
  
  // Post-process the DOCX file to remove compatibility mode and empty sections
  console.log('Optimizing cover letter + resume DOCX for ATS compatibility...');
  const optimizedCombinedBuffer = await removeCompatibilityMode(combinedBuffer);
  
  // Save the optimized DOCX
  fs.writeFileSync(outputPath, optimizedCombinedBuffer);
  
  console.log(`${theme.messages.emojis.success} ${theme.messages.success.combinedGenerated.replace('{path}', outputPath)}`);
  return outputPath;
}

/**
 * Opens generated files with the system default application (macOS only)
 * @param {Array<string>} filePaths - Array of file paths to open
 * @param {boolean} autoPreview - Whether to auto-open files
 */
function openGeneratedFiles(filePaths, autoPreview) {
  if (autoPreview && process.platform === 'darwin' && filePaths.length > 0) {
    try {
      console.log('Opening generated files with system default app...');
      for (const file of filePaths) {
        execSync(`open "${file}"`);
      }
      console.log(`${theme.messages.emojis.success} ${theme.messages.success.filesOpened}`);
    } catch (error) {
      console.warn(`${theme.messages.emojis.warning} Could not open files: ${error.message}`);
    }
  }
}

/**
 * Displays generation completion summary
 * @param {Array<string>} generatedFiles - Array of generated file paths
 */
function displayCompletionSummary(generatedFiles) {
  console.log(`\n✨ Generation complete! Created ${generatedFiles.length} file(s):\n`);
  generatedFiles.forEach(file => console.log(`   ${theme.messages.emojis.processing} ${file}`));
  console.log('');
}

/**
 * Main orchestration function that coordinates document generation
 * @param {Object} generationPlan - Plan object with flags for what to generate
 * @param {Object} paths - Paths object with all file paths
 * @param {Object} resumeData - Resume data object
 * @param {boolean} autoPreview - Whether to auto-open generated files
 * @returns {Promise<Array<string>>} - Array of generated file paths
 */
async function orchestrateGeneration(generationPlan, paths, resumeData, autoPreview) {
  const { generateResume, generateCoverLetter, generateCombinedDoc } = generationPlan;
  const { resumeDataPath, markdownFilePath, resumeDocxPath, coverLetterDocxPath, combinedDocxPath } = paths;
  
  const generatedFiles = [];
  
  try {
    // Generate resume if requested
    if (generateResume) {
      const resumePath = await generateResumeDocument(resumeData, resumeDocxPath);
      generatedFiles.push(resumePath);
    }
    
    // Generate cover letter if requested
    if (generateCoverLetter) {
      const coverLetterPath = await generateCoverLetterDocument(markdownFilePath, resumeDataPath, coverLetterDocxPath);
      generatedFiles.push(coverLetterPath);
    }
    
    // Generate combined document if requested
    if (generateCombinedDoc) {
      const combinedPath = await generateCombinedDocument(markdownFilePath, resumeDataPath, resumeData, combinedDocxPath);
      generatedFiles.push(combinedPath);
    }
    
    // Display completion summary
    displayCompletionSummary(generatedFiles);
    
    // Auto-open files if requested
    openGeneratedFiles(generatedFiles, autoPreview);
    
    return generatedFiles;
  } catch (error) {
    console.error('Error generating documents:', error);
    throw error;
  }
}

module.exports = {
  removeCompatibilityMode,
  generateResumeDocument,
  generateCoverLetterDocument,
  generateCombinedDocument,
  openGeneratedFiles,
  displayCompletionSummary,
  orchestrateGeneration
}; 