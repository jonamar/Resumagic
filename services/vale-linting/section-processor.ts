import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Vale processing interfaces
interface ValeIssue {
  Check: string;
  Description: string;
  Line: number;
  Link: string;
  Message: string;
  Severity: string;
  Span: [number, number];
  Match: string;
}

interface ProcessedValeResult extends ValeIssue {
  sectionId: string;
  company: string;
  sectionType: string;
  jsonLine: number;
  originalContent: string;
}

/**
 * Process each section through Vale individually for reliable results
 */
class SectionProcessor {
  private tempDir: string;

  constructor() {
    this.tempDir = __dirname;
  }
    
  /**
     * Process all sections through Vale
     */
  async processAllSections(sections: any[]): Promise<ProcessedValeResult[]> {
    const results = [];
        
    for (const section of sections) {
      try {
        const valeResults = await this.processSingleSection(section);
                
        // Add section context to each Vale result
        valeResults.forEach(issue => {
          results.push({
            ...issue,
            sectionId: section.id,
            company: section.company,
            sectionType: section.sectionType,
            jsonLine: section.jsonLine,
            originalContent: section.content,
          });
        });
      } catch (error) {
        console.error(`Error processing section ${section.id}:`, error.message);
      }
    }
        
    return results;
  }
    
  /**
     * Process a single section through Vale
     */
  async processSingleSection(section: ResumeSection): Promise<ValeIssue[]> {
    return new Promise((resolve, reject) => {
      // Write section content to temp file
      const tempFile = path.join(this.tempDir, `temp-${section.id}.md`);
      fs.writeFileSync(tempFile, section.content, 'utf8');
            
      // Run Vale
      const valeProcess = spawn('vale', ['--output=JSON', tempFile], {
        cwd: __dirname,
        stdio: ['ignore', 'pipe', 'pipe'],
      });
            
      let stdout = '';
      let stderr = '';
            
      valeProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });
            
      valeProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });
            
      valeProcess.on('close', (code) => {
        // Clean up temp file
        try {
          fs.unlinkSync(tempFile);
        } catch (e) {
          // Ignore cleanup errors
        }
                
        try {
          // Parse Vale results
          if (stdout.trim()) {
            const results = JSON.parse(stdout);
            const firstKey = Object.keys(results)[0];
            resolve(results[firstKey] || []);
          } else {
            resolve([]);
          }
        } catch (error) {
          reject(new Error(`Vale parsing error for ${section.id}: ${error.message}`));
        }
      });
            
      valeProcess.on('error', (error) => {
        reject(new Error(`Vale execution error for ${section.id}: ${error.message}`));
      });
    });
  }
}

export default SectionProcessor;
