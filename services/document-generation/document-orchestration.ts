import fs from 'fs';
import { execSync } from 'child_process';
import { Packer } from 'docx';
import JSZip from 'jszip';
import { createResumeDocx, createCoverLetterDocx, createCombinedDocx } from './document-templates.js';
type ResumeData = Parameters<typeof createResumeDocx>[0];
import { parseMarkdownCoverLetter } from './markdown-processing.js';
import theme from '../../theme.js';

/**
 * Document Orchestration Module
 * Handles document generation coordination, file operations, and optimization
 */

/**
 * Post-processes the DOCX buffer to remove compatibility mode and empty sections
 * This improves ATS compatibility by removing Word compatibility flags and empty sections
 * @param {Buffer} buffer - The DOCX buffer from Packer
 * @returns {Promise<Buffer>} - Optimized DOCX buffer
 */
async function removeCompatibilityMode(buffer: Buffer): Promise<Buffer> {
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
      // note: keep variable to satisfy strict no-unused
      let _settingsXml = settingsXml.replace(/\s+xmlns:w14="[^"]*"/g, '');
      _settingsXml = _settingsXml.replace(/\s+xmlns:w15="[^"]*"/g, '');
      _settingsXml = _settingsXml.replace(/\s+xmlns:wp14="[^"]*"/g, '');
      
      // Create a much simpler settings.xml file
      const cleanSettings = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<w:settings xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">' +
        '<w:displayBackgroundShape/><w:evenAndOddHeaders w:val="false"/></w:settings>';
      
      // Update the settings file with the clean version
      zip.file('word/settings.xml', cleanSettings);
    }
    
    // Remove empty footnotes.xml, comments.xml, and endnotes.xml if they exist
    // These can cause issues with some ATS systems
    ['word/footnotes.xml', 'word/comments.xml', 'word/endnotes.xml'].forEach(file => {
      if (zip.files[file]) {
        zip.remove(file);
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
async function generateResumeDocument(resumeData: unknown, outputPath: string): Promise<string> {
  console.log(`\n${theme.messages.emojis.processing} ${theme.messages.processing.processingResume.replace('{path}', outputPath)}`);
  console.log(`${theme.messages.emojis.document} ${theme.messages.processing.willGenerateResume.replace('{path}', outputPath)}\n`);
  
  // Generate DOCX document using our template
  console.log(theme.messages.processing.generatingResume);
  const resumeDoc = createResumeDocx(resumeData as ResumeData);
  
  // Use Packer to get the buffer
  console.log(theme.messages.processing.savingResume);
  const resumeBuffer = await Packer.toBuffer(resumeDoc);
  
  // Post-process the DOCX file to remove compatibility mode and empty sections
  console.log(theme.messages.processing.optimizing);
  const optimizedResumeBuffer = await removeCompatibilityMode(resumeBuffer);
  
  // Save the optimized DOCX
  console.log(`💾 Writing resume file: ${outputPath}`);
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
async function generateCoverLetterDocument(markdownFilePath: string, resumeDataPath: string, outputPath: string): Promise<string> {
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
  console.log(`💾 Writing cover letter file: ${outputPath}`);
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
async function generateCombinedDocument(markdownFilePath: string, resumeDataPath: string, resumeData: unknown, outputPath: string): Promise<string> {
  console.log(`\n${theme.messages.emojis.processing} ${theme.messages.processing.processingCombined.replace('{resumePath}', resumeDataPath).replace('{coverPath}', markdownFilePath)}`);
  console.log(`${theme.messages.emojis.document} ${theme.messages.processing.willGenerateCombined.replace('{path}', outputPath)}\n`);
  
  // Parse markdown cover letter
  console.log(theme.messages.processing.parsingMarkdown);
  const coverLetterData = parseMarkdownCoverLetter(markdownFilePath, resumeDataPath);
  
  // Generate combined DOCX document
  console.log('Generating cover letter + resume DOCX document...');
  const combinedDoc = createCombinedDocx(coverLetterData, resumeData as ResumeData);
  
  // Use Packer to get the buffer
  console.log('Saving cover letter + resume DOCX file...');
  const combinedBuffer = await Packer.toBuffer(combinedDoc);
  
  // Post-process the DOCX file to remove compatibility mode and empty sections
  console.log('Optimizing cover letter + resume DOCX for ATS compatibility...');
  const optimizedCombinedBuffer = await removeCompatibilityMode(combinedBuffer);
  
  // Save the optimized DOCX
  console.log(`💾 Writing combined file: ${outputPath}`);
  fs.writeFileSync(outputPath, optimizedCombinedBuffer);
  
  console.log(`${theme.messages.emojis.success} ${theme.messages.success.combinedGenerated.replace('{path}', outputPath)}`);
  return outputPath;
}

/**
 * Opens generated files with the system default application (macOS only)
 * @param {Array<string>} filePaths - Array of file paths to open
 * @param {boolean} autoPreview - Whether to auto-open files
 */
function openGeneratedFiles(filePaths: string[], autoPreview: boolean): void {
  if (autoPreview && process.platform === 'darwin' && filePaths.length > 0) {
    try {
      console.log('Opening generated files with system default app...');
      for (const file of filePaths) {
        execSync(`open "${file}"`);
      }
      console.log(`${theme.messages.emojis.success} ${theme.messages.success.filesOpened}`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`${theme.messages.emojis.warning} Could not open files: ${message}`);
    }
  }
}

/**
 * Displays generation completion summary
 * @param {Array<string>} generatedFiles - Array of generated file paths
 */
function displayCompletionSummary(generatedFiles: string[]): void {
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
async function orchestrateGeneration(
  generationPlan: { generateResume: boolean; generateCoverLetter: boolean; generateCombinedDoc: boolean },
  paths: { resumeDataPath: string; markdownFilePath: string; resumeDocxPath: string; coverLetterDocxPath: string; combinedDocxPath: string },
  resumeData: unknown,
  autoPreview: boolean,
): Promise<string[]> {
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
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Error generating documents:', message);
    throw error;
  }
}

export {
  removeCompatibilityMode,
  generateResumeDocument,
  generateCoverLetterDocument,
  generateCombinedDocument,
  openGeneratedFiles,
  displayCompletionSummary,
  orchestrateGeneration,
};
