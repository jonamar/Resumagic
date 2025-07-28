import { TextRun } from 'docx';
import { parseTextWithFormatting } from '../markdown-processing.js';
export function createFormattedTextRuns(text, baseStyle = {}) {
    const parsedParts = parseTextWithFormatting(text);
    return parsedParts.map(part => new TextRun({
        text: part.text,
        bold: part.bold,
        italics: part.italic,
        ...baseStyle,
    }));
}
//# sourceMappingURL=text-formatting.js.map