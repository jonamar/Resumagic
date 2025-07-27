interface FeatureFlagsConfig {
    STANDARDIZED_DOCUMENT_GENERATION: boolean;
    STANDARDIZED_RESUME_PROCESSING: boolean;
    STANDARDIZED_COVER_LETTER_PROCESSING: boolean;
    STANDARDIZED_KEYWORD_ANALYSIS: boolean;
    STANDARDIZED_HIRING_EVALUATION: boolean;
    STANDARDIZED_VALE_LINTING: boolean;
    STANDARDIZED_ERROR_HANDLING: boolean;
    STANDARDIZED_CLI_INTERFACE: boolean;
    STANDARDIZED_SERVICE_COMMUNICATION: boolean;
    STANDARDIZED_CONFIGURATION: boolean;
    ENABLE_GOLDEN_MASTER_VALIDATION: boolean;
    ENABLE_PERFORMANCE_REGRESSION_DETECTION: boolean;
    STRICT_COMPATIBILITY_MODE: boolean;
    DEBUG_FEATURE_FLAGS: boolean;
    LOG_SERVICE_TRANSITIONS: boolean;
}
declare const DEFAULT_FLAGS: FeatureFlagsConfig;
declare class FeatureFlags {
    private flags;
    private configPath;
    private envPrefix;
    constructor();
    loadFlags(): void;
    saveFlags(): boolean;
    isEnabled(flagName: keyof FeatureFlagsConfig): boolean;
    enable(flagName: keyof FeatureFlagsConfig, persist?: boolean): boolean;
    disable(flagName: keyof FeatureFlagsConfig, persist?: boolean): boolean;
    toggle(flagName: keyof FeatureFlagsConfig, persist?: boolean): boolean;
    getAll(): FeatureFlagsConfig;
    resetToDefaults(persist?: boolean): void;
    validateSafetyFlags(): boolean;
    getImplementation(serviceName: string): string;
}
declare function getFeatureFlags(): FeatureFlags;
declare function isEnabled(flagName: keyof FeatureFlagsConfig): boolean;
declare function getImplementation(serviceName: string): string;
export { FeatureFlags, getFeatureFlags, isEnabled, getImplementation, DEFAULT_FLAGS, type FeatureFlagsConfig };
//# sourceMappingURL=feature-flags.d.ts.map