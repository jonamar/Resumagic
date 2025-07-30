/**
 * Application Registry and Discovery System
 * Provides dynamic discovery of test applications with health validation
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import theme from '../../theme';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Application health status
 */
export const ApplicationHealth = {
  HEALTHY: 'healthy',
  MISSING: 'missing',
  INCOMPLETE: 'incomplete',
  ERROR: 'error',
};

/**
 * Discovers all available applications with health checks
 * @returns {Array} Array of application objects with metadata
 */
export function discoverApplications() {
  const applications = [];
  const dataDir = path.resolve(__dirname, '../../../data');
  
  // Discover test applications
  const testDir = path.join(dataDir, theme.fileNaming.testDir);
  if (fs.existsSync(testDir)) {
    const testApps = fs.readdirSync(testDir)
      .filter(name => fs.statSync(path.join(testDir, name)).isDirectory());
    
    testApps.forEach(name => {
      applications.push({
        name,
        type: 'test',
        path: path.join(testDir, name),
        health: checkApplicationHealth(path.join(testDir, name)),
      });
    });
  }
  
  // Discover live applications
  const appsDir = path.join(dataDir, theme.fileNaming.applicationsDir);
  if (fs.existsSync(appsDir)) {
    const liveApps = fs.readdirSync(appsDir)
      .filter(name => {
        const appPath = path.join(appsDir, name);
        return fs.statSync(appPath).isDirectory() && name !== 'README.md';
      });
    
    liveApps.forEach(name => {
      applications.push({
        name,
        type: 'live',
        path: path.join(appsDir, name),
        health: checkApplicationHealth(path.join(appsDir, name)),
      });
    });
  }
  
  return applications;
}

/**
 * Checks the health of an application directory
 * @param {string} appPath - Path to application directory
 * @returns {Object} Health status with details
 */
export function checkApplicationHealth(appPath) {
  if (!fs.existsSync(appPath)) {
    return {
      status: ApplicationHealth.MISSING,
      message: 'Application directory does not exist',
      details: {},
    };
  }
  
  const health = {
    status: ApplicationHealth.HEALTHY,
    message: 'Application is healthy',
    details: {
      hasInputs: false,
      hasOutputs: false,
      hasResume: false,
      hasCoverLetter: false,
      outputCount: 0,
      missingComponents: [],
    },
  };
  
  try {
    // Check inputs directory
    const inputsDir = path.join(appPath, 'inputs');
    health.details.hasInputs = fs.existsSync(inputsDir);
    if (!health.details.hasInputs) {
      health.details.missingComponents.push('inputs directory');
    }
    
    // Check outputs directory
    const outputsDir = path.join(appPath, 'outputs');
    health.details.hasOutputs = fs.existsSync(outputsDir);
    if (health.details.hasOutputs) {
      const outputs = fs.readdirSync(outputsDir).filter(f => f.endsWith('.docx'));
      health.details.outputCount = outputs.length;
    } else {
      health.details.missingComponents.push('outputs directory');
    }
    
    // Check required input files
    if (health.details.hasInputs) {
      const resumePath = path.join(inputsDir, 'resume.json');
      health.details.hasResume = fs.existsSync(resumePath);
      if (!health.details.hasResume) {
        health.details.missingComponents.push('resume.json');
      }
      
      const coverLetterPath = path.join(inputsDir, 'cover-letter.md');
      health.details.hasCoverLetter = fs.existsSync(coverLetterPath);
    }
    
    // Determine overall health status
    if (health.details.missingComponents.length > 0) {
      health.status = ApplicationHealth.INCOMPLETE;
      health.message = `Missing components: ${health.details.missingComponents.join(', ')}`;
    }
    
  } catch (error) {
    health.status = ApplicationHealth.ERROR;
    health.message = `Error checking application health: ${error.message}`;
  }
  
  return health;
}

/**
 * Gets applications suitable for testing (healthy applications only)
 * @param {string} type - Filter by type ('test', 'live', or null for all)
 * @returns {Array} Array of healthy applications
 */
export function getTestableApplications(type = null) {
  const applications = discoverApplications();
  
  return applications.filter(app => {
    const isHealthy = app.health.status === ApplicationHealth.HEALTHY;
    const typeMatch = !type || app.type === type;
    return isHealthy && typeMatch;
  });
}

/**
 * Gets a specific application with health check
 * @param {string} name - Application name
 * @returns {Object|null} Application object or null if not found
 */
export function getApplication(name) {
  const applications = discoverApplications();
  return applications.find(app => app.name === name) || null;
}

/**
 * Validates that required test applications exist and are healthy
 * @param {Array} requiredApps - Array of required application names
 * @throws {Error} If any required applications are missing or unhealthy
 */
export function validateRequiredApplications(requiredApps) {
  const applications = discoverApplications();
  const appMap = new Map(applications.map(app => [app.name, app]));
  
  const issues = [];
  
  requiredApps.forEach(name => {
    const app = appMap.get(name);
    if (!app) {
      issues.push(`Application '${name}' not found in any directory`);
    } else if (app.health.status !== ApplicationHealth.HEALTHY) {
      issues.push(`Application '${name}' is ${app.health.status}: ${app.health.message}`);
    }
  });
  
  if (issues.length > 0) {
    throw new Error(`Application validation failed:\n${issues.map(issue => `  - ${issue}`).join('\n')}`);
  }
}

/**
 * Generates a health report for all applications
 * @returns {Object} Health report with summary statistics
 */
export function generateHealthReport() {
  const applications = discoverApplications();
  
  const report = {
    total: applications.length,
    healthy: 0,
    incomplete: 0,
    missing: 0,
    error: 0,
    testApps: 0,
    liveApps: 0,
    applications: applications,
  };
  
  applications.forEach(app => {
    report[app.health.status]++;
    if (app.type === 'test') {
      report.testApps++;
    }
    if (app.type === 'live') {
      report.liveApps++;
    }
  });
  
  return report;
}
