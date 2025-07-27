/**
 * Markdown Text Parser for DOCX Resume Generation
 * Parses markdown-style inline formatting and converts to DOCX TextRun elements
 * Supports: **bold**, *italic*, ***bold italic***
 */

import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

/**
 * Parses text with markdown-style formatting into structured parts
 * @param {string} text - Text with potential markdown formatting
 * @returns {Array} Array of {text, bold, italic} objects
 */
function parseTextWithFormatting(text) {
  if (!text || typeof text !== 'string') {
    return [{ text: text || '', bold: false, italic: false }];
  }

  const parts = [];
  let remainingText = text;
  const position = 0;

  // Process text iteratively to handle overlapping patterns correctly
  while (remainingText.length > 0) {
    let foundMatch = false;
    let earliestMatch = null;
    let earliestIndex = remainingText.length;

    // Check all patterns and find the earliest match
    const patterns = [
      { regex: /\*\*\*(.*?)\*\*\*/g, bold: true, italic: true, name: 'bold-italic' },
      { regex: /\*\*(.*?)\*\*/g, bold: true, italic: false, name: 'bold' },
      { regex: /\*(.*?)\*/g, bold: false, italic: true, name: 'italic' }
    ];

    patterns.forEach(pattern => {
      pattern.regex.lastIndex = 0; // Reset regex
      const match = pattern.regex.exec(remainingText);
      if (match && match.index < earliestIndex) {
        earliestIndex = match.index;
        earliestMatch = {
          ...pattern,
          match: match,
          startIndex: match.index,
          endIndex: match.index + match[0].length,
          content: match[1]
        };
        foundMatch = true;
      }
    });

    if (foundMatch) {
      // Add plain text before the match
      if (earliestMatch.startIndex > 0) {
        parts.push({
          text: remainingText.substring(0, earliestMatch.startIndex),
          bold: false,
          italic: false
        });
      }

      // Add the formatted text
      if (earliestMatch.content) {
        parts.push({
          text: earliestMatch.content,
          bold: earliestMatch.bold,
          italic: earliestMatch.italic
        });
      }

      // Continue with remaining text after the match
      remainingText = remainingText.substring(earliestMatch.endIndex);
    } else {
      // No more matches, add remaining text as plain
      if (remainingText) {
        parts.push({
          text: remainingText,
          bold: false,
          italic: false
        });
      }
      remainingText = '';
    }
  }

  // Handle edge case where no text was processed
  if (parts.length === 0) {
    parts.push({ text: text, bold: false, italic: false });
  }

  return parts;
}

/**
 * Test function to validate parser behavior
 * @returns {boolean} True if all tests pass
 */
function runTests() {
  const tests = [
    {
      input: 'Plain text',
      expected: [{ text: 'Plain text', bold: false, italic: false }]
    },
    {
      input: 'This is **bold** text',
      expected: [
        { text: 'This is ', bold: false, italic: false },
        { text: 'bold', bold: true, italic: false },
        { text: ' text', bold: false, italic: false }
      ]
    },
    {
      input: 'This is *italic* text',
      expected: [
        { text: 'This is ', bold: false, italic: false },
        { text: 'italic', bold: false, italic: true },
        { text: ' text', bold: false, italic: false }
      ]
    },
    {
      input: 'This is ***bold italic*** text',
      expected: [
        { text: 'This is ', bold: false, italic: false },
        { text: 'bold italic', bold: true, italic: true },
        { text: ' text', bold: false, italic: false }
      ]
    },
    {
      input: '**Bold** and *italic* and ***both***',
      expected: [
        { text: 'Bold', bold: true, italic: false },
        { text: ' and ', bold: false, italic: false },
        { text: 'italic', bold: false, italic: true },
        { text: ' and ', bold: false, italic: false },
        { text: 'both', bold: true, italic: true }
      ]
    },
    {
      input: 'Numbers: **16x growth** and **$26.6M CAD**',
      expected: [
        { text: 'Numbers: ', bold: false, italic: false },
        { text: '16x growth', bold: true, italic: false },
        { text: ' and ', bold: false, italic: false },
        { text: '$26.6M CAD', bold: true, italic: false }
      ]
    }
  ];

  let allPassed = true;
  
  tests.forEach((test, index) => {
    const result = parseTextWithFormatting(test.input);
    
    // Compare results
    if (JSON.stringify(result) !== JSON.stringify(test.expected)) {
      console.error(`Test ${index + 1} failed:`);
      console.error(`  Input: ${test.input}`);
      console.error('  Expected:', test.expected);
      console.error('  Got:', result);
      allPassed = false;
    }
  });
  
  if (allPassed) {
    console.log('All markdown parser tests passed! ✅');
  }
  
  return allPassed;
}

/**
 * Markdown to Data Transformer
 * Converts markdown cover letters with YAML front matter to pipeline-compatible data
 */

/**
 * Parses a markdown cover letter file and transforms it to pipeline-compatible data
 * @param {string} markdownFilePath - Path to the markdown file
 * @param {string} resumeJsonPath - Path to the resume JSON file for contact info
 * @returns {Object} Data structure compatible with existing pipeline
 */
function parseMarkdownCoverLetter(markdownFilePath, resumeJsonPath) {
  try {
    // Read the markdown file
    const markdownContent = fs.readFileSync(markdownFilePath, 'utf8');
    
    // Parse YAML front matter and markdown content
    const { data: frontMatter, content } = matter(markdownContent);
    
    // Read the resume JSON for contact info
    const resumeData = JSON.parse(fs.readFileSync(resumeJsonPath, 'utf8'));
    
    // Parse markdown content into paragraphs
    const contentParagraphs = parseMarkdownContent(content);
    
    // Create the transformed data structure
    const coverLetterData = {
      // Reuse contact info from resume
      basics: {
        name: resumeData.basics.name,
        email: resumeData.basics.email,
        phone: resumeData.basics.phone,
        location: resumeData.basics.location,
        profiles: resumeData.basics.profiles
      },
      
      // Cover letter specific data
      coverLetter: {
        content: contentParagraphs,
        metadata: {
          date: frontMatter.date || new Date().toISOString().split('T')[0],
          customClosing: frontMatter.customClosing || 'Sincerely'
        }
      }
    };
    
    return coverLetterData;
    
  } catch (error) {
    throw new Error(`Failed to parse markdown cover letter: ${error.message}`);
  }
}

/**
 * Parses markdown content into structured paragraphs
 * @param {string} content - Raw markdown content
 * @returns {Array} Array of paragraph objects with text and formatting
 */
function parseMarkdownContent(content) {
  // Split content into paragraphs (separated by double newlines)
  const paragraphs = content.trim().split(/\n\s*\n/);
  
  return paragraphs.map(paragraph => {
    const trimmedParagraph = paragraph.trim();
    
    // Handle different types of content
    if (trimmedParagraph.startsWith('- ')) {
      // Bullet list
      const listItems = trimmedParagraph.split('\n').filter(line => line.trim().startsWith('- '));
      return {
        type: 'list',
        items: listItems.map(item => parseInlineMarkdown(item.substring(2).trim()))
      };
    } else {
      // Regular paragraph
      return {
        type: 'paragraph',
        text: parseInlineMarkdown(trimmedParagraph)
      };
    }
  });
}

/**
 * Parses inline markdown formatting (bold, italic)
 * @param {string} text - Text with potential markdown formatting
 * @returns {Array} Array of text runs with formatting
 */
function parseInlineMarkdown(text) {
  // Simple regex patterns for bold and italic
  const parts = [];
  const _remainingText = text;
  
  // Find all bold (**text**) and italic (*text*) patterns
  const boldPattern = /\*\*(.+?)\*\*/g;
  const italicPattern = /\*(.+?)\*/g;
  
  let lastIndex = 0;
  let match;
  
  // Process bold patterns first
  while ((match = boldPattern.exec(text)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      const beforeText = text.substring(lastIndex, match.index);
      if (beforeText) {
        parts.push({ text: beforeText, bold: false, italic: false });
      }
    }
    
    // Add the bold text
    parts.push({ text: match[1], bold: true, italic: false });
    lastIndex = match.index + match[0].length;
  }
  
  // Add remaining text
  if (lastIndex < text.length) {
    const remainingText = text.substring(lastIndex);
    if (remainingText) {
      parts.push({ text: remainingText, bold: false, italic: false });
    }
  }
  
  // If no bold patterns found, check for italic patterns
  if (parts.length === 0) {
    lastIndex = 0;
    while ((match = italicPattern.exec(text)) !== null) {
      // Add text before the match
      if (match.index > lastIndex) {
        const beforeText = text.substring(lastIndex, match.index);
        if (beforeText) {
          parts.push({ text: beforeText, bold: false, italic: false });
        }
      }
      
      // Add the italic text
      parts.push({ text: match[1], bold: false, italic: true });
      lastIndex = match.index + match[0].length;
    }
    
    // Add remaining text
    if (lastIndex < text.length) {
      const remainingText = text.substring(lastIndex);
      if (remainingText) {
        parts.push({ text: remainingText, bold: false, italic: false });
      }
    }
  }
  
  // If still no patterns found, add as plain text
  if (parts.length === 0) {
    parts.push({ text: text, bold: false, italic: false });
  }
  
  return parts;
}

/**
 * Finds the corresponding markdown file for a given JSON file
 * @param {string} jsonFilePath - Path to the JSON file
 * @returns {string|null} Path to the markdown file or null if not found
 */
function findMarkdownFile(jsonFilePath) {
  const dir = path.dirname(jsonFilePath);
  const baseName = path.basename(jsonFilePath, '.json');
  const possibleNames = [
    `${baseName}.md`,
    `${baseName}.markdown`,
    'cover-letter.md',
    'coverLetter.md',
    'cover_letter.md'
  ];
  
  for (const name of possibleNames) {
    const fullPath = path.join(dir, name);
    if (fs.existsSync(fullPath)) {
      return fullPath;
    }
  }
  
  return null;
}

export {
  parseTextWithFormatting,
  runTests,
  parseMarkdownCoverLetter,
  findMarkdownFile
};
