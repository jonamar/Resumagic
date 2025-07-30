/**
 * Direct Keyword Analysis Service
 * Provides typed, direct function for keyword analysis without wrapper abstraction
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { KeywordAnalysis, KeywordAnalysisInput } from '../types/services';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Analyze keywords for a job application
 * @param applicationName - Name of the application
 * @param keywordsFile - Path to keywords.json file
 * @param jobPostingFile - Path to job-posting.md file  
 * @param resumeFile - Optional path to resume.json file
 * @returns Promise resolving to keyword analysis results
 */
export async function analyzeKeywords(
  applicationName: string,
  keywordsFile: string,
  jobPostingFile: string,
  resumeFile?: string
): Promise<KeywordAnalysis> {
  const input = { applicationName, keywordsFile, jobPostingFile, resumeFile };
  // Validate input
  if (!input.applicationName || typeof input.applicationName !== 'string') {
    throw new Error('applicationName is required and must be a string');
  }
  if (!input.keywordsFile || typeof input.keywordsFile !== 'string') {
    throw new Error('keywordsFile is required and must be a string');
  }
  if (!input.jobPostingFile || typeof input.jobPostingFile !== 'string') {
    throw new Error('jobPostingFile is required and must be a string');
  }

  // Check file existence
  if (!fs.existsSync(input.keywordsFile)) {
    throw new Error(`Keywords file not found: ${input.keywordsFile}`);
  }

  if (!fs.existsSync(input.jobPostingFile)) {
    throw new Error(`Job posting file not found: ${input.jobPostingFile}`);
  }

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
      cwd: path.resolve(__dirname, '..'),
      timeout: 120000, // 2 minutes - ML processing takes time
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
    
    // Transform the output to match the expected interface
    return {
      keywords: analysisData.keywords || [],
      topSkills: analysisData.top_skills || analysisData.topSkills || [],
      applicationName: input.applicationName,
      analysis: {
        matched_keywords: analysisData.matched_keywords,
        missing_keywords: analysisData.missing_keywords,
        keyword_scores: analysisData.keyword_scores,
        recommendations: analysisData.recommendations,
        ...analysisData
      }
    };
    
  } catch (error) {
    throw new Error(`Keyword analysis failed: ${error.message}`);
  }
}

/**
 * Get analysis recommendations based on keywords
 * @param input - Analysis input parameters
 * @returns Promise resolving to analysis with recommendations
 */
export async function getKeywordRecommendations(input: KeywordAnalysisInput): Promise<KeywordAnalysis> {
  const analysisResult = await analyzeKeywords(input);
  
  // Add basic recommendations if not already present
  if (!analysisResult.analysis?.recommendations) {
    analysisResult.analysis = {
      ...analysisResult.analysis,
      recommendations: [
        'Include more relevant keywords from the job posting',
        'Focus on technical skills mentioned in the job description',
        'Align experience descriptions with job requirements',
      ]
    };
  }
  
  return analysisResult;
}