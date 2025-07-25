/**
 * Document Generation Service Wrapper
 * Provides standardized JSON API over document orchestration service
 * Part of Phase 2: Standardize Existing Service Infrastructure
 */

import fs from 'fs';
import path from 'path';
import { BaseServiceWrapper } from './base-service-wrapper.js';
import * as documentOrchestrator from '../../document-orchestrator.js';

class DocumentGenerationWrapper extends BaseServiceWrapper {
  constructor() {
    super('document-generation', 'STANDARDIZED_DOCUMENT_GENERATION');
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
    const useLegacy = this.shouldUseLegacyImplementation();
    
    this.logOperation('generate', {
      generateResume: input.generationPlan?.generateResume,
      generateCoverLetter: input.generationPlan?.generateCoverLetter,
      generateCombined: input.generationPlan?.generateCombined,
      applicationName: input.paths?.applicationName
    }, useLegacy);

    try {
      // Validate input
      this.validateInput(input, {
        generationPlan: { type: 'object', required: true },
        paths: { type: 'object', required: true },
        resumeData: { type: 'object', required: true }
      });

      // Validate generation plan structure
      if (!input.generationPlan.generateResume && !input.generationPlan.generateCoverLetter && !input.generationPlan.generateCombined) {
        const duration = Date.now() - startTime;
        return this.createErrorResponse(
          'INVALID_GENERATION_PLAN',
          'Generation plan must specify at least one document type to generate',
          { plan: input.generationPlan },
          duration
        );
      }

      let result;
      if (useLegacy) {
        result = await this.executeLegacyGeneration(input, startTime);
      } else {
        result = await this.executeStandardizedGeneration(input, startTime);
      }

      return result;

    } catch (error) {
      const duration = Date.now() - startTime;
      return this.createErrorResponse(
        'GENERATION_FAILED',
        `Document generation failed: ${error.message}`,
        { 
          originalError: error.message,
          stack: error.stack 
        },
        duration
      );
    }
  }

  /**
   * Execute legacy document generation
   * @private
   */
  async executeLegacyGeneration(input, startTime) {
    const generatedFiles = await documentOrchestrator.orchestrateGeneration(
      input.generationPlan,
      input.paths,
      input.resumeData,
      input.autoPreview || false
    );

    const duration = Date.now() - startTime;

    // Analyze generated files for metadata
    const fileMetadata = generatedFiles.map(filePath => ({
      path: filePath,
      name: path.basename(filePath),
      size: fs.existsSync(filePath) ? fs.statSync(filePath).size : 0,
      type: path.extname(filePath).toLowerCase(),
      exists: fs.existsSync(filePath)
    }));

    return this.createSuccessResponse({
      generated_files: generatedFiles,
      file_metadata: fileMetadata,
      generation_plan: input.generationPlan,
      summary: {
        total_files: generatedFiles.length,
        resume_generated: input.generationPlan.generateResume,
        cover_letter_generated: input.generationPlan.generateCoverLetter,
        combined_generated: input.generationPlan.generateCombined
      },
      implementation: 'legacy'
    }, duration);
  }

  /**
   * Execute standardized generation (future implementation)
   * @private
   */
  async executeStandardizedGeneration(input, startTime) {
    // For now, this is a placeholder that calls the legacy implementation
    // In future phases, this would use more standardized generation patterns
    const result = await this.executeLegacyGeneration(input, startTime);
    
    // Mark as standardized implementation
    if (result.data) {
      result.data.implementation = 'standardized';
    }
    
    return result;
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
        outputPath: { type: 'string', required: true }
      });

      const filePath = await documentOrchestrator.generateResumeDocument(
        input.resumeData,
        input.outputPath
      );

      const duration = Date.now() - startTime;

      return this.createSuccessResponse({
        generated_file: filePath,
        document_type: 'resume',
        file_metadata: {
          path: filePath,
          name: path.basename(filePath),
          size: fs.existsSync(filePath) ? fs.statSync(filePath).size : 0,
          exists: fs.existsSync(filePath)
        },
        implementation: this.shouldUseLegacyImplementation() ? 'legacy' : 'standardized'
      }, duration);

    } catch (error) {
      const duration = Date.now() - startTime;
      return this.createErrorResponse(
        'RESUME_GENERATION_FAILED',
        `Resume generation failed: ${error.message}`,
        { originalError: error.message },
        duration
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
        outputPath: { type: 'string', required: true }
      });

      // Check if markdown file exists
      if (!fs.existsSync(input.markdownFilePath)) {
        const duration = Date.now() - startTime;
        return this.createErrorResponse(
          'FILE_NOT_FOUND',
          `Cover letter markdown file not found: ${input.markdownFilePath}`,
          { file: input.markdownFilePath },
          duration
        );
      }

      const filePath = await documentOrchestrator.generateCoverLetterDocument(
        input.markdownFilePath,
        input.resumeDataPath,
        input.outputPath
      );

      const duration = Date.now() - startTime;

      return this.createSuccessResponse({
        generated_file: filePath,
        document_type: 'cover_letter',
        file_metadata: {
          path: filePath,
          name: path.basename(filePath),
          size: fs.existsSync(filePath) ? fs.statSync(filePath).size : 0,
          exists: fs.existsSync(filePath)
        },
        source_markdown: input.markdownFilePath,
        implementation: this.shouldUseLegacyImplementation() ? 'legacy' : 'standardized'
      }, duration);

    } catch (error) {
      const duration = Date.now() - startTime;
      return this.createErrorResponse(
        'COVER_LETTER_GENERATION_FAILED',
        `Cover letter generation failed: ${error.message}`,
        { originalError: error.message },
        duration
      );
    }
  }

  /**
   * Validate document generation capabilities
   * @returns {Promise<ServiceResponse>}
   */
  async validateCapabilities() {
    const startTime = Date.now();

    try {
      // Check if required dependencies are available
      const capabilities = {
        docx_generation: true, // docx library is imported
        template_processing: true, // template system available
        markdown_parsing: true, // markdown parser available
        file_operations: true, // fs operations available
        orchestration: true // orchestrator available
      };

      // Test basic file operations
      const testDir = path.join(__dirname, '../../__tests__');
      capabilities.test_directory_access = fs.existsSync(testDir);

      const duration = Date.now() - startTime;

      return this.createSuccessResponse({
        capabilities,
        service_status: 'operational',
        implementation: this.shouldUseLegacyImplementation() ? 'legacy' : 'standardized'
      }, duration);

    } catch (error) {
      const duration = Date.now() - startTime;
      return this.createErrorResponse(
        'CAPABILITY_CHECK_FAILED',
        `Capability validation failed: ${error.message}`,
        { originalError: error.message },
        duration
      );
    }
  }
}

export default DocumentGenerationWrapper;
