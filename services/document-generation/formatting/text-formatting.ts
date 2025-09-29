/**
 * Text formatting utilities for DOCX document generation
 */

import { ExternalHyperlink, TextRun, UnderlineType } from 'docx';
import { parseTextWithFormatting } from '../markdown-processing.js';

/**
 * Creates formatted TextRun elements from text with markdown-style formatting
 * @param {string} text - Text with potential markdown formatting
 * @param {Object} baseStyle - Base styling to apply to all runs
 * @returns {Array} Array of TextRun elements
 */
export function createFormattedTextRuns(text: string, baseStyle: Record<string, any> = {}) {
  const parsedParts = parseTextWithFormatting(text);
  
  return parsedParts.map((part: any) => new TextRun({
    text: part.text,
    bold: part.bold,
    italics: part.italic,
    ...baseStyle,
  }));
}

/**
 * Create inline runs that support simple markdown-style links [text](url).
 * - Non-link segments are converted using createFormattedTextRuns to retain bold/italic.
 * - Link segments are wrapped in ExternalHyperlink with a single TextRun using the provided base style.
 * - Optional forceBold/forceItalics allow callers who already parsed emphasis to preserve it.
 */
export function createInlineRunsWithLinks(
  text: string,
  baseStyle: Record<string, any> = {},
  forceBold?: boolean,
  forceItalics?: boolean,
): Array<TextRun | ExternalHyperlink> {
  if (!text) {
    return [];
  }

  const parts: Array<TextRun | ExternalHyperlink> = [];
  const linkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = linkRegex.exec(text)) !== null) {
    const matchStart = match.index;
    const matchEnd = match.index + match[0].length;

    // Add plain segment before link, preserving bold/italic via parser
    if (matchStart > lastIndex) {
      const before = text.substring(lastIndex, matchStart);
      if (before) {
        const formattedParts = parseTextWithFormatting(before);
        formattedParts.forEach((p: any) => {
          parts.push(new TextRun({
            text: p.text,
            bold: typeof forceBold === 'boolean' ? forceBold : p.bold,
            italics: typeof forceItalics === 'boolean' ? forceItalics : p.italic,
            ...baseStyle,
          }));
        });
      }
    }

    const linkText = match[1] || '';
    const url = match[2] || '';

    // Add the hyperlink
    parts.push(new ExternalHyperlink({
      link: url,
      children: [
        new TextRun({
          text: linkText,
          underline: { type: UnderlineType.SINGLE },
          bold: !!forceBold,
          italics: !!forceItalics,
          ...baseStyle,
        }),
      ],
    }));

    lastIndex = matchEnd;
  }

  // Add remaining tail after last link
  if (lastIndex < text.length) {
    const tail = text.substring(lastIndex);
    if (tail) {
      const formattedParts = parseTextWithFormatting(tail);
      formattedParts.forEach((p: any) => {
        parts.push(new TextRun({
          text: p.text,
          bold: typeof forceBold === 'boolean' ? forceBold : p.bold,
          italics: typeof forceItalics === 'boolean' ? forceItalics : p.italic,
          ...baseStyle,
        }));
      });
    }
  }

  return parts;
}
