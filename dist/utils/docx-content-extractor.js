import fs from 'fs';
import crypto from 'crypto';
import JSZip from 'jszip';
export async function extractDocxContent(filePath) {
    try {
        if (!fs.existsSync(filePath)) {
            throw new Error(`DOCX file not found: ${filePath}`);
        }
        const buffer = fs.readFileSync(filePath);
        const zip = await JSZip.loadAsync(buffer);
        const documentFile = zip.files['word/document.xml'];
        if (!documentFile) {
            throw new Error('Invalid DOCX file: missing word/document.xml');
        }
        const documentXml = await documentFile.async('string');
        const textContent = extractTextFromWordXml(documentXml);
        return textContent.trim();
    }
    catch (error) {
        throw new Error(`Failed to extract DOCX content: ${error.message}`);
    }
}
export function extractTextFromWordXml(xmlContent) {
    try {
        let textContent = xmlContent;
        textContent = textContent.replace(/<[^>]+>/g, ' ');
        const entities = {
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
        textContent = textContent.replace(/\s+/g, ' ');
        return textContent;
    }
    catch (error) {
        throw new Error(`Failed to extract text from Word XML: ${error.message}`);
    }
}
export function generateContentHash(content) {
    return crypto.createHash('sha256').update(content).digest('hex');
}
export async function validateDocxContentHash(filePath, expectedHash) {
    try {
        const content = await extractDocxContent(filePath);
        const actualHash = generateContentHash(content);
        return {
            valid: actualHash === expectedHash,
            actualHash,
            content,
        };
    }
    catch (error) {
        return {
            valid: false,
            actualHash: '',
            content: `Error: ${error.message}`,
        };
    }
}
export async function extractMultipleContentHashes(filePaths) {
    const hashes = {};
    for (const filePath of filePaths) {
        try {
            const content = await extractDocxContent(filePath);
            const hash = generateContentHash(content);
            const fileName = filePath.split('/').pop() || filePath;
            hashes[fileName] = hash;
        }
        catch (error) {
            const fileName = filePath.split('/').pop() || filePath;
            hashes[fileName] = `Error: ${error.message}`;
        }
    }
    return hashes;
}
//# sourceMappingURL=docx-content-extractor.js.map