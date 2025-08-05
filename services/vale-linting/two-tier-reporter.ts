import fs from 'fs';
import path from 'path';

/**
 * Generate two-tier analysis reports
 */
class TwoTierReporter {
  private startTime: number;

  constructor() {
    this.startTime = Date.now();
  }
    
  /**
     * Generate comprehensive two-tier report with spelling
     */
  generateReport(analysisResults: AnalysisResults, applicationName: string, stats: ReportStats = {}): string {
    const timestamp = new Date().toLocaleString();
    const { tier1, spelling, tier2 } = analysisResults;
        
    // Analysis validation
        
    let report = `# Vale Analysis - ${this.formatApplicationName(applicationName)}\n\n`;
    report += '**File Type:** Resume\n';
    report += `**Critical Issues:** ${tier1.length} | **Spelling Issues:** ${spelling.length} | **Density Issues:** ${tier2.length}\n\n`;
        
    // Tier 1: Critical Writing Issues
    if (tier1.length > 0) {
      report += '## 🚨 Critical Writing Issues (Fix Now)\n\n';
      report += '*Poor writing within individual sections - high impact on readability*\n\n';
            
      const tier1Grouped = this.groupTier1Issues(tier1);
            
      Object.entries(tier1Grouped).forEach(([keyword, data]) => {
        report += `**${keyword}** - Same Section Repetition (${data.totalCount} instances)\n`;
                
        Object.entries(data.sections).forEach(([sectionTitle, instances]) => {
          const positions = instances.map(i => `${i.Line}:${i.Span[1]}`).join(', ');
          report += `- ${sectionTitle}: (${positions})\n`;
        });
        report += '\n';
      });
    } else {
      report += '## ✅ Critical Writing Issues\n\n';
      report += 'No same-section word repetition found. Good writing!\n\n';
    }
        
    // Spelling Issues
    if (spelling.length > 0) {
      report += '## 🔤 Spelling Issues (Fix Now)\n\n';
      report += '*Potential spelling errors detected*\n\n';
            
      const spellingGrouped = this.groupSpellingIssues(spelling);
            
      Object.entries(spellingGrouped).forEach(([word, data]) => {
        report += `**${word}** - Potential misspelling (${data.totalCount} instances)\n`;
                
        Object.entries(data.sections).forEach(([sectionTitle, instances]) => {
          const positions = instances.map(i => `${i.Line}:${i.Span[1]}`).join(', ');
          report += `- ${sectionTitle}: (${positions})\n`;
        });
        report += '\n';
      });
    } else {
      report += '## ✅ Spelling Issues\n\n';
      report += 'No spelling errors detected. Great proofreading!\n\n';
    }
        
    // Tier 2: Density Optimization
    if (tier2.length > 0) {
      report += '## 📊 Density Optimization (Consider Variation)\n\n';
      report += '*Resume-wide patterns - opportunities for synonym variation*\n\n';
            
      // Sort by frequency
      const sortedTier2 = tier2.sort((a, b) => b.count - a.count);
            
      sortedTier2.forEach(item => {
        report += `**${item.keyword}** - Resume-wide Usage (${item.count} instances)\n`;
        report += `- Consider synonyms: ${this.getSynonyms(item.keyword)}\n`;
        report += '- Spread across multiple sections - natural for leadership roles\n\n';
      });
    } else {
      report += '## ✅ Density Optimization\n\n';
      report += 'Good keyword variety across resume sections.\n\n';
    }
        
    // Performance stats
    report += '---\n\n';
    report += '**Performance Stats:**\n';
    report += `- Analysis Time: ${stats.duration || 0}ms\n`;
    report += `- Sections Analyzed: ${stats.sectionsAnalyzed || 0}\n`;
    report += `- Generated: ${timestamp}\n`;
        
    return report;
  }
    
  /**
     * Group Tier 1 issues by keyword and section
     * Only include sections that have 2+ instances of the same keyword
     */
  groupTier1Issues(tier1Issues: TierIssue[]): GroupedIssues {
    const grouped = {};
        
    tier1Issues.forEach(issue => {
      const keyword = this.extractKeyword(issue.Message);
            
      if (!grouped[keyword]) {
        grouped[keyword] = {
          totalCount: 0,
          sections: {},
        };
      }
            
      if (!grouped[keyword].sections[issue.sectionTitle]) {
        grouped[keyword].sections[issue.sectionTitle] = [];
      }
            
      grouped[keyword].sections[issue.sectionTitle].push(issue);
    });
        
    // Filter out keywords that don't have any sections with 2+ instances
    Object.keys(grouped).forEach(keyword => {
      const sectionsWithRepeats = {};
      let hasValidSection = false;
            
      Object.entries(grouped[keyword].sections).forEach(([sectionTitle, instances]) => {
        if (instances.length >= 2) {
          sectionsWithRepeats[sectionTitle] = instances;
          hasValidSection = true;
        }
      });
            
      if (hasValidSection) {
        grouped[keyword].sections = sectionsWithRepeats;
        grouped[keyword].totalCount = Object.values(sectionsWithRepeats)
          .reduce((sum, instances) => sum + instances.length, 0);
      } else {
        // Remove this keyword entirely if no section has 2+ instances
        delete grouped[keyword];
      }
    });
        
    return grouped;
  }
    
  /**
     * Group spelling issues by misspelled word
     */
  groupSpellingIssues(spellingIssues: TierIssue[]): GroupedIssues {
    const grouped = {};
        
    spellingIssues.forEach(issue => {
      const misspelledWord = this.extractKeyword(issue.Message);
            
      if (!grouped[misspelledWord]) {
        grouped[misspelledWord] = {
          totalCount: 0,
          sections: {},
        };
      }
            
      if (!grouped[misspelledWord].sections[issue.sectionTitle]) {
        grouped[misspelledWord].sections[issue.sectionTitle] = [];
      }
            
      grouped[misspelledWord].totalCount++;
      grouped[misspelledWord].sections[issue.sectionTitle].push(issue);
    });
        
    return grouped;
  }
    
  /**
     * Extract keyword from Vale message
     */
  extractKeyword(message: string): string {
    const overusedMatch = message.match(/Overused word detected: '([^']+)'/i);
    if (overusedMatch) {
      return overusedMatch[1];
    }
        
    const weaselMatch = message.match(/'([^']+)' is a weasel word/i);
    if (weaselMatch) {
      return weaselMatch[1];
    }
        
    const wordyMatch = message.match(/'([^']+)' is too wordy/i);
    if (wordyMatch) {
      return wordyMatch[1];
    }
        
    return 'other';
  }
    
  /**
     * Get synonym suggestions for common resume words
     */
  getSynonyms(keyword: string): string {
    const synonymMap: Record<string, string> = {
      'led': 'managed, directed, oversaw, guided, spearheaded',
      'managed': 'led, directed, oversaw, supervised, coordinated',
      'product': 'platform, solution, offering, technology, system',
      'strategy': 'approach, plan, roadmap, vision, framework',
      'built': 'developed, created, established, designed, constructed',
      'driven': 'motivated, results-focused, goal-oriented, performance-based',
      'delivered': 'achieved, completed, executed, implemented, produced',
    };
        
    return synonymMap[keyword.toLowerCase()] || 'use varied vocabulary';
  }
    
  /**
     * Format application name
     */
  formatApplicationName(name: string): string {
    return name.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1),
    ).join(' ');
  }
    
  /**
     * Write report to file
     */
  writeReport(reportContent: string, applicationDir: string): string {
    const workingDir = path.join(applicationDir, 'working');
        
    if (!fs.existsSync(workingDir)) {
      fs.mkdirSync(workingDir, { recursive: true });
    }
        
    const reportPath = path.join(workingDir, 'vale-report.md');
    fs.writeFileSync(reportPath, reportContent, 'utf8');
        
    return reportPath;
  }
}

// Interfaces for two-tier reporting
interface TierIssue {
  Message: string;
  Line: number;
  Span: [number, number];
  sectionTitle: string;
}

interface DensityItem {
  keyword: string;
  count: number;
}

interface AnalysisResults {
  tier1: TierIssue[];
  spelling: TierIssue[];
  tier2: DensityItem[];
}

interface ReportStats {
  duration?: number;
  sectionsAnalyzed?: number;
}

interface GroupedIssueData {
  totalCount: number;
  sections: Record<string, TierIssue[]>;
}

interface GroupedIssues {
  [keyword: string]: GroupedIssueData;
}

export default TwoTierReporter;
