const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
const { Packer } = require('docx');
const { createResumeDocx, createCoverLetterDocx, createCombinedDocx } = require('./docx-template');
const { parseMarkdownCoverLetter } = require('./markdown-to-data');
const JSZip = require('jszip');

// Parse command line arguments
const args = process.argv.slice(2);
const applicationName = args.find(arg => !arg.startsWith('--'));
const autoPreview = args.includes('--preview') || true; // Default to true for auto-preview

// Cover letter generation flags
const coverLetterOnly = args.includes('--cover-letter');
const generateBoth = args.includes('--both');
const autoDetect = args.includes('--auto');
const generateCombined = args.includes('--cover-letter-and-resume');

if (!applicationName) {
  console.error('❌ Error: Please specify an application folder name.');
  console.error('Usage: node generate-resume.js <application-folder-name> [flags]');
  console.error('Example: node generate-resume.js relay-director-of-product');
  process.exit(1);
}

console.log(`Command line argument received: ${applicationName}`);

// Set up application folder paths
const applicationFolderPath = path.resolve(__dirname, '../data/applications', applicationName);
const resumeDataPath = path.join(applicationFolderPath, 'inputs', 'resume.json');
const markdownFilePath = path.join(applicationFolderPath, 'inputs', 'cover-letter.md');
const outputBasePath = path.join(applicationFolderPath, 'outputs');

// Verify the application folder exists
if (!fs.existsSync(applicationFolderPath) || !fs.statSync(applicationFolderPath).isDirectory()) {
  console.error(`❌ Error: Application folder not found at ${applicationFolderPath}`);
  console.error('Available applications:');
  
  const applicationsDir = path.resolve(__dirname, '../data/applications');
  if (fs.existsSync(applicationsDir)) {
    const folders = fs.readdirSync(applicationsDir)
      .filter(item => fs.statSync(path.join(applicationsDir, item)).isDirectory() && item !== 'template')
      .map(folder => `  - ${folder}`)
      .join('\n');
    console.error(folders || '  (No applications found)');
  }
  
  console.error('\nTo create a new application:');
  console.error(`cp -r data/applications/template data/applications/${applicationName}`);
  process.exit(1);
}

// Extract company name for file naming
const companyName = extractCompanyFromFolderName(applicationName);

console.log(`📁 Using application folder: ${applicationFolderPath}`);
console.log(`🏢 Company name: ${companyName}`);

// Ensure outputs directory exists
if (!fs.existsSync(outputBasePath)) {
  fs.mkdirSync(outputBasePath, { recursive: true });
}

// Verify the resume file exists
if (!fs.existsSync(resumeDataPath)) {
  console.error(`❌ Error: Resume file not found at ${resumeDataPath}`);
  console.error('Make sure you have a resume.json file in the inputs folder.');
  process.exit(1);
}

let resumeData;
try {
  resumeData = require(resumeDataPath);
  console.log('Resume data loaded successfully');
} catch (error) {
  console.error(`Error loading resume data: ${error.message}`);
  process.exit(1);
}

// Set up output file paths with HR-friendly naming
const resumeDocxPath = path.join(outputBasePath, `Jon-Amar-Resume-${companyName}.docx`);
const coverLetterDocxPath = path.join(outputBasePath, `Jon-Amar-Cover-Letter-${companyName}.docx`);
const combinedDocxPath = path.join(outputBasePath, `Jon-Amar-Cover-Letter-and-Resume-${companyName}.docx`);

// Check for corresponding markdown file
const hasMarkdownFile = fs.existsSync(markdownFilePath);

/**
 * Extracts company name from folder name (e.g., "relay-director-of-product" -> "Relay")
 * @param {string} folderName - The application folder name
 * @returns {string} - Formatted company name
 */
function extractCompanyFromFolderName(folderName) {
  // Take the first part before the first hyphen and capitalize it
  const companyPart = folderName.split('-')[0];
  return companyPart.charAt(0).toUpperCase() + companyPart.slice(1);
}

// Determine what to generate based on flags and file availability
let generateResume = false;
let generateCoverLetter = false;
let generateCombinedDoc = false;

if (coverLetterOnly) {
  generateCoverLetter = true;
} else if (generateBoth) {
  generateResume = true;
  generateCoverLetter = true;
} else if (generateCombined) {
  generateCombinedDoc = true;
} else if (autoDetect) {
  generateResume = true;
  generateCoverLetter = hasMarkdownFile;
} else {
  // Default behavior - generate all three formats if both content types are available
  if (hasMarkdownFile) {
    generateResume = true;
    generateCoverLetter = true;
    generateCombinedDoc = true;
    console.log('📋 Default behavior: Both resume and cover letter content available - generating all three formats');
  } else {
    // Only resume content available - generate resume only
    generateResume = true;
    console.log('📋 Default behavior: Only resume content available - generating resume only');
  }
}

// Validate requirements
if ((generateCoverLetter || generateCombinedDoc) && !hasMarkdownFile) {
  console.error(`❌ Error: Cover letter generation requested but no markdown file found.`);
  console.error(`   Expected: ${markdownFilePath}`);
  process.exit(1);
}

// Main function
(async () => {
  try {
    const generatedFiles = [];
    
    // Generate resume if requested
    if (generateResume) {
      console.log(`\n📄 Processing resume: ${resumeDataPath}`);
      console.log(`📑 Will generate resume DOCX: ${resumeDocxPath}\n`);
      
      // Generate DOCX document using our template
      console.log('Generating resume DOCX document...');
      const resumeDoc = createResumeDocx(resumeData);
      
      // Use Packer to get the buffer
      console.log('Saving resume DOCX file...');
      const resumeBuffer = await Packer.toBuffer(resumeDoc);
      
      // Post-process the DOCX file to remove compatibility mode and empty sections
      console.log('Optimizing resume DOCX for ATS compatibility...');
      const optimizedResumeBuffer = await removeCompatibilityMode(resumeBuffer);
      
      // Save the optimized DOCX
      fs.writeFileSync(resumeDocxPath, optimizedResumeBuffer);
      
      console.log(`✅ Resume DOCX generated and saved to: ${resumeDocxPath}`);
      generatedFiles.push(resumeDocxPath);
    }
    
    // Generate cover letter if requested
    if (generateCoverLetter) {
      console.log(`\n📄 Processing cover letter: ${markdownFilePath}`);
      console.log(`📑 Will generate cover letter DOCX: ${coverLetterDocxPath}\n`);
      
      // Parse markdown cover letter
      console.log('Parsing markdown cover letter...');
      const coverLetterData = parseMarkdownCoverLetter(markdownFilePath, resumeDataPath);
      
      // Generate DOCX document using our template
      console.log('Generating cover letter DOCX document...');
      const coverLetterDoc = createCoverLetterDocx(coverLetterData);
      
      // Use Packer to get the buffer
      console.log('Saving cover letter DOCX file...');
      const coverLetterBuffer = await Packer.toBuffer(coverLetterDoc);
      
      // Post-process the DOCX file to remove compatibility mode and empty sections
      console.log('Optimizing cover letter DOCX for ATS compatibility...');
      const optimizedCoverLetterBuffer = await removeCompatibilityMode(coverLetterBuffer);
      
      // Save the optimized DOCX
      fs.writeFileSync(coverLetterDocxPath, optimizedCoverLetterBuffer);
      
      console.log(`✅ Cover letter DOCX generated and saved to: ${coverLetterDocxPath}`);
      generatedFiles.push(coverLetterDocxPath);
    }
    
    // Generate combined document if requested
    if (generateCombinedDoc) {
      console.log(`\n📄 Processing cover letter + resume document: ${resumeDataPath} + ${markdownFilePath}`);
      console.log(`📑 Will generate cover letter + resume DOCX: ${combinedDocxPath}\n`);
      
      // Parse markdown cover letter
      console.log('Parsing markdown cover letter...');
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
      fs.writeFileSync(combinedDocxPath, optimizedCombinedBuffer);
      
      console.log(`✅ Cover letter + resume DOCX generated and saved to: ${combinedDocxPath}`);
      generatedFiles.push(combinedDocxPath);
    }
    
    console.log(`\n✨ Generation complete! Created ${generatedFiles.length} file(s):\n`);
    generatedFiles.forEach(file => console.log(`   📄 ${file}`));
    console.log('');
    
    // Auto-open with system default app if on macOS
    if (autoPreview && process.platform === 'darwin' && generatedFiles.length > 0) {
      try {
        console.log('Opening generated files with system default app...');
        for (const file of generatedFiles) {
          execSync(`open "${file}"`);
        }
        console.log('✅ Files opened with system default app for preview');
      } catch (error) {
        console.warn(`⚠️ Could not open files: ${error.message}`);
      }
    }
  } catch (error) {
    console.error('Error generating documents:', error);
    process.exit(1);
  }
})();

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
