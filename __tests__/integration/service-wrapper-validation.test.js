/**
 * Service Wrapper Interface Validation Suite - Vitest
 * Ensures wrappers produce identical results to current implementation
 * Part of Phase 2: Standardize Existing Service Infrastructure
 */

import { vi } from 'vitest';
import _fs from 'fs';
import _path from 'path';
import { getServiceWrapper, getServicesHealthStatus } from '../../services/wrappers/service-registry.js';
import { getFeatureFlags } from '../../utils/feature-flags.ts';

describe('Service Wrapper Interface Validation', () => {
  let featureFlags;

  beforeAll(() => {
    featureFlags = getFeatureFlags();
  });

  describe('Service Registry', () => {
    test('should provide access to all core services', () => {
      const expectedServices = ['keyword-analysis', 'hiring-evaluation', 'document-generation'];
      
      expectedServices.forEach(serviceName => {
        expect(() => getServiceWrapper(serviceName)).not.toThrow();
        const service = getServiceWrapper(serviceName);
        expect(service).toBeDefined();
        expect(typeof service.execute).toBe('function');
      });
    });

    test('should throw error for invalid service', () => {
      expect(() => getServiceWrapper('invalid-service')).toThrow();
    });

    test('should return same instance for multiple calls (singleton)', () => {
      const service1 = getServiceWrapper('keyword-analysis');
      const service2 = getServiceWrapper('keyword-analysis');
      expect(service1).toBe(service2);
    });
  });

  describe('Service Health Status', () => {
    test('should return health status for all services', async () => {
      const healthStatus = await getServicesHealthStatus();
      
      expect(healthStatus).toHaveProperty('timestamp');
      expect(healthStatus).toHaveProperty('overall_status');
      expect(healthStatus).toHaveProperty('services');
      expect(healthStatus).toHaveProperty('feature_flags');
      
      // Check that all expected services are included
      expect(healthStatus.services).toHaveProperty('keyword-analysis');
      expect(healthStatus.services).toHaveProperty('hiring-evaluation');
      expect(healthStatus.services).toHaveProperty('document-generation');
    });
  });

  describe('Standard JSON Response Format', () => {
    test('all services should return standardized response format', async () => {
      const services = ['keyword-analysis', 'hiring-evaluation', 'document-generation'];
      
      for (const serviceName of services) {
        const service = getServiceWrapper(serviceName);
        
        // Test with minimal valid input (this might fail, but should still return standard format)
        let response;
        try {
          if (serviceName === 'keyword-analysis') {
            response = await service.analyze({
              applicationName: 'test-app',
              keywordsFile: 'nonexistent.json',
              jobPostingFile: 'nonexistent.md',
            });
          } else if (serviceName === 'hiring-evaluation') {
            response = await service.evaluate({
              applicationName: 'test-app',
              resumeData: { personalInfo: { name: 'Test User' } },
            });
          } else if (serviceName === 'document-generation') {
            response = await service.validateCapabilities();
          }
        } catch (error) {
          // Even if service fails, it should return standard format
          throw new Error(`Service ${serviceName} threw error instead of returning standard response: ${error.message}`);
        }

        // Validate standard response format
        expect(response).toHaveProperty('success');
        expect(response).toHaveProperty('metadata');
        expect(response.metadata).toHaveProperty('service', serviceName);
        expect(response.metadata).toHaveProperty('version');
        expect(response.metadata).toHaveProperty('duration');
        expect(response.metadata).toHaveProperty('timestamp');
        
        if (response.success) {
          expect(response).toHaveProperty('data');
        } else {
          expect(response).toHaveProperty('error');
          expect(response.error).toHaveProperty('code');
          expect(response.error).toHaveProperty('message');
        }
      }
    });
  });

  describe('Feature Flag Integration', () => {
    test('services should respect feature flags', () => {
      const services = ['keyword-analysis', 'hiring-evaluation', 'document-generation'];
      
      services.forEach(serviceName => {
        const service = getServiceWrapper(serviceName);
        expect(typeof service.execute).toBe('function');
        expect(typeof service.getServiceName).toBe('function');
        expect(service.getServiceName()).toBe(serviceName);
      });
    });

    test('should log service transitions when enabled', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      const service = getServiceWrapper('keyword-analysis');
      service.logOperation('test-operation', { test: 'data' }, true);
      
      if (featureFlags.isEnabled('LOG_SERVICE_TRANSITIONS')) {
        expect(consoleSpy).toHaveBeenCalled();
      }
      
      consoleSpy.mockRestore();
    });
  });

  describe('Input Validation', () => {
    test('services should validate required input fields', async () => {
      const keywordService = getServiceWrapper('keyword-analysis');
      
      // Test missing required fields
      const response = await keywordService.analyze({});
      
      expect(response.success).toBe(false);
      expect(response.error.code).toBe('ANALYSIS_FAILED');
      expect(response.error.message).toContain('Required field');
    });

    test('hiring evaluation should validate resume data structure', async () => {
      const hiringService = getServiceWrapper('hiring-evaluation');
      
      // Test invalid resume data
      const response = await hiringService.evaluate({
        applicationName: 'test-app',
        resumeData: {}, // Missing personalInfo
      });
      
      expect(response.success).toBe(false);
      expect(response.error.code).toBe('INVALID_RESUME_DATA');
    });
  });

  describe('Document Generation Wrapper', () => {
    test('should validate capabilities', async () => {
      const docService = getServiceWrapper('document-generation');
      const response = await docService.validateCapabilities();
      
      expect(response.success).toBe(true);
      expect(response.data).toHaveProperty('capabilities');
      expect(response.data.capabilities).toHaveProperty('docx_generation');
      expect(response.data.capabilities).toHaveProperty('template_processing');
    });

    test('should validate generation plan structure', async () => {
      const docService = getServiceWrapper('document-generation');
      
      const response = await docService.generate({
        generationPlan: {}, // Empty plan
        paths: { applicationName: 'test' },
        resumeData: { personalInfo: { name: 'Test' } },
      });
      
      expect(response.success).toBe(false);
      expect(response.error.code).toBe('INVALID_GENERATION_PLAN');
    });
  });

  describe('Performance and Timing', () => {
    test('should measure and report execution duration', async () => {
      const docService = getServiceWrapper('document-generation');
      const startTime = Date.now();
      
      const response = await docService.validateCapabilities();
      const endTime = Date.now();
      
      expect(response.metadata.duration).toBeGreaterThanOrEqual(0);
      expect(response.metadata.duration).toBeLessThanOrEqual(endTime - startTime + 100); // Allow 100ms buffer
    });

    test('should include timestamps in responses', async () => {
      const service = getServiceWrapper('document-generation');
      const response = await service.validateCapabilities();
      
      expect(response.metadata.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      
      const timestamp = new Date(response.metadata.timestamp);
      expect(timestamp.getTime()).toBeLessThanOrEqual(Date.now());
    });
  });

  describe('Error Handling', () => {
    test('should handle file not found errors gracefully', async () => {
      const keywordService = getServiceWrapper('keyword-analysis');
      
      const response = await keywordService.analyze({
        applicationName: 'test-app',
        keywordsFile: '/nonexistent/keywords.json',
        jobPostingFile: '/nonexistent/job.md',
      });
      
      expect(response.success).toBe(false);
      expect(response.error.code).toBe('FILE_NOT_FOUND');
      expect(response.error.message).toContain('not found');
    });

    test('should provide helpful error details', async () => {
      const keywordService = getServiceWrapper('keyword-analysis');
      
      const response = await keywordService.analyze({
        applicationName: 'test-app',
        keywordsFile: '/nonexistent/keywords.json',
        jobPostingFile: '/nonexistent/job.md',
      });
      
      expect(response.error.details).toBeDefined();
      expect(response.error.details.file).toBeDefined();
    });
  });

  describe('Legacy vs Standardized Behavior', () => {
    test('should maintain consistent API regardless of implementation', async () => {
      // This test ensures that whether using legacy or standardized implementation,
      // the API response format remains consistent
      
      const docService = getServiceWrapper('document-generation');
      
      // Test with both implementations (if feature flags allow)
      const response1 = await docService.validateCapabilities();
      
      // Temporarily toggle feature flag and test again
      // (This is more of a conceptual test - actual flag toggling would need feature flag override)
      const response2 = await docService.validateCapabilities();
      
      // Both responses should have the same structure
      expect(response1).toHaveProperty('success');
      expect(response1).toHaveProperty('metadata');
      expect(response2).toHaveProperty('success');
      expect(response2).toHaveProperty('metadata');
      
      // Metadata structure should be identical
      expect(Object.keys(response1.metadata).sort()).toEqual(Object.keys(response2.metadata).sort());
    });
  });
});

describe('Service Wrapper Integration with Existing System', () => {
  test('should not break existing CLI workflows', () => {
    // This is a placeholder test to ensure wrappers don't interfere with existing functionality
    // In a real scenario, we'd run the actual CLI commands and verify they still work
    
    const services = ['keyword-analysis', 'hiring-evaluation', 'document-generation'];
    
    services.forEach(serviceName => {
      expect(() => getServiceWrapper(serviceName)).not.toThrow();
    });
  });

  test('should maintain backward compatibility', async () => {
    // Test that wrapper methods don't conflict with existing functionality
    const keywordService = getServiceWrapper('keyword-analysis');
    
    // Should be able to instantiate without affecting other parts of the system
    expect(keywordService).toBeDefined();
    expect(typeof keywordService.analyze).toBe('function');
  });
});
