/**
 * DOCX Content Extraction Utility
 * Extracts text content from DOCX files for content-based validation
 * Used by document generation contract tests
 */

import fs from 'fs';
import crypto from 'crypto';
import JSZip from 'jszip';

/**
 * Extract text content from DOCX file
 * @param {string} filePath - Path to DOCX file
 * @returns {Promise<string>} - Extracted text content
 */
export async function extractDocxContent(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      throw new Error(`DOCX file not found: ${filePath}`);
    }

    const buffer = fs.readFileSync(filePath);
    const zip = await JSZip.loadAsync(buffer);
    
    // Extract main document content
    const documentFile = zip.files['word/document.xml'];
    if (!documentFile) {
      throw new Error('Invalid DOCX file: missing word/document.xml');
    }
    
    const documentXml = await documentFile.async('string');
    
    // Extract text content from XML
    const textContent = extractTextFromWordXml(documentXml);
    return textContent.trim();
    
  } catch (error) {
    throw new Error(`Failed to extract DOCX content: ${error.message}`);
  }
}

/**
 * Extract text from Word XML content
 * @param {string} xmlContent - Raw XML content from word/document.xml
 * @returns {string} - Extracted text content
 */
export function extractTextFromWordXml(xmlContent) {
  try {
    // Remove all XML tags and extract text content
    // This handles the most common text elements in Word documents
    const textContent = xmlContent
      // Extract text from <w:t> elements (text runs)
      .replace(/<w:t[^>]*>([^<]*)<\/w:t>/g, '$1')
      // Extract text from other common text elements
      .replace(/<w:tab[^>]*>/g, '\t')
      .replace(/<w:br[^>]*>/g, '\n')
      // Remove all remaining XML tags
      .replace(/<[^>]*>/g, '')
      // Decode XML entities
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      // Normalize whitespace
      .replace(/\s+/g, ' ')
      .trim();

    return textContent;
    
  } catch (error) {
    throw new Error(`Failed to extract text from XML: ${error.message}`);
  }
}

/**
 * Generate SHA256 hash of content for comparison
 * @param {string} content - Text content to hash
 * @returns {string} - SHA256 hash in hexadecimal
 */
export function generateContentHash(content) {
  return crypto.createHash('sha256').update(content, 'utf8').digest('hex');
}

/**
 * Validate DOCX content against expected hash
 * @param {string} filePath - Path to DOCX file
 * @param {string} expectedHash - Expected SHA256 hash
 * @returns {Promise<{valid: boolean, actualHash: string, content?: string}>}
 */
export async function validateDocxContentHash(filePath, expectedHash) {
  try {
    const extractedContent = await extractDocxContent(filePath);
    const actualHash = generateContentHash(extractedContent);
    
    return {
      valid: actualHash === expectedHash,
      actualHash,
      content: extractedContent
    };
    
  } catch (error) {
    return {
      valid: false,
      actualHash: null,
      error: error.message
    };
  }
}

/**
 * Extract content hashes from multiple DOCX files
 * @param {Array<string>} filePaths - Array of DOCX file paths
 * @returns {Promise<Object>} - Object mapping file names to content hashes
 */
export async function extractMultipleContentHashes(filePaths) {
  const hashes = {};
  
  for (const filePath of filePaths) {
    try {
      const content = await extractDocxContent(filePath);
      const hash = generateContentHash(content);
      const fileName = filePath.split('/').pop();
      
      hashes[fileName] = {
        contentHash: hash,
        lastUpdated: new Date().toISOString(),
        extractedSuccessfully: true
      };
      
    } catch (error) {
      const fileName = filePath.split('/').pop();
      hashes[fileName] = {
        contentHash: null,
        lastUpdated: new Date().toISOString(),
        extractedSuccessfully: false,
        error: error.message
      };
    }
  }
  
  return hashes;
}
