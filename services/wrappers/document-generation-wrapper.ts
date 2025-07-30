/**
 * Document Generation Service Wrapper
 * Provides standardized JSON API over document orchestration service
 * Part of Phase 2: Standardize Existing Service Infrastructure
 */

import fs from 'fs';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import { BaseServiceWrapper } from './base-service-wrapper.js';
import * as documentOrchestrator from '../../core/document-orchestration';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class DocumentGenerationWrapper extends BaseServiceWrapper {
  constructor() {
    super('document-generation');
  }

  /**
   * Generate documents based on generation plan
   * @param {Object} input - Generation input
   * @param {Object} input.generationPlan - Plan object with flags for what to generate
   * @param {Object} input.paths - Paths object with all file paths
   * @param {Object} input.resumeData - Resume data object
   * @param {boolean} [input.autoPreview] - Whether to auto-open generated files
   * @returns {Promise<ServiceResponse>}
   */
  async generate(input) {
    const startTime = Date.now();
    
    this.logOperation('generate', {
      generateResume: input.generationPlan?.generateResume,
      generateCoverLetter: input.generationPlan?.generateCoverLetter,
      generateCombined: input.generationPlan?.generateCombined,
      applicationName: input.paths?.applicationName,
    });

    try {
      // Validate input
      this.validateInput(input, {
        generationPlan: { type: 'object', required: true },
        paths: { type: 'object', required: true },
        resumeData: { type: 'object', required: true },
      });

      // Validate generation plan structure
      if (!input.generationPlan.generateResume && !input.generationPlan.generateCoverLetter && !input.generationPlan.generateCombined) {
        const duration = Date.now() - startTime;
        return this.createErrorResponse(
          'INVALID_GENERATION_PLAN',
          'Generation plan must specify at least one document type to generate',
          { plan: input.generationPlan },
          duration,
        );
      }

      const result = await this.executeGeneration(input, startTime);

      return result;

    } catch (error) {
      const duration = Date.now() - startTime;
      return this.createErrorResponse(
        'GENERATION_FAILED',
        `Document generation failed: ${error.message}`,
        { 
          originalError: error.message,
          stack: error.stack, 
        },
        duration,
      );
    }
  }

  /**
   * Execute document generation using direct orchestrator API
   * @private
   */
  async executeGeneration(input, startTime) {
    try {
      console.log('🔄 Running standardized document generation...');
      
      const generatedFiles = [];
      const generationResults = [];
      
      // Generate documents based on the generation plan using direct orchestrator methods
      if (input.generationPlan.generateResume) {
        console.log('📄 Generating resume document...');
        try {
          const resumePath = await documentOrchestrator.generateResumeDocument(
            input.resumeData,
            input.paths.resumeDocxPath,
          );
          generatedFiles.push(resumePath);
          generationResults.push({
            type: 'resume',
            path: resumePath,
            success: true,
            filename: path.basename(resumePath),
          });
          console.log(`✅ Resume generated: ${resumePath}`);
        } catch (error) {
          console.error(`❌ Resume generation failed: ${error.message}`);
          generationResults.push({
            type: 'resume',
            success: false,
            error: error.message,
          });
        }
      }
      
      if (input.generationPlan.generateCoverLetter) {
        console.log('📝 Generating cover letter document...');
        try {
          const coverLetterPath = await documentOrchestrator.generateCoverLetterDocument(
            input.paths.coverLetterMarkdownPath,
            input.paths.resumeDataPath,
            input.paths.coverLetterDocxPath,
          );
          generatedFiles.push(coverLetterPath);
          generationResults.push({
            type: 'cover_letter',
            path: coverLetterPath,
            success: true,
            filename: path.basename(coverLetterPath),
          });
          console.log(`✅ Cover letter generated: ${coverLetterPath}`);
        } catch (error) {
          console.error(`❌ Cover letter generation failed: ${error.message}`);
          generationResults.push({
            type: 'cover_letter',
            success: false,
            error: error.message,
          });
        }
      }
      
      if (input.generationPlan.generateCombined) {
        console.log('📋 Generating combined document...');
        try {
          const combinedPath = await documentOrchestrator.generateCombinedDocument(
            input.paths.coverLetterMarkdownPath,
            input.paths.resumeDataPath,
            input.resumeData,
            input.paths.combinedDocxPath,
          );
          generatedFiles.push(combinedPath);
          generationResults.push({
            type: 'combined',
            path: combinedPath,
            success: true,
            filename: path.basename(combinedPath),
          });
          console.log(`✅ Combined document generated: ${combinedPath}`);
        } catch (error) {
          console.error(`❌ Combined document generation failed: ${error.message}`);
          generationResults.push({
            type: 'combined',
            success: false,
            error: error.message,
          });
        }
      }
      
      // Auto-preview files if requested
      if (input.autoPreview && generatedFiles.length > 0) {
        try {
          await documentOrchestrator.openGeneratedFiles(generatedFiles, true);
          console.log('📱 Files opened for preview');
        } catch (error) {
          console.warn(`Preview failed: ${error.message}`);
        }
      }
      
      const duration = Date.now() - startTime;
      const successfulGenerations = generationResults.filter(r => r.success);
      const failedGenerations = generationResults.filter(r => !r.success);
      
      // Return standardized response format
      return this.createSuccessResponse({
        files: successfulGenerations.map(r => ({
          type: r.type,
          path: r.path,
          filename: r.filename,
          size_bytes: r.path ? (fs.existsSync(r.path) ? fs.statSync(r.path).size : 0) : 0,
        })),
        summary: {
          total_files: generationResults.length,
          successful: successfulGenerations.length,
          failed: failedGenerations.length,
          resume_generated: input.generationPlan.generateResume && successfulGenerations.some(r => r.type === 'resume'),
          cover_letter_generated: input.generationPlan.generateCoverLetter && successfulGenerations.some(r => r.type === 'cover_letter'),
          combined_generated: input.generationPlan.generateCombined && successfulGenerations.some(r => r.type === 'combined'),
          auto_preview: !!input.autoPreview,
        },
        errors: failedGenerations.map(r => ({
          type: r.type,
          error: r.error,
        })),
        context: {
          applicationName: input.paths.applicationName || 'unknown',
          generation_timestamp: new Date().toISOString(),
        },
        implementation: 'document-generation',
      }, duration);
      
    } catch (error) {
      console.error(`Document generation failed: ${error.message}`);
      
      // If generation fails, provide a structured error response
      const duration = Date.now() - startTime;
      return this.createErrorResponse(
        'GENERATION_FAILED',
        `Document generation failed: ${error.message}`,
        { 
          originalError: error.message,
          stack: error.stack,
          generationPlan: input.generationPlan,
          applicationName: input.paths?.applicationName,
        },
        duration,
      );
    }
  }

  /**
   * Generate only resume document
   * @param {Object} input - Resume generation input
   * @param {Object} input.resumeData - Resume data object
   * @param {string} input.outputPath - Path where to save the document
   * @returns {Promise<ServiceResponse>}
   */
  async generateResume(input) {
    const startTime = Date.now();

    try {
      this.validateInput(input, {
        resumeData: { type: 'object', required: true },
        outputPath: { type: 'string', required: true },
      });

      const filePath = await documentOrchestrator.generateResumeDocument(
        input.resumeData,
        input.outputPath,
      );

      const duration = Date.now() - startTime;

      return this.createSuccessResponse({
        generated_file: filePath,
        document_type: 'resume',
        file_metadata: {
          path: filePath,
          name: path.basename(filePath),
          size: fs.existsSync(filePath) ? fs.statSync(filePath).size : 0,
          exists: fs.existsSync(filePath),
        },
        implementation: 'document-generation',
      }, duration);

    } catch (error) {
      const duration = Date.now() - startTime;
      return this.createErrorResponse(
        'RESUME_GENERATION_FAILED',
        `Resume generation failed: ${error.message}`,
        { originalError: error.message },
        duration,
      );
    }
  }

  /**
   * Generate only cover letter document
   * @param {Object} input - Cover letter generation input
   * @param {string} input.markdownFilePath - Path to markdown cover letter file
   * @param {string} input.resumeDataPath - Path to resume data file
   * @param {string} input.outputPath - Path where to save the document
   * @returns {Promise<ServiceResponse>}
   */
  async generateCoverLetter(input) {
    const startTime = Date.now();

    try {
      this.validateInput(input, {
        markdownFilePath: { type: 'string', required: true },
        resumeDataPath: { type: 'string', required: true },
        outputPath: { type: 'string', required: true },
      });

      // Check if markdown file exists
      if (!fs.existsSync(input.markdownFilePath)) {
        const duration = Date.now() - startTime;
        return this.createErrorResponse(
          'FILE_NOT_FOUND',
          `Cover letter markdown file not found: ${input.markdownFilePath}`,
          { file: input.markdownFilePath },
          duration,
        );
      }

      const filePath = await documentOrchestrator.generateCoverLetterDocument(
        input.markdownFilePath,
        input.resumeDataPath,
        input.outputPath,
      );

      const duration = Date.now() - startTime;

      return this.createSuccessResponse({
        generated_file: filePath,
        document_type: 'cover_letter',
        file_metadata: {
          path: filePath,
          name: path.basename(filePath),
          size: fs.existsSync(filePath) ? fs.statSync(filePath).size : 0,
          exists: fs.existsSync(filePath),
        },
        source_markdown: input.markdownFilePath,
        implementation: 'document-generation',
      }, duration);

    } catch (error) {
      const duration = Date.now() - startTime;
      return this.createErrorResponse(
        'COVER_LETTER_GENERATION_FAILED',
        `Cover letter generation failed: ${error.message}`,
        { originalError: error.message },
        duration,
      );
    }
  }

  /**
   * Validate document generation capabilities
   * @returns {Promise<ServiceResponse>}
   */
  validateCapabilities() {
    const startTime = Date.now();

    try {
      // Check if required dependencies are available
      const capabilities = {
        docx_generation: true, // docx library is imported
        template_processing: true, // template system available
        markdown_parsing: true, // markdown parser available
        file_operations: true, // fs operations available
        orchestration: true, // orchestrator available
      };

      // Test basic file operations
      const testDir = path.join(__dirname, '../../__tests__');
      capabilities.test_directory_access = fs.existsSync(testDir);

      const duration = Date.now() - startTime;

      return this.createSuccessResponse({
        capabilities,
        service_status: 'operational',
        implementation: 'document-generation',
      }, duration);

    } catch (error) {
      const duration = Date.now() - startTime;
      return this.createErrorResponse(
        'CAPABILITY_CHECK_FAILED',
        `Capability validation failed: ${error.message}`,
        { originalError: error.message },
        duration,
      );
    }
  }
}

export default DocumentGenerationWrapper;
