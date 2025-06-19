const path = require('path');
const fs = require('fs');
const { Packer } = require('docx');
const { createResumeDocx } = require('./docx-template');
const JSZip = require('jszip');

// Parse command line arguments
const inputFile = process.argv[2] || 'resume.json';
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
      const settingsXml = await zip.files['word/settings.xml'].async('string');
      
      // Remove the compatibility section
      const updatedSettingsXml = settingsXml.replace(/<w:compat>[\s\S]*?<\/w:compat>/g, '');
      
      // Update the settings file
      zip.file('word/settings.xml', updatedSettingsXml);
    }
    
    // Remove empty footnotes.xml and comments.xml if they exist
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
