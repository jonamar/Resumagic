/**
 * Markdown to Data Transformer
 * Converts markdown cover letters with YAML front matter to pipeline-compatible data
 */

import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { marked } from 'marked';

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
  let remainingText = text;
  
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
  
  // If no formatting found, return the whole text
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
  const jsonDir = path.dirname(jsonFilePath);
  const jsonBaseName = path.basename(jsonFilePath, '.json');
  
  // Look for markdown file with same base name + "-cover-letter.md"
  const markdownPath = path.join(jsonDir, `${jsonBaseName}-cover-letter.md`);
  
  if (fs.existsSync(markdownPath)) {
    return markdownPath;
  }
  
  return null;
}

export {
  parseMarkdownCoverLetter,
  findMarkdownFile
}; 