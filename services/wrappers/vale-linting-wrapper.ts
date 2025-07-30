/**
 * Vale Linting Service Wrapper
 * Provides standardized JSON API over Vale linting service
 * Part of Phase 4: Service Migrations
 */

import fs from 'fs';
import path from 'path';
import { BaseServiceWrapper } from './base-service-wrapper.js';

class ValeLintingWrapper extends BaseServiceWrapper {
  constructor() {
    super('vale-linting');
  }

  /**
   * Analyze resume content for writing issues and improvements
   * @param {Object} input - Linting input
   * @param {string} input.resumeDataPath - Path to resume JSON file
   * @param {Object} [input.resumeData] - Resume data object (alternative to file path)
   * @param {boolean} [input.tier1Only] - Only run tier 1 analysis (section-level)
   * @param {boolean} [input.tier2Only] - Only run tier 2 analysis (resume-wide)
   * @param {boolean} [input.spellingOnly] - Only run spelling analysis
   * @returns {Promise<ServiceResponse>}
   */
  async analyze(input) {
    const startTime = Date.now();
    
    this.logOperation('analyze', {
      hasResumeDataPath: !!input.resumeDataPath,
      hasResumeData: !!input.resumeData,
      tier1Only: !!input.tier1Only,
      tier2Only: !!input.tier2Only,
      spellingOnly: !!input.spellingOnly,
    });

    try {
      // Validate input - need either resumeDataPath or resumeData
      if (!input.resumeDataPath && !input.resumeData) {
        const duration = Date.now() - startTime;
        return this.createErrorResponse(
          'INVALID_INPUT',
          'Must provide either resumeDataPath or resumeData',
          { provided: Object.keys(input) },
          duration,
        );
      }

      // Prepare resume data file path
      let resumeDataPath = input.resumeDataPath;
      
      if (!resumeDataPath && input.resumeData) {
        // Create temporary file from resume data
        resumeDataPath = path.join('/tmp', `resume-${Date.now()}.json`);
        fs.writeFileSync(resumeDataPath, JSON.stringify(input.resumeData, null, 2));
      }

      // Verify file exists
      if (!fs.existsSync(resumeDataPath)) {
        const duration = Date.now() - startTime;
        return this.createErrorResponse(
          'FILE_NOT_FOUND',
          `Resume data file not found: ${resumeDataPath}`,
          { path: resumeDataPath },
          duration,
        );
      }

      const result = await this.executeLinting(resumeDataPath, input, startTime);

      // Clean up temporary file if we created one
      if (!input.resumeDataPath && input.resumeData && fs.existsSync(resumeDataPath)) {
        try {
          fs.unlinkSync(resumeDataPath);
        } catch (error) {
          console.warn(`Failed to clean up temporary file: ${error.message}`);
        }
      }

      return result;

    } catch (error) {
      const duration = Date.now() - startTime;
      return this.createErrorResponse(
        'LINTING_FAILED',
        `Vale linting failed: ${error.message}`,
        { 
          originalError: error.message,
          stack: error.stack, 
        },
        duration,
      );
    }
  }

  /**
   * Execute Vale linting using TwoTierAnalyzer
   * @private
   */
  async executeLinting(resumeDataPath, input, startTime) {
    try {
      // Import the Vale linting service (CommonJS module)
      const TwoTierAnalyzer = (await import('../../services/vale-linting/two-tier-analyzer.js')).default ||
                             (await import('../../services/vale-linting/two-tier-analyzer.js')).default;
      
      console.log(`🔍 Running standardized Vale analysis on: ${path.basename(resumeDataPath)}`);
      
      // Initialize the analyzer
      const analyzer = new TwoTierAnalyzer();
      
      // Run the analysis
      const analysisResult = await analyzer.analyzeResume(resumeDataPath);
      
      const duration = Date.now() - startTime;
      
      // Process and filter results based on input preferences
      let processedResults = {
        tier1: input.tier2Only || input.spellingOnly ? [] : analysisResult.tier1 || [],
        spelling: input.tier1Only || input.tier2Only ? [] : analysisResult.spelling || [],
        tier2: input.tier1Only || input.spellingOnly ? [] : analysisResult.tier2 || [],
      };
      
      // If specific analysis requested, filter accordingly
      if (input.tier1Only) {
        processedResults = { tier1: analysisResult.tier1 || [], spelling: [], tier2: [] };
      } else if (input.tier2Only) {
        processedResults = { tier1: [], spelling: [], tier2: analysisResult.tier2 || [] };
      } else if (input.spellingOnly) {
        processedResults = { tier1: [], spelling: analysisResult.spelling || [], tier2: [] };
      }
      
      // Calculate summary statistics
      const totalIssues = processedResults.tier1.length + 
                         processedResults.spelling.length + 
                         processedResults.tier2.length;
      
      const issuesBySeverity = {
        error: 0,
        warning: 0,
        suggestion: 0,
      };
      
      // Count issues by severity across all tiers
      [...processedResults.tier1, ...processedResults.spelling, ...processedResults.tier2].forEach(issue => {
        const severity = issue.Severity?.toLowerCase() || 'suggestion';
        if (Object.prototype.hasOwnProperty.call(issuesBySeverity, severity)) {
          issuesBySeverity[severity]++;
        } else {
          issuesBySeverity.suggestion++;
        }
      });
      
      // Return standardized response format
      return this.createSuccessResponse({
        analysis: processedResults,
        summary: {
          total_issues: totalIssues,
          tier1_issues: processedResults.tier1.length,
          spelling_issues: processedResults.spelling.length,
          tier2_issues: processedResults.tier2.length,
          issues_by_severity: issuesBySeverity,
          sections_analyzed: analysisResult.stats?.sectionsAnalyzed || 0,
          analysis_duration_ms: analysisResult.stats?.duration || duration,
        },
        context: {
          resume_file: path.basename(resumeDataPath),
          analysis_timestamp: new Date().toISOString(),
          analysis_filters: {
            tier1_only: !!input.tier1Only,
            tier2_only: !!input.tier2Only,
            spelling_only: !!input.spellingOnly,
          },
        },
        implementation: 'vale-linting',
      }, duration);
      
    } catch (error) {
      console.error(`Vale linting failed: ${error.message}`);
      
      // If linting fails, provide a structured error response
      const duration = Date.now() - startTime;
      return this.createErrorResponse(
        'LINTING_FAILED',
        `Vale linting failed: ${error.message}`,
        { 
          originalError: error.message,
          stack: error.stack,
          resumeDataPath,
          analysisFilters: {
            tier1Only: input.tier1Only,
            tier2Only: input.tier2Only,
            spellingOnly: input.spellingOnly,
          },
        },
        duration,
      );
    }
  }

  /**
   * Get quick spelling check for resume content
   * @param {Object} input - Spelling check input
   * @param {string} input.resumeDataPath - Path to resume JSON file
   * @param {Object} [input.resumeData] - Resume data object (alternative to file path)
   * @returns {Promise<ServiceResponse>}
   */
  async quickSpellingCheck(input) {
    return this.analyze({
      ...input,
      spellingOnly: true,
    });
  }

  /**
   * Get comprehensive analysis (all tiers)
   * @param {Object} input - Analysis input
   * @param {string} input.resumeDataPath - Path to resume JSON file
   * @param {Object} [input.resumeData] - Resume data object (alternative to file path)
   * @returns {Promise<ServiceResponse>}
   */
  async comprehensiveAnalysis(input) {
    return this.analyze(input); // Default is all tiers
  }
}

export default ValeLintingWrapper;
