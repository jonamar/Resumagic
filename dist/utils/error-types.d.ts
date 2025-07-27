export declare const ERROR_TYPES: {
    readonly FILE_NOT_FOUND: "FILE_NOT_FOUND";
    readonly FILE_ACCESS_ERROR: "FILE_ACCESS_ERROR";
    readonly DIRECTORY_NOT_FOUND: "DIRECTORY_NOT_FOUND";
    readonly INVALID_INPUT: "INVALID_INPUT";
    readonly MISSING_REQUIRED_FIELD: "MISSING_REQUIRED_FIELD";
    readonly INVALID_FORMAT: "INVALID_FORMAT";
    readonly SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE";
    readonly NETWORK_ERROR: "NETWORK_ERROR";
    readonly API_ERROR: "API_ERROR";
    readonly PARSING_ERROR: "PARSING_ERROR";
    readonly SERIALIZATION_ERROR: "SERIALIZATION_ERROR";
    readonly DATA_CORRUPTION: "DATA_CORRUPTION";
    readonly CONFIGURATION_ERROR: "CONFIGURATION_ERROR";
    readonly MISSING_DEPENDENCY: "MISSING_DEPENDENCY";
    readonly VERSION_MISMATCH: "VERSION_MISMATCH";
    readonly APPLICATION_NOT_FOUND: "APPLICATION_NOT_FOUND";
    readonly GENERATION_ERROR: "GENERATION_ERROR";
    readonly TEMPLATE_ERROR: "TEMPLATE_ERROR";
    readonly UNKNOWN_ERROR: "UNKNOWN_ERROR";
    readonly INTERNAL_ERROR: "INTERNAL_ERROR";
};
export type ErrorType = typeof ERROR_TYPES[keyof typeof ERROR_TYPES];
export declare const ERROR_SEVERITY: {
    readonly LOW: "LOW";
    readonly MEDIUM: "MEDIUM";
    readonly HIGH: "HIGH";
    readonly FATAL: "FATAL";
};
export type ErrorSeverity = typeof ERROR_SEVERITY[keyof typeof ERROR_SEVERITY];
export declare const CONTEXT_TYPES: {
    readonly FILE: "FILE";
    readonly SERVICE: "SERVICE";
    readonly VALIDATION: "VALIDATION";
    readonly CONFIGURATION: "CONFIGURATION";
    readonly USER_INPUT: "USER_INPUT";
};
export type ContextType = typeof CONTEXT_TYPES[keyof typeof CONTEXT_TYPES];
//# sourceMappingURL=error-types.d.ts.map