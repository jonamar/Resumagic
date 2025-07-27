import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DEFAULT_FLAGS = {
    STANDARDIZED_DOCUMENT_GENERATION: false,
    STANDARDIZED_RESUME_PROCESSING: false,
    STANDARDIZED_COVER_LETTER_PROCESSING: false,
    STANDARDIZED_KEYWORD_ANALYSIS: false,
    STANDARDIZED_HIRING_EVALUATION: false,
    STANDARDIZED_VALE_LINTING: false,
    STANDARDIZED_ERROR_HANDLING: false,
    STANDARDIZED_CLI_INTERFACE: false,
    STANDARDIZED_SERVICE_COMMUNICATION: false,
    STANDARDIZED_CONFIGURATION: false,
    ENABLE_GOLDEN_MASTER_VALIDATION: true,
    ENABLE_PERFORMANCE_REGRESSION_DETECTION: true,
    STRICT_COMPATIBILITY_MODE: true,
    DEBUG_FEATURE_FLAGS: false,
    LOG_SERVICE_TRANSITIONS: true,
};
class FeatureFlags {
    flags;
    configPath;
    envPrefix;
    constructor() {
        this.flags = { ...DEFAULT_FLAGS };
        this.configPath = path.join(__dirname, '.feature-flags.json');
        this.envPrefix = 'RESUMAGIC_FF_';
        this.loadFlags();
    }
    loadFlags() {
        if (fs.existsSync(this.configPath)) {
            try {
                const fileFlags = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
                this.flags = { ...this.flags, ...fileFlags };
            }
            catch (error) {
                console.warn(`Warning: Could not load feature flags from ${this.configPath}:`, error.message);
            }
        }
        Object.keys(this.flags).forEach(flagName => {
            const envVar = this.envPrefix + flagName;
            const envValue = process.env[envVar];
            if (envValue !== undefined) {
                if (envValue.toLowerCase() === 'true') {
                    this.flags[flagName] = true;
                }
                else if (envValue.toLowerCase() === 'false') {
                    this.flags[flagName] = false;
                }
                else {
                    console.warn(`Warning: Invalid boolean value for ${envVar}: ${envValue}`);
                }
            }
        });
        if (this.flags.DEBUG_FEATURE_FLAGS) {
            console.log('🏁 Feature flags loaded:', this.flags);
        }
    }
    saveFlags() {
        try {
            fs.writeFileSync(this.configPath, JSON.stringify(this.flags, null, 2));
            return true;
        }
        catch (error) {
            console.error(`Error saving feature flags to ${this.configPath}:`, error.message);
            return false;
        }
    }
    isEnabled(flagName) {
        if (!(flagName in this.flags)) {
            console.warn(`Warning: Unknown feature flag: ${flagName}`);
            return false;
        }
        const enabled = this.flags[flagName];
        if (this.flags.LOG_SERVICE_TRANSITIONS && enabled) {
            console.log(`🚀 Using standardized implementation: ${flagName}`);
        }
        return enabled;
    }
    enable(flagName, persist = false) {
        if (!(flagName in this.flags)) {
            console.warn(`Warning: Unknown feature flag: ${flagName}`);
            return false;
        }
        this.flags[flagName] = true;
        if (persist) {
            this.saveFlags();
        }
        if (this.flags.LOG_SERVICE_TRANSITIONS) {
            console.log(`✅ Enabled feature flag: ${flagName}`);
        }
        return true;
    }
    disable(flagName, persist = false) {
        if (!(flagName in this.flags)) {
            console.warn(`Warning: Unknown feature flag: ${flagName}`);
            return false;
        }
        this.flags[flagName] = false;
        if (persist) {
            this.saveFlags();
        }
        if (this.flags.LOG_SERVICE_TRANSITIONS) {
            console.log(`❌ Disabled feature flag: ${flagName}`);
        }
        return true;
    }
    toggle(flagName, persist = false) {
        if (!(flagName in this.flags)) {
            console.warn(`Warning: Unknown feature flag: ${flagName}`);
            return false;
        }
        this.flags[flagName] = !this.flags[flagName];
        if (persist) {
            this.saveFlags();
        }
        if (this.flags.LOG_SERVICE_TRANSITIONS) {
            console.log(`🔄 Toggled feature flag: ${flagName} -> ${this.flags[flagName]}`);
        }
        return this.flags[flagName];
    }
    getAll() {
        return { ...this.flags };
    }
    resetToDefaults(persist = false) {
        this.flags = { ...DEFAULT_FLAGS };
        if (persist) {
            this.saveFlags();
        }
        console.log('🔄 Reset all feature flags to defaults');
    }
    validateSafetyFlags() {
        const criticalFlags = [
            'ENABLE_GOLDEN_MASTER_VALIDATION',
            'ENABLE_PERFORMANCE_REGRESSION_DETECTION',
            'STRICT_COMPATIBILITY_MODE',
        ];
        const issues = [];
        criticalFlags.forEach(flagName => {
            if (!this.flags[flagName]) {
                issues.push(`Critical safety flag disabled: ${flagName}`);
            }
        });
        if (this.flags.STANDARDIZED_CLI_INTERFACE && !this.flags.ENABLE_GOLDEN_MASTER_VALIDATION) {
            issues.push('STANDARDIZED_CLI_INTERFACE enabled without ENABLE_GOLDEN_MASTER_VALIDATION');
        }
        if (issues.length > 0) {
            console.error('⚠️  Feature flag safety validation failed:');
            issues.forEach(issue => console.error(`   - ${issue}`));
            if (this.flags.STRICT_COMPATIBILITY_MODE) {
                throw new Error('Feature flag safety validation failed in strict mode');
            }
        }
        return issues.length === 0;
    }
    getImplementation(serviceName) {
        const flagMapping = {
            'document-generation': 'STANDARDIZED_DOCUMENT_GENERATION',
            'resume-processing': 'STANDARDIZED_RESUME_PROCESSING',
            'cover-letter-processing': 'STANDARDIZED_COVER_LETTER_PROCESSING',
            'keyword-analysis': 'STANDARDIZED_KEYWORD_ANALYSIS',
            'hiring-evaluation': 'STANDARDIZED_HIRING_EVALUATION',
            'error-handling': 'STANDARDIZED_ERROR_HANDLING',
            'cli-interface': 'STANDARDIZED_CLI_INTERFACE',
            'service-communication': 'STANDARDIZED_SERVICE_COMMUNICATION',
            'configuration': 'STANDARDIZED_CONFIGURATION',
        };
        const flagName = flagMapping[serviceName];
        if (!flagName) {
            console.warn(`Warning: No feature flag mapping for service: ${serviceName}`);
            return 'legacy';
        }
        return this.isEnabled(flagName) ? 'standardized' : 'legacy';
    }
}
let instance = null;
function getFeatureFlags() {
    if (!instance) {
        instance = new FeatureFlags();
    }
    return instance;
}
function isEnabled(flagName) {
    return getFeatureFlags().isEnabled(flagName);
}
function getImplementation(serviceName) {
    return getFeatureFlags().getImplementation(serviceName);
}
export { FeatureFlags, getFeatureFlags, isEnabled, getImplementation, DEFAULT_FLAGS, };
//# sourceMappingURL=feature-flags.js.map