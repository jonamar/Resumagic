/**
 * Markdown Text Parser for DOCX Resume Generation
 * Parses markdown-style inline formatting and converts to DOCX TextRun elements
 * Supports: **bold**, *italic*, ***bold italic***
 */

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
  let position = 0;

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
      input: "Plain text",
      expected: [{ text: "Plain text", bold: false, italic: false }]
    },
    {
      input: "This is **bold** text",
      expected: [
        { text: "This is ", bold: false, italic: false },
        { text: "bold", bold: true, italic: false },
        { text: " text", bold: false, italic: false }
      ]
    },
    {
      input: "This is *italic* text",
      expected: [
        { text: "This is ", bold: false, italic: false },
        { text: "italic", bold: false, italic: true },
        { text: " text", bold: false, italic: false }
      ]
    },
    {
      input: "This is ***bold italic*** text",
      expected: [
        { text: "This is ", bold: false, italic: false },
        { text: "bold italic", bold: true, italic: true },
        { text: " text", bold: false, italic: false }
      ]
    },
    {
      input: "**Bold** and *italic* and ***both***",
      expected: [
        { text: "Bold", bold: true, italic: false },
        { text: " and ", bold: false, italic: false },
        { text: "italic", bold: false, italic: true },
        { text: " and ", bold: false, italic: false },
        { text: "both", bold: true, italic: true }
      ]
    },
    {
      input: "Numbers: **16x growth** and **$26.6M CAD**",
      expected: [
        { text: "Numbers: ", bold: false, italic: false },
        { text: "16x growth", bold: true, italic: false },
        { text: " and ", bold: false, italic: false },
        { text: "$26.6M CAD", bold: true, italic: false }
      ]
    }
  ];

  let allPassed = true;
  
  tests.forEach((test, index) => {
    const result = parseTextWithFormatting(test.input);
    const passed = JSON.stringify(result) === JSON.stringify(test.expected);
    if (!passed) {
      console.error(`Test ${index + 1} failed:`);
      console.error(`Input: "${test.input}"`);
      console.error(`Expected:`, test.expected);
      console.error(`Got:`, result);
      allPassed = false;
    }
  });

  if (allPassed) {
    console.log('✅ All markdown parser tests passed!');
  }

  return allPassed;
}

export {
  parseTextWithFormatting,
  runTests
}; 