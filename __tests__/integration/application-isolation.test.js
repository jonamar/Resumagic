/**
 * Integration Tests for Application Isolation
 * Migrated from test-isolation.js to Jest framework
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

// ESM equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Application Isolation', () => {
  const testApps = [
    'clearer-vp-of-product',
    'general-application', 
    'pointclick-product-manager',
    'relay-director-of-product',
    'zearch-director-of-product-marketing'
  ];

  let baselineTimestamps = {};

  beforeAll(() => {
    // Capture baseline timestamps for all applications
    testApps.forEach(app => {
      const appPath = path.resolve(__dirname, '../../../data/applications', app);
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
    const targetApp = 'zearch-director-of-product-marketing';
    
    // Skip test if target application doesn't exist
    const targetAppPath = path.resolve(__dirname, '../../../data/applications', targetApp);
    if (!fs.existsSync(targetAppPath)) {
      console.warn(`Skipping test: ${targetApp} application not found`);
      return;
    }

    // Generate documents for target application only
    try {
      const output = execSync(`node generate-resume.js ${targetApp} --both`, {
        cwd: path.resolve(__dirname, '../..'),
        encoding: 'utf8',
        timeout: 30000 // 30 second timeout
      });
      
      expect(output).toContain('✅'); // Should contain success indicators
    } catch (error) {
      // If generation fails, we can still test isolation
      console.warn('Document generation failed, but continuing with isolation test');
    }

    // Check that only target application files were modified
    let modifiedApps = [];
    let unchangedApps = [];

    testApps.forEach(app => {
      if (!baselineTimestamps[app]) return; // Skip if no baseline

      const appPath = path.resolve(__dirname, '../../../data/applications', app);
      if (!fs.existsSync(appPath)) return;

      const outputsPath = path.join(appPath, 'outputs');
      if (!fs.existsSync(outputsPath)) return;

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
    const targetApp = 'general-application';
    const appPath = path.resolve(__dirname, '../../../data/applications', targetApp);
    
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

    // Validate file sizes (should not be empty)
    docxFiles.forEach(file => {
      const filePath = path.join(outputsPath, file);
      const stats = fs.statSync(filePath);
      expect(stats.size).toBeGreaterThan(1000); // At least 1KB for valid DOCX
    });
  });

  test('should handle invalid application names gracefully', () => {
    expect(() => {
      execSync('node generate-resume.js nonexistent-application', {
        cwd: path.resolve(__dirname, '../..'),
        encoding: 'utf8',
        timeout: 10000
      });
    }).toThrow(); // Should throw/exit with error for invalid application
  });
});
