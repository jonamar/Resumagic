import fs from 'fs';
import path from 'path';

/**
 * Generate clean markdown reports from Vale output
 */
class ValeReporter {
  constructor() {
    this.startTime = Date.now();
  }

  /**
     * Generate a clean markdown report from Vale JSON output
     */
  generateReport(valeResults: ValeIssue[], lineMap: Map<number, LineMapEntry>, applicationName: string, stats: ProcessingStats = {}): string {
    const timestamp = new Date().toLocaleString();
    const issueCount = valeResults.length;
    const fileType = stats.fileType || 'unknown';
        
    let report = `# Vale Style Analysis - ${this.formatApplicationName(applicationName)}\n\n`;
    report += `**File Type:** ${this.formatFileType(fileType)}  \n`;
    report += `**Issues Found:** ${issueCount}\n\n`;
        
    if (issueCount === 0) {
      report += `✅ **No style issues found!** Your ${fileType} content looks great.\n\n`;
      report += '**Performance Stats:**\n';
      report += `- Extraction: ${stats.extractionDuration || 0}ms\n`;
      report += `- Vale Processing: ${stats.valeDuration || 0}ms\n`;
      report += `- Lines Processed: ${stats.linesExtracted || 0}\n`;
      return report;
    }
        
    // Group issues by error type, then keyword, then section
    const issuesByTypeAndKeyword = this.groupIssuesHierarchically(valeResults, lineMap);
        
    for (const [errorType, keywordGroups] of Object.entries(issuesByTypeAndKeyword)) {
      const totalCount = Object.values(keywordGroups).reduce((sum, group) => sum + group.totalCount, 0);
      report += `## ${errorType} (${totalCount} issues)\n\n`;
            
      // Sort keywords by frequency (most frequent first)
      const sortedKeywords = Object.entries(keywordGroups)
        .sort(([,a], [,b]) => b.totalCount - a.totalCount);
            
      for (const [keyword, keywordData] of sortedKeywords) {
        report += `**${keyword}** (${keywordData.totalCount} instances)\n`;
                
        // Create bullet list format by section
        for (const [section, instances] of Object.entries(keywordData.sections)) {
          if (instances.length > 0) {
            const locations = instances.map(inst => `${inst.jsonLine}:${inst.column}`).join(', ');
            const sectionName = this.formatSectionName(section, instances[0]);
            report += `- ${sectionName} (${locations})\n`;
          }
        }
        report += '\n';
      }
    }
        
    // Add performance stats
    report += '---\n\n';
    report += '**Performance Stats:**\n';
    report += `- Extraction: ${stats.extractionDuration || 0}ms\n`;
    report += `- Vale Processing: ${stats.valeDuration || 0}ms\n`;
    report += `- Report Generation: ${Date.now() - this.startTime}ms\n`;
    report += `- Lines Processed: ${stats.linesExtracted || 0}\n`;
    report += `- Sections Found: ${stats.sectionsFound || 0}\n`;
    report += `- Generated: ${timestamp}\n`;
    report += `- Processing Time: ${stats.totalDuration || 0}ms\n`;
        
    return report;
  }
    
  /**
     * Group Vale issues hierarchically: type → keyword → section → instances
     */
  groupIssuesHierarchically(valeResults: ValeIssue[], lineMap: Map<number, LineMapEntry>): IssueGrouping {
    const grouped = {};
        
    valeResults.forEach(issue => {
      const lineInfo = lineMap.get(issue.Line) || {};
      const jsonLine = lineInfo.jsonLine || issue.Line;
      const errorType = this.categorizeError(issue.Message);
      const keyword = this.extractKeyword(issue.Message);
      const section = lineInfo.section || 'content';
            
      // Initialize structure
      if (!grouped[errorType]) {
        grouped[errorType] = {};
      }
      if (!grouped[errorType][keyword]) {
        grouped[errorType][keyword] = {
          totalCount: 0,
          sections: {},
        };
      }
      if (!grouped[errorType][keyword].sections[section]) {
        grouped[errorType][keyword].sections[section] = [];
      }
            
      // Add instance with company info
      grouped[errorType][keyword].totalCount++;
      grouped[errorType][keyword].sections[section].push({
        jsonLine,
        column: issue.Span[1],
        company: lineInfo.company,
      });
    });
        
    return grouped;
  }
    
  /**
     * Extract the specific keyword from error message
     */
  extractKeyword(message: string): string {
    // For overused words: "Overused word detected: 'product' - consider varying vocabulary"
    const overusedMatch = message.match(/Overused word detected: '([^']+)'/i);
    if (overusedMatch) {
      return overusedMatch[1];
    }
        
    // For weasel words: "'clearly' is a weasel word!"
    const weaselMatch = message.match(/'([^']+)' is a weasel word/i);
    if (weaselMatch) {
      return weaselMatch[1];
    }
        
    // For wordy phrases: "'equivalent' is too wordy."
    const wordyMatch = message.match(/'([^']+)' is too wordy/i);
    if (wordyMatch) {
      return wordyMatch[1];
    }
        
    // For currency format issues
    if (message.includes('Currency format')) {
      return 'Currency Format';
    }
        
    // Fallback
    return 'Other';
  }
    
  /**
     * Categorize error message by type
     */
  categorizeError(message: string): string {
    if (message.includes('Overused word detected')) {
      return 'Overused Words';
    } else if (message.includes('weasel word')) {
      return 'Weasel Words';
    } else if (message.includes('too wordy')) {
      return 'Wordy Phrases';
    } else if (message.includes('Currency format')) {
      return 'Currency Format';
    } else if (message.includes('passive voice')) {
      return 'Passive Voice';
    } else {
      return 'Other Style Issues';
    }
  }
    
  /**
     * Clean up Vale message text
     */
  cleanMessage(message: string): string {
    // Remove technical rule names in parentheses
    return message.replace(/\s*\([^)]+\)\s*$/, '').trim();
  }
    
  /**
     * Format application name for display
     */
  formatApplicationName(name: string): string {
    return name.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1),
    ).join(' ');
  }
    
  /**
     * Format section name for display
     */
  formatSectionName(section: string, instance: InstanceData): string {
    switch (section) {
    case 'executive-summary': return 'Executive Summary';
    case 'summary': 
    case 'highlights': 
      // Use company name for job sections
      return instance && instance.company ? instance.company : 'Job Content';
    case 'content': return 'Content';
    default: return section.charAt(0).toUpperCase() + section.slice(1).replace('-', ' ');
    }
  }
    
  /**
     * Format file type for display
     */
  formatFileType(fileType: string): string {
    switch (fileType) {
    case 'resume': return 'Resume';
    case 'cover-letter': return 'Cover Letter';
    default: return fileType.charAt(0).toUpperCase() + fileType.slice(1);
    }
  }
    
  /**
     * Write report to working directory
     */
  writeReport(reportContent: string, applicationPath: string): string {
    const workingDir = path.join(applicationPath, 'working');
        
    // Ensure working directory exists
    if (!fs.existsSync(workingDir)) {
      fs.mkdirSync(workingDir, { recursive: true });
    }
        
    const reportPath = path.join(workingDir, 'vale-report.md');
    fs.writeFileSync(reportPath, reportContent, 'utf8');
        
    return reportPath;
  }
}

// Interfaces for Vale reporting
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

interface LineMapEntry {
  jsonLine: number;
  section: string;
  company: string;
  highlightIndex?: number;
}

interface ProcessingStats {
  fileType?: string;
  extractionDuration?: number;
  valeDuration?: number;
  linesExtracted?: number;
  sectionsFound?: number;
  totalDuration?: number;
}

interface InstanceData {
  jsonLine: number;
  column: number;
  company: string;
}

interface KeywordData {
  totalCount: number;
  sections: Record<string, InstanceData[]>;
}

interface IssueGrouping {
  [errorType: string]: Record<string, KeywordData>;
}

export default ValeReporter;
