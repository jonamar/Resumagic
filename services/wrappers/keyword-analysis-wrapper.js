/**
 * Keyword Analysis Service Wrapper
 * Provides standardized JSON API over Python keyword analysis service
 * Part of Phase 2: Standardize Existing Service Infrastructure
 */

import { exec } from 'child_process';
import { promisify } from 'util';
const execAsync = promisify(exec);
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { BaseServiceWrapper } from './base-service-wrapper.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class KeywordAnalysisWrapper extends BaseServiceWrapper {
  constructor() {
    super('keyword-analysis');
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
    
    this.logOperation('analyze', {
      applicationName: input.applicationName,
      hasResumeFile: !!input.resumeFile,
      topCount: input.topCount
    });

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

      const result = await this.executeAnalysis(input, startTime);

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
   * Execute Python keyword analysis service
   * @private
   */
  async executeAnalysis(input, startTime) {
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

    try {
      const { stderr } = await execAsync(command, {
        cwd: path.resolve(__dirname, '../..'),
        timeout: 120000 // 2 minutes - ML processing takes time
      });

      if (stderr) {
        console.warn(`Keyword analysis warnings: ${stderr}`);
      }

      // Check for service output files instead of parsing stdout
      const applicationPath = path.dirname(path.dirname(input.keywordsFile));
      const outputPath = path.join(applicationPath, 'working', 'keyword_analysis.json');
      
      if (!fs.existsSync(outputPath)) {
        throw new Error(`Service failed to generate output file: ${outputPath}`);
      }
      
      const analysisData = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
      const duration = Date.now() - startTime;
      
      const implementation = 'keyword-analysis';
      
      return this.createSuccessResponse({
        analysis: analysisData,
        command: command,
        implementation: implementation
      }, duration);
      
    } catch (error) {
      const duration = Date.now() - startTime;
      throw new Error(`Keyword analysis failed: ${error.message}`);
    }
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
        implementation: 'keyword-analysis'
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

export default KeywordAnalysisWrapper;
