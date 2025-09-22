# JavaScript Testing Guide

## Overview

This project uses Vitest for JavaScript unit and integration testing, with comprehensive coverage reporting and automated quality gates. Vitest provides ~2x faster test execution compared to Jest with native ESM support.

## Quick Start

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run only unit tests
npm run test:unit

# Run only integration tests
npm run test:integration

# Run in watch mode (for development)
npm run test:watch

# Run both JS and Python tests
npm run test:all
```

## Test Structure

```
app/
├── __tests__/
│   ├── fixtures/           # Shared test data
│   ├── helpers/            # Test utility functions
│   └── integration/        # Integration tests
├── utils/
│   └── __tests__/          # Unit tests for utilities
└── vitest.config.js        # Vitest configuration
```

## Writing Tests

### Unit Tests

Place unit tests next to the code they test:

```javascript
// __tests__/unit/my-module.test.js
import { myFunction } from '../../my-module.js';
import { MockDataUtils } from '../helpers/test-utils.js';

describe('My Module', () => {
  test('should do something', () => {
    const input = MockDataUtils.createMockData();
    const result = myFunction(input);
    expect(result).toBeDefined();
  });
});
```

### Integration Tests

Place integration tests in `__tests__/integration/`:

```javascript
// __tests__/integration/feature.test.js
import { execSync } from 'child_process';

describe('Feature Integration', () => {
  test('should work end-to-end', () => {
    const output = execSync('node generate-resume.js test-app');
    expect(output.toString()).toContain('✅');
  });
});
```

## Test Utilities

### Available Helpers

```javascript
import { 
  TestFileUtils,     // File creation and cleanup
  ConsoleUtils,      // Console output capture
  MockDataUtils,     // Mock data generation
  AssertionUtils     // Custom assertions
} from '../helpers/test-utils.js';
```

### File Testing

```javascript
// Create temporary test files
const filePath = TestFileUtils.createTempFile('test.json', '{"test": true}');

// Clean up after tests
afterEach(() => {
  TestFileUtils.cleanupTempFiles();
});
```

### Console Testing

```javascript
// Capture console output
const { stdout, stderr } = ConsoleUtils.captureConsoleOutput(() => {
  console.log('test output');
  myFunction();
});

expect(stdout).toContain('test output');
```

### Mock Data

```javascript
// Generate mock resume data
const mockResume = MockDataUtils.createMockResumeData({
  name: 'Custom Name'
});

// Generate mock CLI args
const args = MockDataUtils.createMockCliArgs({
  applicationName: 'test-app',
  preview: true
});
```

## Coverage Requirements

### Current Thresholds

- **Lines**: 50% minimum
- **Functions**: 50% minimum  
- **Branches**: 50% minimum
- **Statements**: 50% minimum

### Coverage Reports

```bash
# Generate HTML coverage report
npm run test:coverage

# View report
open coverage/lcov-report/index.html
```

## Testing Patterns

### 1. Test Structure

```javascript
describe('Module Name', () => {
  describe('functionName', () => {
    test('should handle normal case', () => {
      // Arrange
      const input = 'test input';
      
      // Act
      const result = functionName(input);
      
      // Assert
      expect(result).toBe('expected output');
    });

    test('should handle edge case', () => {
      // Test edge cases, errors, etc.
    });
  });
});
```

### 2. Error Testing

```javascript
test('should handle errors gracefully', () => {
  expect(() => {
    functionThatThrows();
  }).toThrow('Expected error message');
});

test('should return error result', () => {
  const result = functionThatReturnsError();
  
  AssertionUtils.assertErrorResult(result, 'EXPECTED_ERROR_TYPE');
});
```

### 3. Async Testing

```javascript
test('should handle async operations', async () => {
  const result = await asyncFunction();
  expect(result).toBeDefined();
});

test('should handle async errors', async () => {
  await expect(asyncFunctionThatFails()).rejects.toThrow();
});
```

## Integration with Python Tests

### Unified Testing

```bash
# Run all tests (JS + Python)
npm run test:all

# This runs:
# 1. npm test (Vitest for JavaScript)
# 2. cd services/keyword-analysis && python run_tests.py
```

### Shared Standards

- Both test suites aim for 90%+ coverage
- Common error handling patterns
- Consistent test data formats
- Unified CI/CD integration

## Debugging Tests

### Common Issues

1. **Test Failures**: Check that test expectations match actual implementation
2. **Coverage Issues**: Add tests for uncovered branches and functions
3. **Flaky Tests**: Use proper setup/teardown and avoid timing dependencies

### Debug Commands

```bash
# Run specific test file
npm test __tests__/unit/my-module.test.js

# Run with verbose output
npm test -- --reporter=verbose

# Run single test
npm test -- -t "should do something"
```

## Best Practices

### 1. Test Naming

- Use descriptive test names: `should return error when input is invalid`
- Group related tests with `describe` blocks
- Use consistent naming patterns

### 2. Test Independence

- Each test should be independent
- Use `beforeEach`/`afterEach` for setup/cleanup
- Don't rely on test execution order

### 3. Mock Usage

- Mock external dependencies
- Use real implementations for unit tests when possible
- Keep mocks simple and focused

### 4. Coverage Goals

- Aim for high coverage but focus on meaningful tests
- Test edge cases and error conditions
- Don't write tests just to increase coverage numbers

## CI/CD Integration

### Pre-commit Hooks

Tests run automatically before commits:

```bash
# These run on every commit
npm test                    # All tests must pass
npm run test:coverage       # Coverage thresholds must be met
```

### Pipeline Integration

```bash
# CI/CD pipeline runs:
npm run test:all           # Both JS and Python tests
npm run test:coverage      # Coverage reporting
```

## Performance

### Test Performance

- Current test suite runs in <1 second
- Coverage generation adds ~0.5 seconds
- Integration tests may take longer (timeouts set appropriately)

### Optimization Tips

- Use `test.only()` during development to run single tests
- Use `--watch` mode for continuous testing
- Keep test data small and focused

## Troubleshooting

### Common Solutions

1. **"No tests found"**: Check file naming (*.test.js or *.spec.js)
2. **"Module not found"**: Check relative paths in require statements
3. **"Coverage threshold not met"**: Add tests or adjust thresholds in vitest.config.js

### Getting Help

- Check Vitest documentation: https://vitest.dev/guide/
- Review existing tests for patterns
- Use `--verbose` flag for detailed output

---

## Current Status

**✅ Infrastructure Complete**: Vitest setup, coverage reporting, test utilities  
**✅ Core Tests**: CLI parser, path resolver, markdown parser, error handler  
**🔄 Ongoing**: Fixing test expectations to match real implementation  
**📈 Coverage**: 19% overall (growing as tests are refined)  

**Next Steps**: Ready for error handling implementation with solid testing foundation!
