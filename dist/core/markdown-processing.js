import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
function parseTextWithFormatting(text) {
    if (!text || typeof text !== 'string') {
        return [{ text: text || '', bold: false, italic: false }];
    }
    const parts = [];
    let remainingText = text;
    const position = 0;
    while (remainingText.length > 0) {
        let foundMatch = false;
        let earliestMatch = null;
        let earliestIndex = remainingText.length;
        const patterns = [
            { regex: /\*\*\*(.*?)\*\*\*/g, bold: true, italic: true, name: 'bold-italic' },
            { regex: /\*\*(.*?)\*\*/g, bold: true, italic: false, name: 'bold' },
            { regex: /\*(.*?)\*/g, bold: false, italic: true, name: 'italic' },
        ];
        patterns.forEach(pattern => {
            pattern.regex.lastIndex = 0;
            const match = pattern.regex.exec(remainingText);
            if (match && match.index < earliestIndex) {
                earliestIndex = match.index;
                earliestMatch = {
                    ...pattern,
                    match: match,
                    startIndex: match.index,
                    endIndex: match.index + match[0].length,
                    content: match[1],
                };
                foundMatch = true;
            }
        });
        if (foundMatch) {
            if (earliestMatch.startIndex > 0) {
                parts.push({
                    text: remainingText.substring(0, earliestMatch.startIndex),
                    bold: false,
                    italic: false,
                });
            }
            if (earliestMatch.content) {
                parts.push({
                    text: earliestMatch.content,
                    bold: earliestMatch.bold,
                    italic: earliestMatch.italic,
                });
            }
            remainingText = remainingText.substring(earliestMatch.endIndex);
        }
        else {
            if (remainingText) {
                parts.push({
                    text: remainingText,
                    bold: false,
                    italic: false,
                });
            }
            remainingText = '';
        }
    }
    if (parts.length === 0) {
        parts.push({ text: text, bold: false, italic: false });
    }
    return parts;
}
function runTests() {
    const tests = [
        {
            input: 'Plain text',
            expected: [{ text: 'Plain text', bold: false, italic: false }],
        },
        {
            input: 'This is **bold** text',
            expected: [
                { text: 'This is ', bold: false, italic: false },
                { text: 'bold', bold: true, italic: false },
                { text: ' text', bold: false, italic: false },
            ],
        },
        {
            input: 'This is *italic* text',
            expected: [
                { text: 'This is ', bold: false, italic: false },
                { text: 'italic', bold: false, italic: true },
                { text: ' text', bold: false, italic: false },
            ],
        },
        {
            input: 'This is ***bold italic*** text',
            expected: [
                { text: 'This is ', bold: false, italic: false },
                { text: 'bold italic', bold: true, italic: true },
                { text: ' text', bold: false, italic: false },
            ],
        },
        {
            input: '**Bold** and *italic* and ***both***',
            expected: [
                { text: 'Bold', bold: true, italic: false },
                { text: ' and ', bold: false, italic: false },
                { text: 'italic', bold: false, italic: true },
                { text: ' and ', bold: false, italic: false },
                { text: 'both', bold: true, italic: true },
            ],
        },
        {
            input: 'Numbers: **16x growth** and **$26.6M CAD**',
            expected: [
                { text: 'Numbers: ', bold: false, italic: false },
                { text: '16x growth', bold: true, italic: false },
                { text: ' and ', bold: false, italic: false },
                { text: '$26.6M CAD', bold: true, italic: false },
            ],
        },
    ];
    let allPassed = true;
    tests.forEach((test, index) => {
        const result = parseTextWithFormatting(test.input);
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
function parseMarkdownCoverLetter(markdownFilePath, resumeJsonPath) {
    try {
        const markdownContent = fs.readFileSync(markdownFilePath, 'utf8');
        const { data: frontMatter, content } = matter(markdownContent);
        const resumeData = JSON.parse(fs.readFileSync(resumeJsonPath, 'utf8'));
        const contentParagraphs = parseMarkdownContent(content);
        const coverLetterData = {
            basics: {
                name: resumeData.basics.name,
                email: resumeData.basics.email,
                phone: resumeData.basics.phone,
                location: resumeData.basics.location,
                profiles: resumeData.basics.profiles,
            },
            coverLetter: {
                content: contentParagraphs,
                metadata: {
                    date: frontMatter.date || new Date().toISOString().split('T')[0],
                    customClosing: frontMatter.customClosing || 'Sincerely',
                },
            },
        };
        return coverLetterData;
    }
    catch (error) {
        throw new Error(`Failed to parse markdown cover letter: ${error.message}`);
    }
}
function parseMarkdownContent(content) {
    const paragraphs = content.trim().split(/\n\s*\n/);
    return paragraphs.map(paragraph => {
        const trimmedParagraph = paragraph.trim();
        if (trimmedParagraph.startsWith('- ')) {
            const listItems = trimmedParagraph.split('\n').filter(line => line.trim().startsWith('- '));
            return {
                type: 'list',
                items: listItems.map(item => parseInlineMarkdown(item.substring(2).trim())),
            };
        }
        else {
            return {
                type: 'paragraph',
                text: parseInlineMarkdown(trimmedParagraph),
            };
        }
    });
}
function parseInlineMarkdown(text) {
    const parts = [];
    const _remainingText = text;
    const boldPattern = /\*\*(.+?)\*\*/g;
    const italicPattern = /\*(.+?)\*/g;
    let lastIndex = 0;
    let match;
    while ((match = boldPattern.exec(text)) !== null) {
        if (match.index > lastIndex) {
            const beforeText = text.substring(lastIndex, match.index);
            if (beforeText) {
                parts.push({ text: beforeText, bold: false, italic: false });
            }
        }
        parts.push({ text: match[1], bold: true, italic: false });
        lastIndex = match.index + match[0].length;
    }
    if (lastIndex < text.length) {
        const remainingText = text.substring(lastIndex);
        if (remainingText) {
            parts.push({ text: remainingText, bold: false, italic: false });
        }
    }
    if (parts.length === 0) {
        lastIndex = 0;
        while ((match = italicPattern.exec(text)) !== null) {
            if (match.index > lastIndex) {
                const beforeText = text.substring(lastIndex, match.index);
                if (beforeText) {
                    parts.push({ text: beforeText, bold: false, italic: false });
                }
            }
            parts.push({ text: match[1], bold: false, italic: true });
            lastIndex = match.index + match[0].length;
        }
        if (lastIndex < text.length) {
            const remainingText = text.substring(lastIndex);
            if (remainingText) {
                parts.push({ text: remainingText, bold: false, italic: false });
            }
        }
    }
    if (parts.length === 0) {
        parts.push({ text: text, bold: false, italic: false });
    }
    return parts;
}
function findMarkdownFile(jsonFilePath) {
    const dir = path.dirname(jsonFilePath);
    const baseName = path.basename(jsonFilePath, '.json');
    const possibleNames = [
        `${baseName}.md`,
        `${baseName}.markdown`,
        'cover-letter.md',
        'coverLetter.md',
        'cover_letter.md',
    ];
    for (const name of possibleNames) {
        const fullPath = path.join(dir, name);
        if (fs.existsSync(fullPath)) {
            return fullPath;
        }
    }
    return null;
}
export { parseTextWithFormatting, runTests, parseMarkdownCoverLetter, findMarkdownFile, };
//# sourceMappingURL=markdown-processing.js.map