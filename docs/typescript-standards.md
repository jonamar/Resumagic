# TypeScript Standards and Developer Guidelines

## Overview
This document outlines the TypeScript standards and best practices for the Resumagic codebase. These guidelines will be implemented as part of Phase 6: TypeScript Migration and are designed to maintain consistency with existing JavaScript standards while leveraging TypeScript's type safety features.

## Core Principles

### 1. Type Safety First
- All new code should use TypeScript with strict typing
- Leverage TypeScript's type inference where possible
- Avoid using `any` type except in specific migration scenarios
- Use `unknown` instead of `any` for truly unknown data

### 2. Consistency with Existing Standards
- Maintain compatibility with existing SERVICE_STANDARDS.md
- Preserve JSON-in/JSON-out interface contracts
- Keep consistent error handling patterns
- Maintain service wrapper architecture

### 3. Developer Experience
- Provide excellent IDE support with type definitions
- Enable reliable refactoring
- Improve code documentation through types
- Maintain fast build times

## TypeScript Configuration

### Base Configuration
The project will use the following tsconfig.json settings:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "node",
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "outDir": "./dist",
    "rootDir": "./",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": [
    "./**/*"
  ],
  "exclude": [
    "node_modules",
    "dist",
    "coverage",
    "__tests__",
    "__mocks__"
  ]
}
```

### Strict Mode Settings
- `strict`: Enable all strict type checking options
- `noImplicitAny`: Prevent implicit any types
- `strictNullChecks`: Ensure null safety
- `strictFunctionTypes`: Enable strict function type checking
- `strictBindCallApply`: Enable strict bind, call, and apply methods
- `strictPropertyInitialization`: Ensure class properties are initialized
- `noImplicitThis`: Raise error on `this` expressions with an implied `any` type
- `alwaysStrict`: Parse in strict mode and emit "use strict" for each source file

## Type Definition Standards

### 1. Interface vs Type Alias
- Use `interface` for object shapes that may be extended
- Use `type` for unions, primitives, tuples, and other non-object types
- Use `interface` for public APIs
- Use `type` for internal implementation details

### 2. Naming Conventions
- Interfaces: Use PascalCase (e.g., `UserService`)
- Type aliases: Use PascalCase (e.g., `UserResponse`)
- Generic types: Use single uppercase letters (T, U, V, etc.)
- Union types: Use PascalCase with "Or" suffix when appropriate (e.g., `StringOrNumber`)

### 3. Service Contract Types
All service contracts should follow the patterns defined in `types/service-contracts.ts`:

```typescript
// Base response types
interface ServiceMetadata {
  service: string;
  version: string;
  duration: number;
  timestamp: string;
}

interface ServiceError {
  code: string;
  message: string;
  details?: any;
}

type ServiceResponse<T> = ServiceResponseSuccess<T> | ServiceResponseError;
```

## Module Organization

### File Extensions
- Use `.ts` for TypeScript files
- Use `.tsx` for React/JSX files (if applicable in future)
- Maintain existing directory structure (cli/, core/, services/, utils/)

### Import/Export Patterns
- Use ES modules consistently
- Prefer named exports over default exports
- Use relative paths for local modules
- Use absolute paths for external dependencies

```typescript
// Good
import { UserService } from '../services/user-service';
import { validateInput } from '../utils/validation';
import fs from 'fs';

// Avoid
import UserService from '../services/user-service';
import * as utils from '../utils';
```

## Service Wrapper Standards

### TypeScript Service Wrapper Implementation
Service wrappers should implement the TypeScript interfaces while maintaining backward compatibility:

```typescript
import { BaseServiceWrapper } from './base-service-wrapper';
import { ServiceResponse } from '../../types/service-contracts';

export class KeywordAnalysisWrapper extends BaseServiceWrapper implements KeywordAnalysisService {
  serviceName = 'keyword-analysis';
  
  async analyze(input: KeywordAnalysisInput): Promise<ServiceResponse<KeywordAnalysisData>> {
    // Implementation
  }
  
  async getRecommendations(input: KeywordAnalysisInput): Promise<ServiceResponse<any>> {
    // Implementation
  }
}
```

### Error Handling
Maintain the existing error handling patterns with enhanced type safety:

```typescript
try {
  const result = await someOperation();
  return ServiceResponse.success(result, this.serviceName, duration);
} catch (error: unknown) {
  if (error instanceof Error) {
    return this.createErrorResponse(
      'OPERATION_FAILED',
      error.message,
      { originalError: error.message },
      duration
    );
  }
  
  return this.createErrorResponse(
    'UNKNOWN_ERROR',
    'An unknown error occurred',
    { originalError: String(error) },
    duration
  );
}
```

## Utility Function Standards

### Type-Safe Utilities
Utility functions should be strongly typed:

```typescript
// Good
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Better with type guard
export function isValidEmail(email: string): email is string {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
```

## Testing Standards

### TypeScript Testing
Tests should also be written in TypeScript to ensure type safety:

```typescript
import { UserService } from '../services/user-service';
import { User } from '../types/user';

describe('UserService', () => {
  let userService: UserService;
  
  beforeEach(() => {
    userService = new UserService();
  });
  
  test('should create user with valid input', async () => {
    const userData: User = {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com'
    };
    
    const result = await userService.create(userData);
    
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(userData);
    }
  });
});
```

## Migration Guidelines

### Incremental Migration
1. Start with utility modules (utils/)
2. Move to core modules (core/)
3. Migrate CLI modules (cli/)
4. Convert service wrappers (services/wrappers/)
5. Update tests to TypeScript

### Interoperability
- JavaScript and TypeScript files can coexist during migration
- Use type declaration files (.d.ts) for JavaScript modules
- Maintain backward compatibility

### Type Declaration Files
For JavaScript modules that haven't been migrated yet:

```typescript
// user-service.d.ts
export class UserService {
  create(userData: User): Promise<ServiceResponse<User>>;
  update(id: string, userData: Partial<User>): Promise<ServiceResponse<User>>;
}
```

## IDE and Tooling

### Recommended VS Code Extensions
- TypeScript Importer
- TypeScript Hero
- Bracket Pair Colorizer
- Auto Rename Tag

### ESLint Configuration
Extend existing ESLint configuration with TypeScript rules:

```javascript
module.exports = {
  extends: [
    // existing configurations
    '@typescript-eslint/recommended'
  ],
  parser: '@typescript-eslint/parser',
  plugins: [
    '@typescript-eslint'
  ],
  rules: {
    // TypeScript-specific rules
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off'
  }
};
```

## Performance Considerations

### Build Performance
- Use TypeScript's project references for large projects
- Enable incremental compilation
- Use build caching
- Monitor compilation time during development

### Runtime Performance
- TypeScript compilation to JavaScript has no runtime overhead
- Use `ts-node` only for development
- Compile to optimized JavaScript for production

## Documentation Standards

### JSDoc to TSDoc
Transition from JSDoc to TSDoc for better TypeScript integration:

```typescript
/**
 * Creates a new user with the provided data
 * @param userData - The data for the new user
 * @returns A service response with the created user or error information
 * @example
 * ```typescript
 * const result = await userService.create({
 *   name: 'John Doe',
 *   email: 'john@example.com'
 * });
 * ```
 */
async create(userData: User): Promise<ServiceResponse<User>> {
  // Implementation
}
```

## Code Review Guidelines

### TypeScript-Specific Review Points
1. Proper use of types vs interfaces
2. Avoidance of `any` type
3. Correct generic usage
4. Proper error handling with typed errors
5. Consistent naming conventions
6. Appropriate use of type guards
7. Correct module imports/exports

## Future Considerations

### Advanced TypeScript Features
- Conditional types for complex type transformations
- Template literal types for string manipulation
- Decorators (when stage 3 proposal is stable)
- ECMAScript modules in Node.js

### Integration with Other Tools
- Type checking in CI/CD pipeline
- Automated type migration tools
- Type coverage reporting

## References
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [SERVICE_STANDARDS.md](./SERVICE_STANDARDS.md)
- [TESTING.md](./TESTING.md)
- [TypeScript Migration Strategy](../prds/typescript-migration-strategy.md)
- [Vitest Migration Evaluation](../prds/vitest-migration-evaluation.md)
