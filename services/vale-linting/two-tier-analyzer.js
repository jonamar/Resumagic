const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

/**
 * Two-tier analysis system for resume content
 * Tier 1: Critical writing issues within sections (exec summary, individual jobs)
 * Tier 2: Resume-wide density optimization
 */
class TwoTierAnalyzer {
    constructor() {
        this.tempDir = __dirname;
    }
    
    /**
     * Analyze resume with two-tier approach
     */
    async analyzeResume(jsonPath) {
        const startTime = Date.now();
        const jsonContent = fs.readFileSync(jsonPath, 'utf8');
        const resume = JSON.parse(jsonContent);
        
        // Extract sections for analysis
        const sections = this.extractSections(resume, jsonContent);
        
        // Tier 1: Analyze each section individually for writing issues
        const tier1Results = await this.analyzeTier1(sections);
        
        // Tier 2: Analyze entire resume for density patterns
        const tier2Results = await this.analyzeTier2(resume, jsonContent);
        
        const duration = Date.now() - startTime;
        
        return {
            tier1: tier1Results,
            tier2: tier2Results,
            stats: {
                duration,
                sectionsAnalyzed: sections.length,
                totalIssues: tier1Results.length + tier2Results.length
            }
        };
    }
    
    /**
     * Extract resume content into logical sections
     */
    extractSections(resume, jsonContent) {
        const sections = [];
        
        // Executive Summary
        if (resume.basics && resume.basics.summary) {
            sections.push({
                id: 'executive-summary',
                title: 'Executive Summary',
                type: 'executive-summary',
                content: resume.basics.summary,
                jsonLine: this.findLineInJSON(jsonContent, resume.basics.summary)
            });
        }
        
        // Individual Jobs (summary + highlights combined)
        if (resume.work && Array.isArray(resume.work)) {
            resume.work.forEach((job, jobIndex) => {
                if (!job.name) return;
                
                // Combine job summary and highlights into one section
                let jobContent = '';
                if (job.summary) {
                    jobContent += job.summary;
                }
                if (job.highlights && Array.isArray(job.highlights)) {
                    jobContent += ' ' + job.highlights.join(' ');
                }
                
                if (jobContent.trim()) {
                    sections.push({
                        id: `job-${jobIndex}`,
                        title: job.name,
                        type: 'job',
                        content: jobContent.trim(),
                        jsonLine: this.findLineInJSON(jsonContent, job.name),
                        originalJob: job
                    });
                }
            });
        }
        
        return sections;
    }
    
    /**
     * Tier 1: Critical writing issues within individual sections
     */
    async analyzeTier1(sections) {
        const criticalIssues = [];
        
        for (const section of sections) {
            try {
                // Count actual word occurrences in this section
                const wordCounts = this.countWordsInText(section.content);
                
                // Only flag words that appear 2+ times in the same section
                const repeatedWords = Object.entries(wordCounts)
                    .filter(([word, count]) => count >= 2)
                    .map(([word, count]) => ({ word, count }));
                
                if (repeatedWords.length > 0) {
                    // Run Vale to get specific positions, but filter to only repeated words
                    const valeResults = await this.runValeOnContent(section.content, section.id);
                    
                    // Filter Vale results to only include actually repeated words
                    const filteredResults = valeResults.filter(issue => {
                        const keyword = this.extractKeyword(issue.Message).toLowerCase();
                        return repeatedWords.some(rw => rw.word.toLowerCase() === keyword);
                    });
                    
                    // Add section context to filtered results
                    filteredResults.forEach(issue => {
                        criticalIssues.push({
                            ...issue,
                            sectionId: section.id,
                            sectionTitle: section.title,
                            sectionType: section.type,
                            jsonLine: section.jsonLine,
                            tier: 1,
                            priority: 'critical',
                            reason: 'Poor writing within section'
                        });
                    });
                }
            } catch (error) {
                console.error(`Error analyzing section ${section.id}:`, error.message);
            }
        }
        
        return criticalIssues;
    }
    
    /**
     * Count word occurrences in text (case-insensitive)
     */
    countWordsInText(text) {
        const words = {};
        
        // Extract words that Vale typically flags (common resume words)
        const resumeWords = ['led', 'lead', 'leading', 'managed', 'manage', 'managing', 'built', 'build', 'building', 
                            'product', 'products', 'strategy', 'strategic', 'driven', 'drive', 'driving',
                            'delivered', 'deliver', 'delivering', 'developed', 'develop', 'developing'];
        
        const textLower = text.toLowerCase();
        
        resumeWords.forEach(word => {
            // Count whole word occurrences (not parts of other words)
            const regex = new RegExp(`\\b${word}\\b`, 'gi');
            const matches = textLower.match(regex);
            if (matches && matches.length > 0) {
                words[word] = matches.length;
            }
        });
        
        return words;
    }
    
    /**
     * Tier 2: Resume-wide density analysis
     */
    async analyzeTier2(resume, jsonContent) {
        // Combine all resume text
        let fullResumeText = '';
        
        if (resume.basics && resume.basics.summary) {
            fullResumeText += resume.basics.summary + ' ';
        }
        
        if (resume.work && Array.isArray(resume.work)) {
            resume.work.forEach(job => {
                if (job.summary) fullResumeText += job.summary + ' ';
                if (job.highlights) {
                    fullResumeText += job.highlights.join(' ') + ' ';
                }
            });
        }
        
        // Run Vale on full resume
        const valeResults = await this.runValeOnContent(fullResumeText, 'full-resume');
        
        // Group by keyword and count occurrences
        const densityIssues = this.groupByDensity(valeResults, resume);
        
        return densityIssues.map(issue => ({
            ...issue,
            tier: 2,
            priority: 'advisory',
            reason: 'Resume-wide density optimization'
        }));
    }
    
    /**
     * Group Vale results by keyword density
     */
    groupByDensity(valeResults, resume) {
        const keywordCounts = {};
        
        // Count keyword occurrences
        valeResults.forEach(issue => {
            const keyword = this.extractKeyword(issue.Message);
            if (!keywordCounts[keyword]) {
                keywordCounts[keyword] = {
                    keyword,
                    count: 0,
                    sections: {}
                };
            }
            keywordCounts[keyword].count++;
        });
        
        // Only flag keywords that appear frequently (threshold: 3+ times)
        return Object.values(keywordCounts).filter(item => item.count >= 3);
    }
    
    /**
     * Extract keyword from Vale message
     */
    extractKeyword(message) {
        const overusedMatch = message.match(/Overused word detected: '([^']+)'/i);
        if (overusedMatch) return overusedMatch[1];
        
        const weaselMatch = message.match(/'([^']+)' is a weasel word/i);
        if (weaselMatch) return weaselMatch[1];
        
        const wordyMatch = message.match(/'([^']+)' is too wordy/i);
        if (wordyMatch) return wordyMatch[1];
        
        return 'other';
    }
    
    /**
     * Run Vale on content
     */
    async runValeOnContent(content, sectionId) {
        return new Promise((resolve, reject) => {
            const tempFile = path.join(this.tempDir, `temp-${sectionId}.md`);
            fs.writeFileSync(tempFile, content, 'utf8');
            
            const valeProcess = spawn('vale', ['--output=JSON', tempFile], {
                cwd: __dirname,
                stdio: ['ignore', 'pipe', 'pipe']
            });
            
            let stdout = '';
            
            valeProcess.stdout.on('data', (data) => {
                stdout += data.toString();
            });
            
            valeProcess.on('close', (code) => {
                try {
                    fs.unlinkSync(tempFile);
                } catch (e) {}
                
                try {
                    if (stdout.trim()) {
                        const results = JSON.parse(stdout);
                        const firstKey = Object.keys(results)[0];
                        resolve(results[firstKey] || []);
                    } else {
                        resolve([]);
                    }
                } catch (error) {
                    reject(new Error(`Vale parsing error: ${error.message}`));
                }
            });
            
            valeProcess.on('error', (error) => {
                reject(new Error(`Vale execution error: ${error.message}`));
            });
        });
    }
    
    /**
     * Find line number in JSON
     */
    findLineInJSON(jsonContent, searchText) {
        const lines = jsonContent.split('\n');
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes(searchText)) {
                return i + 1;
            }
        }
        return 1;
    }
}

module.exports = TwoTierAnalyzer;