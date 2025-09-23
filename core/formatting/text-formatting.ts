/**
 * Text formatting utilities for DOCX document generation
 */

import { TextRun } from 'docx';
import { parseTextWithFormatting } from '../markdown-processing.js';

/**
 * Creates formatted TextRun elements from text with markdown-style formatting
 * @param {string} text - Text with potential markdown formatting
 * @param {Object} baseStyle - Base styling to apply to all runs
 * @returns {Array} Array of TextRun elements
 */
export function createFormattedTextRuns(text: string, baseStyle: Record<string, any> = {}) {
  const parsedParts = parseTextWithFormatting(text);
  
  return parsedParts.map(part => new TextRun({
    text: part.text,
    bold: part.bold,
    italics: part.italic,
    ...baseStyle,
  }));
}
