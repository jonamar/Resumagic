# Service Standardization Standards

## Overview

This document defines the standardized patterns for service interfaces across the Resumagic polyglot architecture. All services (Node.js, Python, Go) must follow these patterns to ensure consistency, maintainability, and AI-agent compatibility.

## Core Principles

### 1. Unified Interface Contract
- **JSON Input/Output**: All services accept and return JSON data
- **Consistent Error Handling**: Standard error format across all languages
- **Standard Response Structure**: Identical response format for all services
- **Metadata Inclusion**: Performance and operational data in every response

### 2. Feature Flag Architecture
- **Safe Migration**: Feature flags control legacy vs standardized implementations
- **Instant Rollback**: Immediate reversion capability for any service
- **Gradual Rollout**: Percentage-based rollout for risk mitigation
- **Golden Master Validation**: Behavioral consistency verification

### 3. Configuration Standardization
- **Unified Config System**: Single configuration source across all languages
- **Environment Overrides**: Environment variables for deployment flexibility
- **Service-Specific Sections**: Dedicated config sections per service
- **Validation**: Configuration validation for operational safety

## Standard Service Interface

### Request Format
```json
{
  "input": {
    // Service-specific input data
  },
  "options": {
    "timeout": 30000,
    "retries": 3,
    "validateOnly": false
  },
  "metadata": {
    "requestId": "uuid",
    "clientVersion": "1.0.0",
    "timestamp": "2025-01-01T00:00:00Z"
  }
}
```

### Response Format
```json
{
  "service": "service-name",
  "version": "1.0.0",
  "success": true,
  "data": {
    // Service-specific output data
  },
  "error": {
    "code": "ERROR_TYPE",
    "message": "Human readable message",
    "details": {
      // Additional error context
    }
  },
  "metadata": {
    "duration_ms": 1234,
    "timestamp": "2025-01-01T00:00:00Z",
    "implementation": "standardized",
    "requestId": "uuid"
  }
}
```

### Error Codes
Standard error codes that all services must use:

- `INVALID_INPUT`: Input validation failed
- `EXECUTION_ERROR`: Service execution failed
- `TIMEOUT_ERROR`: Service execution timed out
- `CONFIGURATION_ERROR`: Service configuration invalid
- `DEPENDENCY_ERROR`: External dependency unavailable
- `RESOURCE_ERROR`: Insufficient resources (memory, disk, etc.)
- `PERMISSION_ERROR`: Access denied or insufficient permissions

## Service Implementation Pattern

### 1. Adapter Pattern
All services implement the adapter pattern using the service adapter template:

```javascript
// Use templates/service-adapter-template.js as starting point
class ServiceAdapter {
  async execute(input) {
    // 1. Validate input
    // 2. Check feature flag for implementation choice
    // 3. Execute legacy or standardized implementation
    // 4. Return standardized response
  }
  
  async executeLegacyService(input) {
    // Call existing service implementation
  }
  
  async executeStandardizedService(input) {
    // New JSON-based implementation
  }
}
```

### 2. Feature Flag Integration
Every service must support feature flag toggling:

```javascript
import FeatureFlagHelper from '../toolkit/feature-flag-helper.js';

const featureFlags = new FeatureFlagHelper();
const useStandardized = featureFlags.useStandardizedService('serviceName');
```

### 3. Golden Master Validation
Services must validate behavioral consistency:

```javascript
import GoldenMasterValidator from '../toolkit/golden-master-validator.js';

// Create baseline from legacy implementation
await validator.createBaseline('service-test', legacyFunction, testInput);

// Validate standardized implementation matches
const result = await validator.validate('service-test', standardizedFunction, testInput);
```

## Logging Standards

### Structured Logging
All services must use structured logging for consistency:

```javascript
import { createLogger } from '../toolkit/structured-logger.js';

const logger = createLogger('service-name');

// Standard log methods
logger.info('Operation started', { operation: 'processData', inputSize: data.length });
logger.error('Operation failed', { operation: 'processData' }, error);

// Service-specific helpers
logger.serviceStart('processData', input);
logger.serviceComplete('processData', duration, output);
logger.serviceError('processData', error, input);
```

### Log Levels
- **DEBUG**: Detailed diagnostic information
- **INFO**: General operational information
- **WARN**: Warning conditions that should be noted
- **ERROR**: Error conditions that don't stop execution
- **FATAL**: Critical errors that stop execution

## Configuration Standards

### Unified Configuration
Services must use the unified configuration system:

```javascript
import UnifiedConfig from '../toolkit/unified-config.js';

const config = new UnifiedConfig();
const serviceConfig = config.getServiceConfig('serviceName');
const timeout = config.get('services.serviceName.timeout', 30000);
```

### Service Configuration Structure
```json
{
  "services": {
    "serviceName": {
      "enabled": true,
      "timeout": 30000,
      "retries": 3,
      "config": {
        // Service-specific configuration
      }
    }
  }
}
```

### Environment Variable Support
Configuration supports environment variable overrides:
```bash
# Override service timeout
RESUMAGIC_SERVICES_SERVICENAME_TIMEOUT=60000

# Override service-specific config
RESUMAGIC_SERVICES_SERVICENAME_CONFIG_MAXITEMS=500
```

## Migration Process

### Phase 1: Preparation
1. **Copy Template**: Use `templates/service-adapter-template.js`
2. **Rename and Customize**: Replace placeholders with service-specific values
3. **Implement Legacy Wrapper**: Wrap existing service calls
4. **Add Input Validation**: Implement service-specific validation rules

### Phase 2: Golden Master Creation
1. **Create Test Input**: Define representative test data
2. **Generate Baseline**: `node service-adapter.js create-golden-master`
3. **Verify Legacy Works**: `node service-adapter.js test-legacy`
4. **Document Expected Output**: Save golden master for comparison

### Phase 3: Standardized Implementation
1. **Implement New Logic**: Build JSON-in/JSON-out version
2. **Iterative Development**: Compare outputs with `node service-adapter.js compare`
3. **Achieve Parity**: Ensure identical outputs between implementations
4. **Validate Thoroughly**: Run comprehensive test suite

### Phase 4: Migration
1. **Enable Feature Flag**: `node feature-flag-helper.js enable services.serviceName.useStandardizedWrapper`
2. **Validate in Production**: Monitor for issues
3. **Performance Testing**: Ensure no performance regression
4. **Remove Legacy Code**: After validation period

### Phase 5: Cleanup
1. **Update Documentation**: Document new standardized interface
2. **Remove Feature Flag**: Once migration is complete
3. **Archive Legacy Code**: Keep for reference but remove from active codebase

## Service-Specific Guidelines

### Node.js Services
- Use ES modules (`import`/`export`)
- Implement async/await patterns
- Follow existing error handling conventions
- Use structured logging throughout

### Python Services
- Accept JSON input via stdin or file
- Return JSON output via stdout
- Use consistent error exit codes
- Implement timeout handling

### Go Services
- Accept JSON input via stdin
- Return JSON output via stdout
- Use consistent error handling
- Implement context cancellation

## Testing Requirements

### Unit Tests
- Test both legacy and standardized implementations
- Validate input/output contracts
- Test error conditions and edge cases
- Performance benchmarking

### Integration Tests
- Golden master validation
- End-to-end workflow testing
- Feature flag toggle testing
- Configuration validation

### Performance Tests
- Baseline performance measurement
- Regression detection
- Memory usage monitoring
- Timeout handling validation

## Quality Checklist

Before marking a service as "standardized", verify:

- [ ] Implements standard interface contract
- [ ] Uses feature flags for safe migration
- [ ] Has golden master validation
- [ ] Uses structured logging
- [ ] Uses unified configuration
- [ ] Has comprehensive test coverage
- [ ] Passes all integration tests
- [ ] Performance meets baseline requirements
- [ ] Documentation is updated
- [ ] Migration process is documented

## Maintenance Guidelines

### Regular Maintenance
- **Weekly**: Review feature flag status
- **Monthly**: Update golden masters if business logic changes
- **Quarterly**: Performance baseline review
- **Annually**: Architecture pattern review

### Emergency Procedures
- **Rollback**: Disable feature flag immediately
- **Debug**: Check structured logs for error context
- **Validate**: Re-run golden master tests
- **Escalate**: Contact development team with full context

## Tools and Utilities

### Migration Toolkit
- `toolkit/feature-flag-helper.js`: Feature flag management
- `toolkit/golden-master-validator.js`: Behavioral validation
- `toolkit/structured-logger.js`: Consistent logging
- `toolkit/unified-config.js`: Configuration management

### Templates
- `templates/service-adapter-template.js`: Service standardization template

### CLI Commands
```bash
# Feature flag management
node toolkit/feature-flag-helper.js list
node toolkit/feature-flag-helper.js enable services.serviceName.useStandardizedWrapper

# Configuration management
node toolkit/unified-config.js get services.serviceName
node toolkit/unified-config.js validate serviceName

# Golden master validation
node toolkit/golden-master-validator.js list
node service-adapter.js compare

# Logging management
node toolkit/structured-logger.js enable
node toolkit/structured-logger.js test
```

## Troubleshooting

### Common Issues

**Golden Master Validation Fails**
- Check for timestamp fields being included in comparison
- Verify input normalization is working correctly
- Ensure both implementations use same input

**Feature Flag Not Working**
- Verify `.feature-flags.json` file exists and is readable
- Check flag path syntax (dot notation)
- Ensure feature flag helper is imported correctly

**Configuration Not Loading**
- Check `.resumagic-config.json` file exists
- Verify environment variable naming (RESUMAGIC_ prefix)
- Ensure unified config feature flag is enabled

**Structured Logging Not Working**
- Verify structured logging feature flag is enabled
- Check log level configuration
- Ensure logger is created with correct service name

### Performance Issues
- **High Memory Usage**: Check for memory leaks in new implementation
- **Slow Response Times**: Compare with baseline performance metrics
- **High CPU Usage**: Profile both implementations for comparison

### Integration Issues
- **Service Timeouts**: Check service timeout configuration
- **Dependency Failures**: Validate external service availability
- **Data Format Issues**: Verify JSON serialization/deserialization

## Future Considerations

### Planned Enhancements
- **Metrics Collection**: Automated performance metrics
- **Health Checks**: Service health monitoring
- **Circuit Breakers**: Fault tolerance patterns
- **Load Balancing**: Multiple service instance support

### Migration Path
This standardization approach provides a clear path for:
- **Microservice Extraction**: Services can be easily extracted
- **Container Deployment**: Standard interfaces support containerization
- **API Gateway Integration**: Unified interfaces work with API gateways
- **Monitoring Integration**: Standard patterns enable observability

## Conclusion

Following these standards ensures:
- **Consistency**: Predictable patterns across all services
- **Maintainability**: Clear separation of concerns and responsibilities
- **Reliability**: Proven patterns with safety mechanisms
- **Evolution**: Foundation for future architectural improvements

The standardization toolkit provides all necessary utilities for safe, gradual migration while maintaining full backward compatibility and operational safety.