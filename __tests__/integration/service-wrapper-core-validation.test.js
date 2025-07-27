/**
 * Core Service Wrapper Validation Suite
 * Essential tests for service wrapper functionality without problematic dependencies
 * Part of Phase 2: Standardize Existing Service Infrastructure
 */

import _fs from 'fs';
import _path from 'path';

// Import service wrappers directly to avoid registry dependency chain
import KeywordAnalysisWrapper from '../../services/wrappers/keyword-analysis-wrapper.js';
import HiringEvaluationWrapper from '../../services/wrappers/hiring-evaluation-wrapper.js';
import { BaseServiceWrapper, ServiceResponse } from '../../services/wrappers/base-service-wrapper.js';

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
      wrapper = new BaseServiceWrapper('test-service');
    });

    test('should initialize with correct service name', () => {
      expect(wrapper.serviceName).toBe('test-service');
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
      expect(typeof wrapper.analyze).toBe('function');
      expect(typeof wrapper.getServiceName).toBe('function');
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
      expect(typeof wrapper.evaluate).toBe('function');
      expect(typeof wrapper.getServiceName).toBe('function');
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

    test('should properly instantiate and call evaluation service', async () => {
      const wrapper = new HiringEvaluationWrapper();
      
      const response = await wrapper.evaluate({
        applicationName: 'test-validation',
        resumeData: {
          personalInfo: {
            name: 'Test Candidate',
            email: 'test@example.com'
          }
        }
      });
      
      // Should either succeed with proper service call or fail with clear error
      expect(response).toHaveProperty('success');
      expect(response.metadata.service).toBe('hiring-evaluation');
      expect(response.metadata.duration).toBeLessThan(5000); // Should be fast
      
      if (response.success) {
        expect(response.data.candidate.name).toBe('Test Candidate');
        expect(response.data.implementation).toMatch(/^(legacy|standardized)$/);
      } else {
        // Should have proper error code, not fallback simulation
        expect(response.error.code).toMatch(/^(LEGACY_EVALUATION_FAILED|STANDARDIZED_EVALUATION_FAILED|INVALID_RESUME_DATA)$/);
        expect(response.error.message).not.toContain('Unable to complete full evaluation');
      }
    });
    
    test('should handle service instantiation errors properly', async () => {
      // This test would require mocking the import to fail
      // For now, we test that the wrapper doesn't use fallback simulation
      const wrapper = new HiringEvaluationWrapper();
      
      const response = await wrapper.evaluate({
        applicationName: 'nonexistent-application',
        resumeData: { personalInfo: { name: 'Test' } }
      });
      
      // Should either succeed or fail with proper error, not fallback
      if (!response.success) {
        expect(response.error.code).toMatch(/STANDARDIZED_EVALUATION_FAILED$/);
        expect(response.error.message).not.toContain('temporarily unavailable');
        expect(response.error.message).not.toContain('fallback validation');
      }
    });
  });

  describe('Service Integration', () => {
    test('wrappers should integrate properly with base class', () => {
      const keywordWrapper = new KeywordAnalysisWrapper();
      const hiringWrapper = new HiringEvaluationWrapper();
      
      // Should extend BaseServiceWrapper correctly
      expect(keywordWrapper.serviceName).toBe('keyword-analysis');
      expect(hiringWrapper.serviceName).toBe('hiring-evaluation');
      expect(typeof keywordWrapper.getServiceName).toBe('function');
      expect(typeof hiringWrapper.getServiceName).toBe('function');
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
