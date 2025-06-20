const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
const { Packer } = require('docx');
const { createResumeDocx } = require('./docx-template');
const JSZip = require('jszip');

// Parse command line arguments
const args = process.argv.slice(2);
const inputFile = args.find(arg => !arg.startsWith('--')) || 'resume.json';
const autoPreview = args.includes('--preview') || true; // Default to true for auto-preview

console.log(`Command line argument received: ${inputFile}`);

// Get the base name for generating output files
const inputBaseName = path.basename(inputFile, '.json');
console.log(`Base filename for outputs: ${inputBaseName}`);

// Get the resume data
const resumeDataPath = path.resolve(__dirname, '../data/input', inputFile);
console.log(`Full path to resume data: ${resumeDataPath}`);

// Verify the file exists
if (!fs.existsSync(resumeDataPath)) {
  console.error(`Error: Resume file not found at ${resumeDataPath}`);
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

// Set up output file path
const outputDocxPath = path.join(__dirname, '../data/output', `${inputBaseName}.docx`);

// Note: Date formatting is handled directly in the docx-template.js file

// Main function
(async () => {
  try {
    // Log which resume file we're processing
    console.log(`\n📄 Processing resume: ${resumeDataPath}`);
    console.log(`📑 Will generate DOCX output: ${outputDocxPath}\n`);
    
    // Generate DOCX document using our template
    console.log('Generating DOCX document...');
    const doc = createResumeDocx(resumeData);
    
    // Use Packer to get the buffer
    console.log('Saving DOCX file...');
    const buffer = await Packer.toBuffer(doc);
    
    // Post-process the DOCX file to remove compatibility mode and empty sections
    console.log('Optimizing DOCX for ATS compatibility...');
    const optimizedBuffer = await removeCompatibilityMode(buffer);
    
    // Save the optimized DOCX
    fs.writeFileSync(outputDocxPath, optimizedBuffer);
    
    console.log(`✅ DOCX resume generated and saved to: ${outputDocxPath}`);
    console.log('\n✨ Resume generation complete! DOCX file has been created.\n');
    
    // Auto-open in Pages if on macOS
    if (autoPreview && process.platform === 'darwin') {
      try {
        console.log('Opening DOCX file in Pages...');
        execSync(`open -a "Pages" "${outputDocxPath}"`);
        console.log('✅ DOCX opened in Pages for preview');
      } catch (error) {
        console.warn(`⚠️ Could not open DOCX in Pages: ${error.message}`);
      }
    }
  } catch (error) {
    console.error('Error generating resume:', error);
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
