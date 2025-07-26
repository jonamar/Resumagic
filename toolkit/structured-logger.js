/**
 * Structured Logger Utility
 * Consistent logging format across all services and languages
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import FeatureFlagHelper from './feature-flag-helper.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class StructuredLogger {
  constructor(options = {}) {
    this.serviceName = options.serviceName || 'unknown';
    this.logLevel = options.logLevel || process.env.LOG_LEVEL || 'info';
    this.logFormat = options.logFormat || 'json'; // 'json' or 'console'
    this.enableColors = options.enableColors !== false; // Default true
    this.featureFlags = new FeatureFlagHelper();
    
    // Log levels (higher number = more severe)
    this.logLevels = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3,
      fatal: 4
    };
    
    // Colors for console output
    this.colors = {
      debug: '\x1b[36m', // Cyan
      info: '\x1b[32m',  // Green
      warn: '\x1b[33m',  // Yellow
      error: '\x1b[31m', // Red
      fatal: '\x1b[35m', // Magenta
      reset: '\x1b[0m'   // Reset
    };
    
    // Setup log directory if needed
    this.setupLogDirectory();
  }

  /**
   * Setup log directory for file output
   */
  setupLogDirectory() {
    const logDir = path.join(__dirname, '..', 'logs');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    this.logDir = logDir;
  }

  /**
   * Check if we should use structured logging
   */
  shouldUseStructuredLogging() {
    return this.featureFlags.useStructuredLogging();
  }

  /**
   * Core logging method
   */
  log(level, message, context = {}, error = null) {
    // Check if structured logging is enabled
    if (!this.shouldUseStructuredLogging()) {
      // Fall back to console.log for legacy compatibility
      const timestamp = new Date().toISOString();
      const prefix = `[${timestamp}] [${level.toUpperCase()}] [${this.serviceName}]`;
      
      if (error) {
        console.log(`${prefix} ${message}`, context, error);
      } else {
        console.log(`${prefix} ${message}`, Object.keys(context).length > 0 ? context : '');
      }
      return;
    }

    // Check log level
    if (this.logLevels[level] < this.logLevels[this.logLevel]) {
      return; // Don't log if below configured level
    }

    // Create structured log entry
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: level.toUpperCase(),
      service: this.serviceName,
      message,
      context: context || {},
      ...(error && { 
        error: {
          message: error.message,
          stack: error.stack,
          name: error.name
        }
      })
    };

    // Output based on format
    if (this.logFormat === 'json') {
      this.outputJson(logEntry);
    } else {
      this.outputConsole(logEntry, level);
    }

    // Write to file if error or fatal
    if (level === 'error' || level === 'fatal') {
      this.writeToFile(logEntry);
    }
  }

  /**
   * Output JSON format
   */
  outputJson(logEntry) {
    console.log(JSON.stringify(logEntry));
  }

  /**
   * Output console format with colors
   */
  outputConsole(logEntry, level) {
    const color = this.enableColors ? this.colors[level] : '';
    const reset = this.enableColors ? this.colors.reset : '';
    const timestamp = logEntry.timestamp;
    const service = logEntry.service;
    const message = logEntry.message;
    
    let output = `${color}[${timestamp}] [${level.toUpperCase()}] [${service}]${reset} ${message}`;
    
    // Add context if present
    if (Object.keys(logEntry.context).length > 0) {
      output += ` ${JSON.stringify(logEntry.context)}`;
    }
    
    // Add error if present
    if (logEntry.error) {
      output += `\n${color}Error: ${logEntry.error.message}${reset}`;
      if (logEntry.error.stack) {
        output += `\n${logEntry.error.stack}`;
      }
    }
    
    console.log(output);
  }

  /**
   * Write severe logs to file
   */
  writeToFile(logEntry) {
    try {
      const logFile = path.join(this.logDir, `${this.serviceName}-errors.log`);
      const logLine = JSON.stringify(logEntry) + '\n';
      fs.appendFileSync(logFile, logLine, 'utf8');
    } catch (error) {
      // Don't fail the application if logging fails
      console.error('Failed to write log to file:', error.message);
    }
  }

  /**
   * Convenience methods for different log levels
   */
  debug(message, context = {}) {
    this.log('debug', message, context);
  }

  info(message, context = {}) {
    this.log('info', message, context);
  }

  warn(message, context = {}) {
    this.log('warn', message, context);
  }

  error(message, context = {}, error = null) {
    this.log('error', message, context, error);
  }

  fatal(message, context = {}, error = null) {
    this.log('fatal', message, context, error);
  }

  /**
   * Service operation logging helpers
   */
  serviceStart(operation, input = {}) {
    this.info(`Starting ${operation}`, {
      operation,
      inputKeys: Object.keys(input),
      inputSize: JSON.stringify(input).length
    });
  }

  serviceComplete(operation, duration, output = {}) {
    this.info(`Completed ${operation}`, {
      operation,
      duration_ms: duration,
      outputKeys: Object.keys(output),
      outputSize: JSON.stringify(output).length
    });
  }

  serviceError(operation, error, input = {}) {
    this.error(`Failed ${operation}`, {
      operation,
      inputKeys: Object.keys(input)
    }, error);
  }

  /**
   * Migration logging helpers
   */
  migrationStart(serviceName, fromImplementation, toImplementation) {
    this.info('Service migration started', {
      serviceName,
      fromImplementation,
      toImplementation,
      migration: true
    });
  }

  migrationComplete(serviceName, duration, validationResult) {
    this.info('Service migration completed', {
      serviceName,
      duration_ms: duration,
      validationPassed: validationResult.success,
      migration: true
    });
  }

  migrationValidationFailed(serviceName, differences) {
    this.warn('Migration validation failed', {
      serviceName,
      differenceCount: differences.length,
      differences: differences.slice(0, 5), // Log first 5 differences
      migration: true
    });
  }

  featureFlagToggle(flagPath, oldValue, newValue) {
    this.info('Feature flag toggled', {
      flagPath,
      oldValue,
      newValue,
      featureFlag: true
    });
  }

  /**
   * Performance logging helpers
   */
  performanceMetric(metric, value, unit = 'ms', context = {}) {
    this.info('Performance metric', {
      metric,
      value,
      unit,
      ...context,
      performance: true
    });
  }

  /**
   * Security logging helpers
   */
  securityEvent(event, severity = 'info', context = {}) {
    this.log(severity, `Security event: ${event}`, {
      ...context,
      security: true
    });
  }

  /**
   * Audit logging helpers
   */
  auditLog(action, user = 'system', resource = null, result = 'success') {
    this.info('Audit log', {
      action,
      user,
      resource,
      result,
      audit: true
    });
  }

  /**
   * Create child logger with additional context
   */
  child(additionalContext) {
    const childLogger = new StructuredLogger({
      serviceName: this.serviceName,
      logLevel: this.logLevel,
      logFormat: this.logFormat,
      enableColors: this.enableColors
    });
    
    // Override log method to include additional context
    const originalLog = childLogger.log.bind(childLogger);
    childLogger.log = (level, message, context = {}, error = null) => {
      return originalLog(level, message, { ...additionalContext, ...context }, error);
    };
    
    return childLogger;
  }

  /**
   * Flush logs (if buffering is implemented in the future)
   */
  flush() {
    // Currently synchronous, but could implement buffering later
  }

  /**
   * Close logger and cleanup
   */
  close() {
    this.flush();
  }
}

/**
 * Create a logger instance for a service
 */
export function createLogger(serviceName, options = {}) {
  return new StructuredLogger({
    serviceName,
    ...options
  });
}

/**
 * Get default logger instance
 */
let defaultLogger = null;
export function getDefaultLogger() {
  if (!defaultLogger) {
    defaultLogger = new StructuredLogger({
      serviceName: 'resumagic-app'
    });
  }
  return defaultLogger;
}

/**
 * Convenience exports for quick logging
 */
export const logger = getDefaultLogger();

// Export main class
export default StructuredLogger;

// CLI interface for testing and configuration
if (import.meta.url === `file://${process.argv[1]}`) {
  const command = process.argv[2];
  const testLogger = createLogger('test-service');

  switch (command) {
    case 'test':
      console.log('Testing structured logger...');
      testLogger.debug('This is a debug message', { debugInfo: 'extra data' });
      testLogger.info('This is an info message', { operation: 'test' });
      testLogger.warn('This is a warning message', { warningCode: 'TEST_WARNING' });
      testLogger.error('This is an error message', { errorCode: 'TEST_ERROR' }, new Error('Test error'));
      testLogger.fatal('This is a fatal message', { fatalCode: 'TEST_FATAL' }, new Error('Test fatal error'));
      break;
      
    case 'enable':
      const flags = new FeatureFlagHelper();
      flags.enable('logging.useStructuredLogging');
      console.log('✅ Structured logging enabled');
      break;
      
    case 'disable':
      const flags2 = new FeatureFlagHelper();
      flags2.disable('logging.useStructuredLogging');
      console.log('✅ Structured logging disabled (fallback to console.log)');
      break;
      
    case 'status':
      const flags3 = new FeatureFlagHelper();
      const enabled = flags3.useStructuredLogging();
      console.log(`Structured logging: ${enabled ? 'ENABLED' : 'DISABLED'}`);
      break;
      
    default:
      console.log('Structured Logger CLI');
      console.log('Usage:');
      console.log('  node structured-logger.js test          # Test all log levels');
      console.log('  node structured-logger.js enable        # Enable structured logging');
      console.log('  node structured-logger.js disable       # Disable structured logging');
      console.log('  node structured-logger.js status        # Check current status');
      break;
  }
}