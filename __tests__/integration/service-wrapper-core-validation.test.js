/**
 * Core Service Wrapper Validation Suite
 * Essential tests for service wrapper functionality without problematic dependencies
 * Part of Phase 2: Standardize Existing Service Infrastructure
 */

const fs = require('fs');
const path = require('path');

// Import service wrappers directly to avoid registry dependency chain
const KeywordAnalysisWrapper = require('../../services/wrappers/keyword-analysis-wrapper');
const HiringEvaluationWrapper = require('../../services/wrappers/hiring-evaluation-wrapper');
const { BaseServiceWrapper, ServiceResponse } = require('../../services/wrappers/base-service-wrapper');

describe('Core Service Wrapper Validation', () => {
  
  describe('ServiceResponse Format', () => {
    test('should create success response with correct structure', () => {
      const response = ServiceResponse.success({ test: 'data' }, 'test-service', 100);
      
      expect(response.success).toBe(true);
      expect(response.data).toEqual({ test: 'data' });
      expect(response.metadata.service).toBe('test-service');
      expect(response.metadata.version).toBe('1.0.0');
      expect(response.metadata.duration).toBe(100);
      expect(response.metadata.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      expect(response.error).toBeUndefined();
    });

    test('should create error response with correct structure', () => {
      const response = ServiceResponse.error('TEST_ERROR', 'Test error message', 'test-service', { extra: 'info' }, 150);
      
      expect(response.success).toBe(false);
      expect(response.data).toBeUndefined();
      expect(response.metadata.service).toBe('test-service');
      expect(response.metadata.version).toBe('1.0.0');
      expect(response.metadata.duration).toBe(150);
      expect(response.metadata.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      expect(response.error.code).toBe('TEST_ERROR');
      expect(response.error.message).toBe('Test error message');
      expect(response.error.details).toEqual({ extra: 'info' });
    });
  });

  describe('BaseServiceWrapper', () => {
    let wrapper;

    beforeEach(() => {
      wrapper = new BaseServiceWrapper('test-service', 'TEST_FLAG');
    });

    test('should initialize with correct service name and flag', () => {
      expect(wrapper.serviceName).toBe('test-service');
      expect(wrapper.legacyFlagName).toBe('TEST_FLAG');
      expect(wrapper.featureFlags).toBeDefined();
    });

    test('should measure execution time correctly', async () => {
      const startTime = Date.now();
      const { result, duration } = await wrapper.measureExecutionTime(async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
        return 'test-result';
      });
      const endTime = Date.now();

      expect(result).toBe('test-result');
      expect(duration).toBeGreaterThanOrEqual(45); // Allow some margin
      expect(duration).toBeLessThanOrEqual(endTime - startTime + 10);
    });

    test('should create standardized responses', () => {
      const successResponse = wrapper.createSuccessResponse({ data: 'test' }, 100);
      expect(successResponse.success).toBe(true);
      expect(successResponse.metadata.service).toBe('test-service');

      const errorResponse = wrapper.createErrorResponse('ERROR_CODE', 'Error message', null, 200);
      expect(errorResponse.success).toBe(false);
      expect(errorResponse.error.code).toBe('ERROR_CODE');
      expect(errorResponse.metadata.service).toBe('test-service');
    });

    test('should validate input correctly', () => {
      const schema = {
        name: { type: 'string', required: true },
        age: { type: 'number', required: false }
      };

      // Valid input should not throw
      expect(() => wrapper.validateInput({ name: 'test' }, schema)).not.toThrow();
      expect(() => wrapper.validateInput({ name: 'test', age: 25 }, schema)).not.toThrow();

      // Invalid input should throw
      expect(() => wrapper.validateInput({}, schema)).toThrow('Required field \'name\' is missing');
      expect(() => wrapper.validateInput({ name: 123 }, schema)).toThrow('Field \'name\' must be of type string');
      expect(() => wrapper.validateInput(null, schema)).toThrow('Input is required');
    });
  });

  describe('KeywordAnalysisWrapper', () => {
    let wrapper;

    beforeEach(() => {
      wrapper = new KeywordAnalysisWrapper();
    });

    test('should initialize correctly', () => {
      expect(wrapper.serviceName).toBe('keyword-analysis');
      expect(wrapper.legacyFlagName).toBe('STANDARDIZED_KEYWORD_ANALYSIS');
      expect(typeof wrapper.shouldUseLegacyImplementation).toBe('function');
    });

    test('should validate required input fields', async () => {
      const response = await wrapper.analyze({});
      
      expect(response.success).toBe(false);
      expect(response.error.code).toBe('ANALYSIS_FAILED');
      expect(response.error.message).toContain('Required field');
    });

    test('should handle missing files gracefully', async () => {
      const response = await wrapper.analyze({
        applicationName: 'test-app',
        keywordsFile: '/nonexistent/keywords.json',
        jobPostingFile: '/nonexistent/job.md'
      });
      
      expect(response.success).toBe(false);
      expect(response.error.code).toBe('FILE_NOT_FOUND');
      expect(response.error.message).toContain('not found');
      expect(response.metadata.service).toBe('keyword-analysis');
      expect(response.metadata.duration).toBeGreaterThanOrEqual(0);
    });

    test('should return standardized response format', async () => {
      const response = await wrapper.analyze({
        applicationName: 'test-app',
        keywordsFile: '/nonexistent/keywords.json',
        jobPostingFile: '/nonexistent/job.md'
      });
      
      // Even for errors, should have standard format
      expect(response).toHaveProperty('success');
      expect(response).toHaveProperty('metadata');
      expect(response.metadata).toHaveProperty('service', 'keyword-analysis');
      expect(response.metadata).toHaveProperty('version');
      expect(response.metadata).toHaveProperty('duration');
      expect(response.metadata).toHaveProperty('timestamp');
      expect(response).not.toHaveProperty('data'); // Error response shouldn't have data
      expect(response).toHaveProperty('error');
    });
  });

  describe('HiringEvaluationWrapper', () => {
    let wrapper;

    beforeEach(() => {
      wrapper = new HiringEvaluationWrapper();
    });

    test('should initialize correctly', () => {
      expect(wrapper.serviceName).toBe('hiring-evaluation');
      expect(wrapper.legacyFlagName).toBe('STANDARDIZED_HIRING_EVALUATION');
    });

    test('should validate resume data structure', async () => {
      const response = await wrapper.evaluate({
        applicationName: 'test-app',
        resumeData: {} // Missing personalInfo
      });
      
      expect(response.success).toBe(false);
      expect(response.error.code).toBe('INVALID_RESUME_DATA');
      expect(response.error.message).toContain('personalInfo');
    });

    test('should handle valid resume data structure', async () => {
      const response = await wrapper.evaluate({
        applicationName: 'test-app',
        resumeData: {
          personalInfo: {
            name: 'Test User',
            email: 'test@example.com'
          }
        }
      });
      
      // Should either succeed or fail gracefully, but with proper format
      expect(response).toHaveProperty('success');
      expect(response).toHaveProperty('metadata');
      expect(response.metadata.service).toBe('hiring-evaluation');
      
      if (response.success) {
        expect(response).toHaveProperty('data');
        expect(response.data).toHaveProperty('candidate');
        expect(response.data.candidate.name).toBe('Test User');
      } else {
        expect(response).toHaveProperty('error');
        expect(response.error).toHaveProperty('code');
        expect(response.error).toHaveProperty('message');
      }
    });

    test('should handle batch evaluation input validation', async () => {
      // Test with invalid candidates array
      const response = await wrapper.batchEvaluate({
        candidates: 'not-an-array'
      });
      
      expect(response.success).toBe(false);
      expect(response.error.code).toBe('BATCH_EVALUATION_FAILED');
      expect(response.error.message).toContain('Batch evaluation failed');
    });
  });

  describe('Feature Flag Integration', () => {
    test('wrappers should respond to feature flag checks', () => {
      const keywordWrapper = new KeywordAnalysisWrapper();
      const hiringWrapper = new HiringEvaluationWrapper();
      
      // Should be able to check legacy implementation without error
      expect(typeof keywordWrapper.shouldUseLegacyImplementation()).toBe('boolean');
      expect(typeof hiringWrapper.shouldUseLegacyImplementation()).toBe('boolean');
    });
  });

  describe('Error Handling and Resilience', () => {
    test('wrappers should handle unexpected errors gracefully', async () => {
      const wrapper = new KeywordAnalysisWrapper();
      
      // Test with completely invalid input types
      const response = await wrapper.analyze('not-an-object');
      
      expect(response.success).toBe(false);
      expect(response.error).toBeDefined();
      expect(response.metadata.service).toBe('keyword-analysis');
    });

    test('should include execution timing even for errors', async () => {
      const wrapper = new KeywordAnalysisWrapper();
      
      const response = await wrapper.analyze({});
      
      expect(response.metadata.duration).toBeGreaterThanOrEqual(0);
      expect(response.metadata.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });
  });
});

describe('Integration with Existing System', () => {
  test('wrappers should not interfere with existing functionality', () => {
    // Basic smoke test - can instantiate without breaking anything
    const keywordWrapper = new KeywordAnalysisWrapper();
    const hiringWrapper = new HiringEvaluationWrapper();
    
    expect(keywordWrapper).toBeDefined();
    expect(hiringWrapper).toBeDefined();
    expect(typeof keywordWrapper.analyze).toBe('function');
    expect(typeof hiringWrapper.evaluate).toBe('function');
  });
});
