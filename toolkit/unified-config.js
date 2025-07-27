/**
 * Unified Configuration System
 * Consistent configuration management across all services and languages
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import FeatureFlagHelper from './feature-flag-helper.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class UnifiedConfig {
  constructor(configPath = null) {
    // Default to .resumagic-config.json in project root
    this.configPath = configPath || path.join(__dirname, '..', '.resumagic-config.json');
    this.featureFlags = new FeatureFlagHelper();
    this.config = this.loadConfig();
    this.envPrefix = 'RESUMAGIC_';
  }

  /**
   * Load configuration from file system with environment variable overrides
   */
  loadConfig() {
    try {
      let config = {};

      // Load from file if exists
      if (fs.existsSync(this.configPath)) {
        const configData = fs.readFileSync(this.configPath, 'utf8');
        config = JSON.parse(configData);
      } else {
        // Create default configuration
        config = this.getDefaultConfig();
        this.saveConfig(config);
      }

      // Apply environment variable overrides
      config = this.applyEnvironmentOverrides(config);

      return config;
    } catch (error) {
      console.warn(`Warning: Could not load config from ${this.configPath}:`, error.message);
      return this.getDefaultConfig();
    }
  }

  /**
   * Get default configuration structure
   */
  getDefaultConfig() {
    return {
      _metadata: {
        version: '1.0.0',
        lastUpdated: new Date().toISOString(),
        description: 'Unified configuration for Resumagic services'
      },
      
      // Global application settings
      app: {
        name: 'resumagic-app',
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        logLevel: 'info',
        tempDir: path.join(__dirname, '..', 'tmp'),
        dataDir: path.join(__dirname, '..', '..', 'data')
      },

      // Service-specific configurations
      services: {
        keywordAnalysis: {
          enabled: true,
          pythonPath: 'python',
          scriptPath: 'services/keyword-analysis/kw_rank_modular.py',
          timeout: 30000,
          retries: 3,
          config: {
            maxKeywords: 100,
            semanticThreshold: 0.7
          }
        },
        
        hiringEvaluation: {
          enabled: true,
          scriptPath: 'services/hiring-evaluation/evaluation-runner.js',
          timeout: 120000,
          retries: 1,
          config: {
            ollamaUrl: 'http://localhost:11434',
            defaultModel: 'dolphin3:latest',
            fastModel: 'phi3:mini',
            temperature: 0.7,
            maxTokens: 4000
          }
        },
        
        documentGeneration: {
          enabled: true,
          timeout: 10000,
          retries: 2,
          config: {
            templateDir: 'templates',
            outputDir: 'outputs',
            defaultTheme: 'professional',
            formats: ['docx', 'pdf']
          }
        },
        
        valeLinting: {
          enabled: false, // Disabled by default until implemented
          binaryPath: 'vale',
          configPath: '.vale.ini',
          timeout: 15000,
          retries: 1,
          config: {
            styleGuide: 'Microsoft',
            minScore: 80
          }
        }
      },

      // Logging configuration
      logging: {
        level: 'info',
        format: 'console', // 'json' or 'console'
        enableColors: true,
        fileLogging: {
          enabled: false,
          directory: 'logs',
          rotation: 'daily',
          maxFiles: 7
        }
      },

      // Performance and reliability
      performance: {
        enableMetrics: false,
        metricsInterval: 60000,
        enableProfiling: false,
        maxMemoryUsage: '1GB',
        requestTimeout: 300000
      },

      // Security settings
      security: {
        enableAuditLogging: false,
        sanitizeInputs: true,
        validateFileAccess: true,
        allowedFileExtensions: ['.md', '.docx', '.json', '.txt'],
        maxFileSize: '10MB'
      },

      // Feature flags integration
      features: {
        useFeatureFlags: true,
        flagSource: 'file', // 'file' or 'environment'
        defaultFlag: false
      }
    };
  }

  /**
   * Apply environment variable overrides
   * Environment variables follow pattern: RESUMAGIC_SECTION_KEY=value
   * Examples: RESUMAGIC_APP_LOGLEVEL=debug, RESUMAGIC_SERVICES_KEYWORD_ANALYSIS_ENABLED=false
   */
  applyEnvironmentOverrides(config) {
    const envVars = process.env;
    const overrides = {};

    for (const [key, value] of Object.entries(envVars)) {
      if (key.startsWith(this.envPrefix)) {
        const configPath = key
          .slice(this.envPrefix.length)
          .toLowerCase()
          .split('_');
        
        // Convert environment variable to nested object path
        this.setNestedValue(overrides, configPath, this.parseEnvValue(value));
      }
    }

    // Deep merge overrides into config
    return this.deepMerge(config, overrides);
  }

  /**
   * Parse environment variable value to appropriate type
   */
  parseEnvValue(value) {
    // Boolean values
    if (value.toLowerCase() === 'true') return true;
    if (value.toLowerCase() === 'false') return false;
    
    // Number values
    if (!isNaN(value) && !isNaN(parseFloat(value))) {
      return parseFloat(value);
    }
    
    // JSON values (for complex objects)
    if ((value.startsWith('{') && value.endsWith('}')) || 
        (value.startsWith('[') && value.endsWith(']'))) {
      try {
        return JSON.parse(value);
      } catch (_error) {
        // If JSON parsing fails, treat as string
      }
    }
    
    // String value (default)
    return value;
  }

  /**
   * Set nested value in object using array path
   */
  setNestedValue(obj, path, value) {
    let current = obj;
    for (let i = 0; i < path.length - 1; i++) {
      const key = path[i];
      if (!(key in current)) {
        current[key] = {};
      }
      current = current[key];
    }
    current[path[path.length - 1]] = value;
  }

  /**
   * Deep merge two objects
   */
  deepMerge(target, source) {
    const result = { ...target };
    
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(result[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
    
    return result;
  }

  /**
   * Save configuration to file
   */
  saveConfig(config = null) {
    const configToSave = config || this.config;
    try {
      // Update metadata
      configToSave._metadata = {
        ...configToSave._metadata,
        lastUpdated: new Date().toISOString()
      };
      
      fs.writeFileSync(this.configPath, JSON.stringify(configToSave, null, 2), 'utf8');
      this.config = configToSave;
    } catch (error) {
      console.error(`Error saving config to ${this.configPath}:`, error.message);
    }
  }

  /**
   * Get configuration value with dot notation
   * Example: get('services.keywordAnalysis.enabled')
   */
  get(path, defaultValue = undefined) {
    // Check if unified config is enabled
    if (!this.featureFlags.useUnifiedConfig()) {
      console.warn(`Unified config disabled, returning default value for ${path}`);
      return defaultValue;
    }

    const pathParts = path.split('.');
    let current = this.config;
    
    for (const part of pathParts) {
      if (current && typeof current === 'object' && part in current) {
        current = current[part];
      } else {
        return defaultValue;
      }
    }
    
    return current;
  }

  /**
   * Set configuration value with dot notation
   */
  set(path, value) {
    const pathParts = path.split('.');
    let current = this.config;
    
    // Navigate to parent of target
    for (let i = 0; i < pathParts.length - 1; i++) {
      const part = pathParts[i];
      if (!(part in current) || typeof current[part] !== 'object') {
        current[part] = {};
      }
      current = current[part];
    }
    
    // Set the final value
    const finalKey = pathParts[pathParts.length - 1];
    current[finalKey] = value;
    
    this.saveConfig();
    console.log(`Config '${path}' set to:`, value);
  }

  /**
   * Get all configuration for inspection
   */
  getAll() {
    return { ...this.config };
  }

  /**
   * Service-specific configuration getters
   */
  getServiceConfig(serviceName) {
    return this.get(`services.${serviceName}`, {});
  }

  getAppConfig() {
    return this.get('app', {});
  }

  getLoggingConfig() {
    return this.get('logging', {});
  }

  getPerformanceConfig() {
    return this.get('performance', {});
  }

  getSecurityConfig() {
    return this.get('security', {});
  }

  /**
   * Validation helpers
   */
  validateServiceConfig(serviceName) {
    const serviceConfig = this.getServiceConfig(serviceName);
    const errors = [];

    if (serviceConfig.enabled === undefined) {
      errors.push(`${serviceName}.enabled is required`);
    }

    if (!serviceConfig.timeout || serviceConfig.timeout <= 0) {
      errors.push(`${serviceName}.timeout must be a positive number`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Environment-specific configuration
   */
  isDevelopment() {
    return this.get('app.environment') === 'development';
  }

  isProduction() {
    return this.get('app.environment') === 'production';
  }

  isTest() {
    return this.get('app.environment') === 'test';
  }

  /**
   * Configuration templates for different environments
   */
  applyEnvironmentDefaults(environment) {
    const envDefaults = {
      development: {
        app: { logLevel: 'debug' },
        logging: { level: 'debug', enableColors: true },
        performance: { enableMetrics: true },
        security: { enableAuditLogging: false }
      },
      
      production: {
        app: { logLevel: 'warn' },
        logging: { level: 'warn', format: 'json', enableColors: false },
        performance: { enableMetrics: true, enableProfiling: false },
        security: { enableAuditLogging: true }
      },
      
      test: {
        app: { logLevel: 'error' },
        logging: { level: 'error', enableColors: false },
        performance: { enableMetrics: false },
        security: { enableAuditLogging: false }
      }
    };

    if (envDefaults[environment]) {
      this.config = this.deepMerge(this.config, envDefaults[environment]);
      this.saveConfig();
    }
  }

  /**
   * Export configuration for other languages (Python, Go)
   */
  exportForPython() {
    const pythonConfig = {
      app: this.getAppConfig(),
      keyword_analysis: this.getServiceConfig('keywordAnalysis'),
      logging: this.getLoggingConfig(),
      performance: this.getPerformanceConfig()
    };

    return JSON.stringify(pythonConfig, null, 2);
  }

  exportForGo() {
    const goConfig = {
      App: this.getAppConfig(),
      ValeLinting: this.getServiceConfig('valeLinting'),
      Logging: this.getLoggingConfig(),
      Performance: this.getPerformanceConfig()
    };

    return JSON.stringify(goConfig, null, 2);
  }

  /**
   * Reload configuration from file (useful for config changes)
   */
  reload() {
    this.config = this.loadConfig();
    console.log('Configuration reloaded from file');
  }
}

// Export for use as module
export default UnifiedConfig;

// CLI interface for configuration management
if (import.meta.url === `file://${process.argv[1]}`) {
  const config = new UnifiedConfig();
  const command = process.argv[2];
  const path = process.argv[3];
  const value = process.argv[4];

  switch (command) {
  case 'get': {
    if (!path) {
      console.error('Usage: node unified-config.js get <config-path>');
      process.exit(1);
    }
    const configValue = config.get(path);
    console.log(`${path}:`, configValue);
    break;
  }
      
  case 'set': {
    if (!path || value === undefined) {
      console.error('Usage: node unified-config.js set <config-path> <value>');
      process.exit(1);
    }
    // Parse value
    let parsedValue = value;
    if (value === 'true') parsedValue = true;
    else if (value === 'false') parsedValue = false;
    else if (!isNaN(value)) parsedValue = Number(value);
      
    config.set(path, parsedValue);
    break;
  }
      
  case 'list':
    console.log('Current Configuration:');
    console.log(JSON.stringify(config.getAll(), null, 2));
    break;
      
  case 'validate': {
    const serviceName = path;
    if (!serviceName) {
      console.error('Usage: node unified-config.js validate <service-name>');
      process.exit(1);
    }
    const validation = config.validateServiceConfig(serviceName);
    if (validation.isValid) {
      console.log(`✅ ${serviceName} configuration is valid`);
    } else {
      console.log(`❌ ${serviceName} configuration errors:`);
      validation.errors.forEach(error => console.log(`  - ${error}`));
    }
    break;
  }
      
  case 'export-python':
    console.log(config.exportForPython());
    break;
      
  case 'export-go':
    console.log(config.exportForGo());
    break;
      
  case 'enable': {
    const flags = new FeatureFlagHelper();
    flags.enable('configuration.useUnifiedConfig');
    console.log('✅ Unified configuration enabled');
    break;
  }
      
  case 'disable': {
    const flags2 = new FeatureFlagHelper();
    flags2.disable('configuration.useUnifiedConfig');
    console.log('✅ Unified configuration disabled');
    break;
  }
      
  case 'reload':
    config.reload();
    console.log('✅ Configuration reloaded');
    break;
      
  default:
    console.log('Unified Configuration CLI');
    console.log('Usage:');
    console.log('  node unified-config.js get <path>           # Get configuration value');
    console.log('  node unified-config.js set <path> <value>   # Set configuration value');
    console.log('  node unified-config.js list                 # List all configuration');
    console.log('  node unified-config.js validate <service>   # Validate service config');
    console.log('  node unified-config.js export-python        # Export for Python services');
    console.log('  node unified-config.js export-go            # Export for Go services');
    console.log('  node unified-config.js enable               # Enable unified config');
    console.log('  node unified-config.js disable              # Disable unified config');
    console.log('  node unified-config.js reload               # Reload from file');
    console.log('');
    console.log('Environment Variables:');
    console.log('  RESUMAGIC_APP_LOGLEVEL=debug                # Override app.logLevel');
    console.log('  RESUMAGIC_SERVICES_KEYWORD_ANALYSIS_ENABLED=false  # Override service.keywordAnalysis.enabled');
    break;
  }
}