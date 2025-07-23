const fs = require('fs');

/**
 * Extract resume content by section for more reliable Vale processing
 */
class SectionExtractor {
    constructor() {
        this.sections = [];
    }

    /**
     * Extract resume content organized by section with source tracking
     */
    extractSections(jsonPath) {
        const startTime = Date.now();
        const jsonContent = fs.readFileSync(jsonPath, 'utf8');
        const resume = JSON.parse(jsonContent);
        
        this.sections = [];
        
        // Extract executive summary
        if (resume.basics && resume.basics.summary) {
            this.sections.push({
                id: 'executive-summary',
                company: 'Executive Summary',
                sectionType: 'executive-summary',
                content: resume.basics.summary,
                jsonLine: this.findLineInJSON(jsonContent, resume.basics.summary)
            });
        }
        
        // Extract each job separately
        if (resume.work && Array.isArray(resume.work)) {
            resume.work.forEach((job, jobIndex) => {
                if (!job.name) return;
                
                // Job summary
                if (job.summary) {
                    this.sections.push({
                        id: `job-${jobIndex}-summary`,
                        company: job.name,
                        sectionType: 'job-summary',
                        content: job.summary,
                        jsonLine: this.findLineInJSON(jsonContent, job.summary)
                    });
                }
                
                // Job highlights (each separately for precise tracking)
                if (job.highlights && Array.isArray(job.highlights)) {
                    job.highlights.forEach((highlight, highlightIndex) => {
                        this.sections.push({
                            id: `job-${jobIndex}-highlight-${highlightIndex}`,
                            company: job.name,
                            sectionType: 'job-highlight',
                            content: highlight,
                            jsonLine: this.findLineInJSON(jsonContent, highlight)
                        });
                    });
                }
            });
        }
        
        const duration = Date.now() - startTime;
        
        return {
            sections: this.sections,
            stats: {
                duration,
                sectionsExtracted: this.sections.length,
                companiesFound: [...new Set(this.sections.map(s => s.company))].length
            }
        };
    }
    
    /**
     * Find approximate line number of text in JSON file
     */
    findLineInJSON(jsonContent, searchText) {
        const lines = jsonContent.split('\n');
        
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes(searchText)) {
                return i + 1;
            }
        }
        
        return 1; // Fallback
    }
}

module.exports = SectionExtractor;