/**
 * Unit Tests for Application Registry System
 */

import { 
  discoverApplications, 
  getTestableApplications, 
  getApplication,
  validateRequiredApplications,
  generateHealthReport,
  ApplicationHealth 
} from '../helpers/application-registry.js';

describe('Application Registry', () => {
  test('should discover applications without throwing errors', () => {
    expect(() => {
      const applications = discoverApplications();
      expect(Array.isArray(applications)).toBe(true);
    }).not.toThrow();
  });

  test('should identify test applications', () => {
    const applications = discoverApplications();
    const testApps = applications.filter(app => app.type === 'test');
    
    // Should find at least test-application
    expect(testApps.length).toBeGreaterThanOrEqual(1);
    expect(testApps.some(app => app.name === 'test-application')).toBe(true);
  });

  test('should identify live applications', () => {
    const applications = discoverApplications();
    const liveApps = applications.filter(app => app.type === 'live');
    
    // Should find multiple live applications
    expect(liveApps.length).toBeGreaterThan(0);
  });

  test('should return only healthy applications for testing', () => {
    const testableApps = getTestableApplications();
    
    testableApps.forEach(app => {
      expect(app.health.status).toBe(ApplicationHealth.HEALTHY);
    });
  });

  test('should validate required applications', () => {
    // This should not throw for test-application
    expect(() => {
      validateRequiredApplications(['test-application']);
    }).not.toThrow();
    
    // This should throw for a non-existent application
    expect(() => {
      validateRequiredApplications(['non-existent-application']);
    }).toThrow();
  });

  test('should generate health report', () => {
    const report = generateHealthReport();
    
    expect(typeof report).toBe('object');
    expect(typeof report.total).toBe('number');
    expect(typeof report.healthy).toBe('number');
    expect(typeof report.testApps).toBe('number');
    expect(typeof report.liveApps).toBe('number');
    expect(Array.isArray(report.applications)).toBe(true);
    
    // Should have at least one application
    expect(report.total).toBeGreaterThan(0);
  });

  test('should get specific application', () => {
    const app = getApplication('test-application');
    
    expect(app).not.toBeNull();
    expect(app.name).toBe('test-application');
    expect(app.type).toBe('test');
    expect(app.health).toBeDefined();
  });
});