const fs = require('fs');
const path = require('path');

/**
 * Extract text content from resume JSON for Vale processing
 * Fast and simple field extraction with line mapping
 */
class ResumeTextExtractor {
  constructor() {
    this.lineMap = new Map(); // Maps extracted line numbers back to JSON lines
  }

  /**
     * Extract text content from resume JSON
     * @param {string} jsonPath - Path to resume.json file
     * @returns {Object} { content: string, lineMap: Map }
     */
  extractText(jsonPath) {
    const startTime = Date.now();
        
    try {
      const jsonContent = fs.readFileSync(jsonPath, 'utf8');
      const resume = JSON.parse(jsonContent);
            
      // Reset line map for this extraction
      this.lineMap.clear();
            
      // Extract text content with section headers
      const sections = [];
      let currentLine = 1;
            
      // Process executive summary first
      if (resume.basics && resume.basics.summary) {
        sections.push('# Executive Summary');
        sections.push(resume.basics.summary);
                
        // Map executive summary back to JSON
        const jsonLine = this.findLineInJSON(jsonContent, resume.basics.summary);
        this.lineMap.set(currentLine + 1, { 
          jsonLine, 
          section: 'executive-summary',
          company: 'Executive Summary', 
        });
                
        currentLine += 2;
        sections.push(''); // Empty line
        currentLine++;
      }
            
      // Process work experience
      if (resume.work && Array.isArray(resume.work)) {
        for (const job of resume.work) {
          if (job.name) {
            sections.push(`# ${job.name}`);
            // Map the company header line
            this.lineMap.set(currentLine, { 
              jsonLine: this.findLineInJSON(jsonContent, job.name),
              section: 'company-header',
              company: job.name, 
            });
            currentLine++;
                        
            // Extract summary
            if (job.summary) {
              sections.push('## Summary');
              // Map the summary header
              this.lineMap.set(currentLine, { 
                jsonLine: this.findLineInJSON(jsonContent, job.summary),
                section: 'summary-header',
                company: job.name, 
              });
              currentLine++;
                            
              sections.push(job.summary);
              // Map the summary content
              const jsonLine = this.findLineInJSON(jsonContent, job.summary);
              this.lineMap.set(currentLine, { 
                jsonLine, 
                section: 'summary',
                company: job.name, 
              });
              currentLine++;
            }
                        
            // Extract highlights
            if (job.highlights && Array.isArray(job.highlights)) {
              sections.push('## Highlights');
              // Map the highlights header
              this.lineMap.set(currentLine, { 
                jsonLine: this.findLineInJSON(jsonContent, 'highlights'),
                section: 'highlights-header',
                company: job.name, 
              });
              currentLine++;
                            
              job.highlights.forEach((highlight, index) => {
                sections.push(`- ${highlight}`);
                                
                // Map highlight back to JSON
                const jsonLine = this.findLineInJSON(jsonContent, highlight);
                this.lineMap.set(currentLine, { 
                  jsonLine, 
                  section: 'highlights',
                  company: job.name,
                  highlightIndex: index, 
                });
                                
                currentLine++;
              });
            }
                        
            sections.push(''); // Empty line between jobs
            // Map empty lines to the last company context
            this.lineMap.set(currentLine, { 
              jsonLine: 0,
              section: 'empty',
              company: job.name, 
            });
            currentLine++;
          }
        }
      }
            
      const content = sections.join('\n');
      const duration = Date.now() - startTime;
            
      return {
        content,
        lineMap: this.lineMap,
        stats: {
          duration,
          linesExtracted: currentLine,
          sectionsFound: (resume.work ? resume.work.length : 0) + (resume.basics?.summary ? 1 : 0),
        },
      };
            
    } catch (error) {
      throw new Error(`Failed to extract text from ${jsonPath}: ${error.message}`);
    }
  }
    
  /**
     * Find approximate line number of text in JSON file
     * @param {string} jsonContent - Full JSON content
     * @param {string} searchText - Text to find
     * @returns {number} Approximate line number
     */
  findLineInJSON(jsonContent, searchText) {
    const lines = jsonContent.split('\n');
        
    // Find line containing this text (approximate)
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(searchText)) {
        return i + 1; // 1-based line numbers
      }
    }
        
    return 1; // Fallback
  }
}

module.exports = ResumeTextExtractor;
