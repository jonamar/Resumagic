/**
 * Text formatting utilities for DOCX document generation
 */

import { TextRun, IRunOptions } from 'docx';
import { parseTextWithFormatting } from '../markdown-processing.js';

/**
 * Creates formatted TextRun elements from text with markdown-style formatting
 * @param text - Text with potential markdown formatting
 * @param baseStyle - Base styling to apply to all runs
 * @returns Array of TextRun elements
 */
export function createFormattedTextRuns(text: string, baseStyle: Partial<IRunOptions> = {}): TextRun[] {
  const parsedParts = parseTextWithFormatting(text);

  return parsedParts.map(part => new TextRun({
    text: part.text,
    bold: part.bold,
    italics: part.italic,
    ...baseStyle,
  }));
}