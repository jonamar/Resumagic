import { ErrorType, ErrorSeverity, ContextType } from './error-types.js';
interface ErrorConfig {
    formatting: {
        useEmojis: boolean;
        includeContext: boolean;
        maxContextLines: number;
        includeStackTrace: boolean;
    };
    logging: {
        logToConsole: boolean;
        logLevel: string;
    };
}
interface ErrorContext {
    type?: ContextType;
    [key: string]: any;
}
interface LogErrorConfig {
    message: string;
    error?: Error | null;
    type?: ErrorType;
    severity?: ErrorSeverity;
    details?: string[];
    context?: ErrorContext;
}
interface Result {
    isValid: boolean;
    success: boolean;
    data?: any;
    error?: string;
    errorType?: ErrorType;
    details?: string[];
    legacyErrorType?: string;
}
interface ValidationOptions {
    customMessage?: string;
    expectedFormat?: string;
}
interface FileContext extends ErrorContext {
    type: ContextType;
    filePath: string;
    fileName: string;
    directory: string;
    exists?: boolean;
    size?: number;
    modified?: string;
    contextError?: string;
}
interface ServiceContext extends ErrorContext {
    type: ContextType;
    service: string;
    operation: string;
    timestamp: string;
}
interface ValidationContext extends ErrorContext {
    type: ContextType;
    fieldName: string;
    providedValue: string;
    valueType: string;
    expectedFormat?: string;
}
declare class ErrorHandler {
    static logError({ message, error, type, severity, details, context }: LogErrorConfig): void;
    static logServiceError(serviceName: string, operation: string, error: Error, context?: ErrorContext): void;
    static logAppError(component: string, message: string, error?: Error | null, details?: string[], context?: ErrorContext): void;
    static createResult(success: boolean, data?: any, errorMessage?: string | null, errorType?: ErrorType, details?: string[], legacyErrorType?: string | null): Result;
    static validateInput(value: any, validator: (value: any) => boolean, fieldName: string, options?: ValidationOptions): Result;
    static assertRequired(value: any, fieldName: string): void;
    static buildFileContext(filePath: string, additionalInfo?: ErrorContext): Promise<FileContext>;
    static buildServiceContext(service: string, operation: string, additionalInfo?: ErrorContext): ServiceContext;
    static buildValidationContext(fieldName: string, value: any, expectedFormat?: string | null): ValidationContext;
    static updateConfig(newConfig: Partial<ErrorConfig>): void;
    static getConfig(): ErrorConfig;
}
export default ErrorHandler;
export type { ErrorType, ErrorSeverity, ContextType, ErrorContext, Result, ValidationOptions };
//# sourceMappingURL=error-handler.d.ts.map