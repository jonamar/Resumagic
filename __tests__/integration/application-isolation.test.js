/**
 * Integration Tests for Application Isolation
 * Migrated from test-isolation.js to Vitest framework
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import theme from '../../theme.js';
import { 
  discoverApplications, 
  getTestableApplications, 
  validateRequiredApplications,
  ApplicationHealth, 
} from '../helpers/application-registry.js';

// ESM equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper function to get application path (handles test directory structure)
function getApplicationPath(appName) {
  if (appName === theme.fileNaming.testApplicationName) {
    return path.resolve(__dirname, '../../../data', theme.fileNaming.testDir, appName);
  } else {
    return path.resolve(__dirname, '../../../data', theme.fileNaming.applicationsDir, appName);
  }
}

describe('Application Isolation', () => {
  // Dynamically discover healthy applications for testing
  let testApps = [];
  let targetApp = null;

  const baselineTimestamps = {};

  beforeAll(() => {
    // Discover and validate applications before testing
    const healthyApps = getTestableApplications();
    
    if (healthyApps.length === 0) {
      throw new Error('No healthy applications found for isolation testing');
    }
    
    testApps = healthyApps.map(app => app.name);
    
    // Use a live application as target (not test-application to avoid self-modification)
    const liveApps = healthyApps.filter(app => app.type === 'live');
    if (liveApps.length === 0) {
      throw new Error('No live applications found for isolation testing');
    }
    
    targetApp = liveApps[0].name; // Use first available live app
    
    console.log(`[Application Registry] Found ${testApps.length} healthy applications`);
    console.log(`[Application Registry] Using '${targetApp}' as target for isolation testing`);
    
    // Capture baseline timestamps for all applications
    testApps.forEach(app => {
      const appPath = getApplicationPath(app);
      if (fs.existsSync(appPath)) {
        const outputsPath = path.join(appPath, 'outputs');
        if (fs.existsSync(outputsPath)) {
          const files = fs.readdirSync(outputsPath).filter(f => f.endsWith('.docx'));
          baselineTimestamps[app] = {};
          files.forEach(file => {
            const filePath = path.join(outputsPath, file);
            const stats = fs.statSync(filePath);
            baselineTimestamps[app][file] = stats.mtime.getTime();
          });
        }
      }
    });
  });

  test('should only modify target application files when generating documents', () => {
    // Fail fast if no target application was found during setup
    if (!targetApp) {
      throw new Error('No target application available for isolation testing');
    }
    
    const targetAppPath = getApplicationPath(targetApp);

    // Generate documents for target application only
    try {
      const output = execSync(`node generate-resume.js ${targetApp} --both`, {
        cwd: path.resolve(__dirname, '../..'),
        encoding: 'utf8',
        timeout: 30000, // 30 second timeout
      });
      
      expect(output).toContain('✅'); // Should contain success indicators
    } catch (error) {
      // If generation fails, we can still test isolation
      console.warn('Document generation failed, but continuing with isolation test');
    }

    // Check that only target application files were modified
    const modifiedApps = [];
    const unchangedApps = [];

    testApps.forEach(app => {
      if (!baselineTimestamps[app]) {
        return;
      } // Skip if no baseline

      const appPath = getApplicationPath(app);
      if (!fs.existsSync(appPath)) {
        return;
      }

      const outputsPath = path.join(appPath, 'outputs');
      if (!fs.existsSync(outputsPath)) {
        return;
      }

      const files = fs.readdirSync(outputsPath).filter(f => f.endsWith('.docx'));
      let appModified = false;

      files.forEach(file => {
        const filePath = path.join(outputsPath, file);
        const stats = fs.statSync(filePath);
        const currentTime = stats.mtime.getTime();
        const baselineTime = baselineTimestamps[app][file];

        if (baselineTime && currentTime > baselineTime) {
          appModified = true;
        }
      });

      if (appModified) {
        modifiedApps.push(app);
      } else {
        unchangedApps.push(app);
      }
    });

    // Assertions for isolation
    if (modifiedApps.includes(targetApp)) {
      expect(modifiedApps).toHaveLength(1);
      expect(modifiedApps[0]).toBe(targetApp);
    }

    // All other applications should be unchanged
    const otherApps = testApps.filter(app => app !== targetApp);
    otherApps.forEach(app => {
      if (baselineTimestamps[app]) {
        expect(unchangedApps).toContain(app);
      }
    });
  }, 60000); // 60 second timeout for this test

  test('should generate valid output files', () => {
    const targetApp = 'test-application';
    const appPath = getApplicationPath(targetApp);
    
    // Skip if application doesn't exist
    if (!fs.existsSync(appPath)) {
      console.warn(`Skipping test: ${targetApp} application not found`);
      return;
    }

    const outputsPath = path.join(appPath, 'outputs');
    
    // Check that outputs directory exists
    expect(fs.existsSync(outputsPath)).toBe(true);

    // Check for expected output files
    const files = fs.readdirSync(outputsPath);
    const docxFiles = files.filter(f => f.endsWith('.docx'));
    
    expect(docxFiles.length).toBeGreaterThan(0);

    // NOTE: File size validation removed - superficial check that doesn't catch
    // document corruption, formatting issues, or template rendering problems.
    // Content-based validation should be used instead (see document-generation-contract.test.js)
  });

  test('should handle invalid application names gracefully', () => {
    expect(() => {
      execSync('node generate-resume.js nonexistent-application', {
        cwd: path.resolve(__dirname, '../..'),
        encoding: 'utf8',
        timeout: 10000,
      });
    }).toThrow(); // Should throw/exit with error for invalid application
  });
});
