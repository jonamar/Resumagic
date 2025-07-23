/**
 * Keyword Analysis Service Wrapper
 * Provides standardized JSON API over Python keyword analysis service
 * Part of Phase 2: Standardize Existing Service Infrastructure
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);
const fs = require('fs');
const path = require('path');
const { BaseServiceWrapper } = require('./base-service-wrapper');

class KeywordAnalysisWrapper extends BaseServiceWrapper {
  constructor() {
    super('keyword-analysis', 'STANDARDIZED_KEYWORD_ANALYSIS');
  }

  /**
   * Analyze keywords for a job application
   * @param {Object} input - Analysis input
   * @param {string} input.applicationName - Name of the application
   * @param {string} input.keywordsFile - Path to keywords.json file
   * @param {string} input.jobPostingFile - Path to job-posting.md file
   * @param {string} [input.resumeFile] - Optional path to resume.json file
   * @param {number} [input.topCount] - Number of top keywords to return
   * @returns {Promise<ServiceResponse>}
   */
  async analyze(input) {
    const startTime = Date.now();
    const useLegacy = this.shouldUseLegacyImplementation();
    
    this.logOperation('analyze', {
      applicationName: input.applicationName,
      hasResumeFile: !!input.resumeFile,
      topCount: input.topCount
    }, useLegacy);

    try {
      // Validate input
      this.validateInput(input, {
        applicationName: { type: 'string', required: true },
        keywordsFile: { type: 'string', required: true },
        jobPostingFile: { type: 'string', required: true }
      });

      // Check file existence
      if (!fs.existsSync(input.keywordsFile)) {
        const duration = Date.now() - startTime;
        return this.createErrorResponse(
          'FILE_NOT_FOUND',
          `Keywords file not found: ${input.keywordsFile}`,
          { file: input.keywordsFile },
          duration
        );
      }

      if (!fs.existsSync(input.jobPostingFile)) {
        const duration = Date.now() - startTime;
        return this.createErrorResponse(
          'FILE_NOT_FOUND',
          `Job posting file not found: ${input.jobPostingFile}`,
          { file: input.jobPostingFile },
          duration
        );
      }

      let result;
      if (useLegacy) {
        result = await this.executeLegacyAnalysis(input, startTime);
      } else {
        result = await this.executeStandardizedAnalysis(input, startTime);
      }

      return result;

    } catch (error) {
      const duration = Date.now() - startTime;
      return this.createErrorResponse(
        'ANALYSIS_FAILED',
        `Keyword analysis failed: ${error.message}`,
        { 
          originalError: error.message,
          stack: error.stack 
        },
        duration
      );
    }
  }

  /**
   * Execute legacy Python shell command
   * @private
   */
  async executeLegacyAnalysis(input, startTime) {
    // Construct the command with proper arguments
    let command = `python services/keyword-analysis/kw_rank_modular.py "${input.keywordsFile}" "${input.jobPostingFile}"`;
    
    // Add resume file if it exists for sentence matching
    if (input.resumeFile && fs.existsSync(input.resumeFile)) {
      command += ` --resume "${input.resumeFile}"`;
    }

    // Add top count if specified
    if (input.topCount) {
      command += ` --top ${input.topCount}`;
    }

    const { stdout, stderr } = await execAsync(command, {
      cwd: path.resolve(__dirname, '../..'),
      timeout: 120000 // 2 minutes - ML processing takes time
    });

    if (stderr) {
      console.warn(`Keyword analysis warnings: ${stderr}`);
    }

    const duration = Date.now() - startTime;
    
    // Parse the Python output (assuming it's JSON or structured text)
    let parsedOutput;
    try {
      parsedOutput = JSON.parse(stdout);
    } catch (parseError) {
      // If not JSON, return raw text output
      parsedOutput = {
        raw_output: stdout.trim(),
        parsed: false
      };
    }

    return this.createSuccessResponse({
      analysis: parsedOutput,
      command: command,
      implementation: 'legacy'
    }, duration);
  }

  /**
   * Execute standardized analysis (future implementation)
   * @private
   */
  async executeStandardizedAnalysis(input, startTime) {
    // For now, this is a placeholder that calls the legacy implementation
    // In future phases, this would call a more direct API
    const result = await this.executeLegacyAnalysis(input, startTime);
    
    // Mark as standardized implementation
    result.data.implementation = 'standardized';
    
    return result;
  }

  /**
   * Get analysis recommendations based on keywords
   * @param {Object} input - Recommendation input
   * @returns {Promise<ServiceResponse>}
   */
  async getRecommendations(input) {
    const startTime = Date.now();
    
    try {
      // This is a placeholder for future enhanced functionality
      // For now, it provides basic recommendations based on the analysis
      
      const analysisResult = await this.analyze(input);
      
      if (!analysisResult.success) {
        return analysisResult; // Return the error from analysis
      }

      const duration = Date.now() - startTime;
      
      return this.createSuccessResponse({
        recommendations: [
          'Include more relevant keywords from the job posting',
          'Focus on technical skills mentioned in the job description',
          'Align experience descriptions with job requirements'
        ],
        based_on_analysis: analysisResult.data,
        implementation: this.shouldUseLegacyImplementation() ? 'legacy' : 'standardized'
      }, duration);

    } catch (error) {
      const duration = Date.now() - startTime;
      return this.createErrorResponse(
        'RECOMMENDATIONS_FAILED',
        `Failed to generate recommendations: ${error.message}`,
        { originalError: error.message },
        duration
      );
    }
  }
}

module.exports = KeywordAnalysisWrapper;
