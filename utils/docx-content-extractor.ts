/**
 * DOCX Content Extraction Utility
 * Extracts text content from DOCX files for content-based validation
 * Used by document generation contract tests
 */

import fs from 'fs';
import crypto from 'crypto';
import JSZip from 'jszip';

interface ValidationResult {
  valid: boolean;
  actualHash: string;
  content?: string;
}

interface ContentHashes {
  [fileName: string]: string;
}

/**
 * Extract text content from DOCX file
 * @param {string} filePath - Path to DOCX file
 * @returns {Promise<string>} - Extracted text content
 */
export async function extractDocxContent(filePath: string): Promise<string> {
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
    
  } catch (error: any) {
    throw new Error(`Failed to extract DOCX content: ${error.message}`);
  }
}

/**
 * Extract text from Word XML content
 * @param {string} xmlContent - Raw XML content from word/document.xml
 * @returns {string} - Extracted text content
 */
export function extractTextFromWordXml(xmlContent: string): string {
  try {
    // Remove all XML tags and extract text content
    // This handles the most common text elements in Word documents
    let textContent = xmlContent;
    
    // Remove XML tags but preserve text content
    textContent = textContent.replace(/<[^>]+>/g, ' ');
    
    // Handle common Word XML entities
    const entities: { [key: string]: string } = {
      '&amp;': '&',
      '&lt;': '<',
      '&gt;': '>',
      '&quot;': '"',
      '&apos;': "'",
    };
    
    Object.keys(entities).forEach(entity => {
      const replacement = entities[entity];
      if (replacement !== undefined) {
        textContent = textContent.replace(new RegExp(entity, 'g'), replacement);
      }
    });
    
    // Clean up whitespace
    textContent = textContent.replace(/\s+/g, ' ');
    
    return textContent;
  } catch (error: any) {
    throw new Error(`Failed to extract text from Word XML: ${error.message}`);
  }
}

/**
 * Generate SHA256 hash of content for comparison
 * @param {string} content - Text content to hash
 * @returns {string} - SHA256 hash in hexadecimal
 */
export function generateContentHash(content: string): string {
  return crypto.createHash('sha256').update(content).digest('hex');
}

/**
 * Validate DOCX content against expected hash
 * @param {string} filePath - Path to DOCX file
 * @param {string} expectedHash - Expected SHA256 hash
 * @returns {Promise<ValidationResult>} - Validation result
 */
export async function validateDocxContentHash(filePath: string, expectedHash: string): Promise<ValidationResult> {
  try {
    const content = await extractDocxContent(filePath);
    const actualHash = generateContentHash(content);
    
    return {
      valid: actualHash === expectedHash,
      actualHash,
      content,
    };
  } catch (error: any) {
    return {
      valid: false,
      actualHash: '',
      content: `Error: ${error.message}`,
    };
  }
}

/**
 * Extract content hashes from multiple DOCX files
 * @param {Array<string>} filePaths - Array of DOCX file paths
 * @returns {Promise<ContentHashes>} - Object mapping file names to content hashes
 */
export async function extractMultipleContentHashes(filePaths: string[]): Promise<ContentHashes> {
  const hashes: ContentHashes = {};
  
  for (const filePath of filePaths) {
    try {
      const content = await extractDocxContent(filePath);
      const hash = generateContentHash(content);
      const fileName = filePath.split('/').pop() || filePath;
      hashes[fileName] = hash;
    } catch (error: any) {
      const fileName = filePath.split('/').pop() || filePath;
      hashes[fileName] = `Error: ${error.message}`;
    }
  }
  
  return hashes;
}
