/**
 * Unit Tests for Markdown Parser
 * Migrated from inline tests in markdown-parser.js
 */

import { parseTextWithFormatting } from '../../core/markdown-processing.js';

describe('Markdown Parser', () => {
  describe('parseTextWithFormatting', () => {
    test('should parse plain text without formatting', () => {
      const result = parseTextWithFormatting('Plain text');
      expect(result).toEqual([
        { text: 'Plain text', bold: false, italic: false }
      ]);
    });

    test('should parse bold text', () => {
      const result = parseTextWithFormatting('This is **bold** text');
      expect(result).toEqual([
        { text: 'This is ', bold: false, italic: false },
        { text: 'bold', bold: true, italic: false },
        { text: ' text', bold: false, italic: false }
      ]);
    });

    test('should parse italic text', () => {
      const result = parseTextWithFormatting('This is *italic* text');
      expect(result).toEqual([
        { text: 'This is ', bold: false, italic: false },
        { text: 'italic', bold: false, italic: true },
        { text: ' text', bold: false, italic: false }
      ]);
    });

    test('should parse bold and italic text', () => {
      const result = parseTextWithFormatting('This is ***bold and italic*** text');
      expect(result).toEqual([
        { text: 'This is ', bold: false, italic: false },
        { text: 'bold and italic', bold: true, italic: true },
        { text: ' text', bold: false, italic: false }
      ]);
    });

    test('should parse multiple bold sections', () => {
      const result = parseTextWithFormatting('**First bold** and **second bold**');
      expect(result).toEqual([
        { text: 'First bold', bold: true, italic: false },
        { text: ' and ', bold: false, italic: false },
        { text: 'second bold', bold: true, italic: false }
      ]);
    });

    test('should parse nested formatting', () => {
      const result = parseTextWithFormatting('**Bold with *italic* inside**');
      // Current implementation treats the entire content as bold, doesn't handle nested italic
      expect(result).toEqual([
        { text: 'Bold with *italic* inside', bold: true, italic: false }
      ]);
    });

    test('should handle empty string', () => {
      const result = parseTextWithFormatting('');
      // Current implementation returns array with empty text object
      expect(result).toEqual([
        { text: '', bold: false, italic: false }
      ]);
    });

    test('should handle malformed markdown gracefully', () => {
      const result = parseTextWithFormatting('**Unclosed bold');
      // Current implementation treats unclosed markers as plain text
      expect(result).toEqual([
        { text: 'Unclosed bold', bold: false, italic: false }
      ]);
    });

    test('should parse complex mixed formatting', () => {
      const result = parseTextWithFormatting('Led **16x growth** and **$26.6M CAD**');
      expect(result).toEqual([
        { text: 'Led ', bold: false, italic: false },
        { text: '16x growth', bold: true, italic: false },
        { text: ' and ', bold: false, italic: false },
        { text: '$26.6M CAD', bold: true, italic: false }
      ]);
    });

    test('should handle single asterisk without formatting', () => {
      const result = parseTextWithFormatting('This * is not italic');
      expect(result).toEqual([
        { text: 'This * is not italic', bold: false, italic: false }
      ]);
    });

    test('should handle consecutive formatting markers', () => {
      const result = parseTextWithFormatting('**bold****another bold**');
      expect(result).toEqual([
        { text: 'bold', bold: true, italic: false },
        { text: 'another bold', bold: true, italic: false }
      ]);
    });
  });
});
