# Service Standardization Standards

## Overview

This document defines the standardized patterns for service interfaces across the Resumagic polyglot architecture. All services (Node.js, Python, Go) must follow these patterns to ensure consistency, maintainability, and AI-agent compatibility.

## Core Principles

### 1. Unified Interface Contract
- **JSON Input/Output**: All services accept and return JSON data
- **Consistent Error Handling**: Standard error format across all languages
- **Standard Response Structure**: Identical response format for all services
- **Metadata Inclusion**: Performance and operational data in every response

### 2. Service Wrapper Architecture
- **Unified Interface**: All services implement consistent JSON APIs through service wrappers
- **Performance Monitoring**: Automatic duration tracking and metadata collection
- **Error Standardization**: Consistent error handling patterns across all services
- **Registry Pattern**: Centralized service discovery and management

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

### 1. Service Wrapper Pattern
All services implement the service wrapper pattern extending BaseServiceWrapper:

```javascript
class ServiceWrapper extends BaseServiceWrapper {
  constructor() {
    super('service-name');
  }

  async execute(input) {
    // 1. Validate input
    // 2. Execute service implementation
    // 3. Return standardized response
  }

  async executeService(input, startTime) {
    // Service-specific implementation
    // Returns standardized JSON response
  }
}
```

### 2. Service Registry Integration
All services must be registered in the service registry:

```javascript
import { getServiceWrapper } from './services/wrappers/service-registry.js';

const service = getServiceWrapper('service-name');
const result = await service.execute(input);
```

### 3. Input Validation
Services must validate input using BaseServiceWrapper validation:

```javascript
this.validateInput(input, {
  requiredField: { type: 'string', required: true },
  optionalField: { type: 'number', required: false }
});
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

### Configuration Access
Services access configuration through BaseServiceWrapper:

```javascript
// Service wrappers inherit configuration access from BaseServiceWrapper
// Configuration is automatically loaded and available to all services
const timeout = this.getTimeout(); // Returns service-specific timeout
const config = this.getServiceConfig(); // Returns service-specific configuration
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

## Service Development Process

### Phase 1: Setup
1. **Extend BaseServiceWrapper**: Create new service wrapper extending BaseServiceWrapper
2. **Implement Constructor**: Call super() with service name
3. **Add Input Validation**: Define service-specific validation rules
4. **Register Service**: Add to service registry for discovery

### Phase 2: Implementation
1. **Implement execute() Method**: Main service entry point
2. **Add Service Logic**: Implement executeService() with business logic
3. **Error Handling**: Use standardized error response patterns
4. **Logging**: Add structured logging throughout

### Phase 3: Testing
1. **Unit Tests**: Test service wrapper functionality
2. **Integration Tests**: Test service registry integration
3. **Performance Testing**: Establish baseline performance metrics
4. **Error Testing**: Validate error handling scenarios

### Phase 4: Integration
1. **Update CLI**: Integrate service through service registry
2. **Documentation**: Update service documentation
3. **Monitoring**: Add performance and health monitoring
4. **Deployment**: Deploy and monitor service behavior

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
- Test service wrapper functionality
- Validate input/output contracts
- Test error conditions and edge cases
- Performance benchmarking

### Integration Tests
- Service registry integration
- End-to-end workflow testing
- CLI integration validation
- Error handling validation

### Performance Tests
- Baseline performance measurement
- Regression detection
- Memory usage monitoring
- Timeout handling validation

## Quality Checklist

Before marking a service as \"complete\", verify:

- [ ] Extends BaseServiceWrapper properly
- [ ] Implements standard interface contract
- [ ] Uses structured logging through BaseServiceWrapper
- [ ] Registered in service registry
- [ ] Has comprehensive test coverage
- [ ] Passes all integration tests
- [ ] Performance meets baseline requirements
- [ ] Documentation is updated
- [ ] CLI integration is complete

## Maintenance Guidelines

### Regular Maintenance
- **Weekly**: Review service performance metrics
- **Monthly**: Update service tests if business logic changes
- **Quarterly**: Performance baseline review
- **Annually**: Architecture pattern review

### Emergency Procedures
- **Debug**: Check structured logs for error context
- **Validate**: Re-run service tests
- **Monitor**: Check service registry health status
- **Escalate**: Contact development team with full context

## Tools and Utilities

### Service Development Toolkit
- `services/wrappers/base-service-wrapper.js`: Base class for all service wrappers
- `services/wrappers/service-registry.js`: Service discovery and management
- Built-in structured logging through BaseServiceWrapper
- Built-in configuration management through BaseServiceWrapper

### Examples
- See existing service wrappers in `services/wrappers/` for implementation patterns

### CLI Commands
```bash
# Service registry management
node -e "import { getAvailableServices } from './services/wrappers/service-registry.js'; console.log(getAvailableServices());"

# Service testing
npm test  # Run complete test suite including service wrapper tests

# Service health check
node -e "import { getServicesHealthStatus } from './services/wrappers/service-registry.js'; getServicesHealthStatus().then(console.log);"


```

## Troubleshooting

### Common Issues

**Service Not Found in Registry**
- Verify service wrapper is properly exported
- Check service name matches registry configuration
- Ensure service extends BaseServiceWrapper correctly

**Service Execution Fails**
- Check input validation requirements
- Verify service dependencies are available
- Review structured logs for error details

**Performance Issues**
- Check service timeout configuration
- Monitor memory usage during execution
- Review service implementation for bottlenecks

**Configuration Issues**
- Verify service configuration structure
- Check environment variable overrides
- Ensure BaseServiceWrapper inheritance is correct

### Integration Issues
- **Service Timeouts**: Check service timeout configuration
- **Dependency Failures**: Validate external service availability
- **Data Format Issues**: Verify JSON serialization/deserialization
- **Registry Issues**: Ensure service is properly registered and discoverable

## Future Considerations

### Planned Enhancements
- **Metrics Collection**: Automated performance metrics
- **Health Checks**: Service health monitoring
- **Circuit Breakers**: Fault tolerance patterns
- **Load Balancing**: Multiple service instance support

### Evolution Path
This service wrapper architecture provides a foundation for:
- **Microservice Extraction**: Services can be easily extracted as independent services
- **Container Deployment**: Standard interfaces support containerization
- **API Gateway Integration**: Unified interfaces work with API gateways
- **Monitoring Integration**: Standard patterns enable comprehensive observability

## Conclusion

Following these standards ensures:
- **Consistency**: Predictable patterns across all services
- **Maintainability**: Clear separation of concerns and responsibilities
- **Reliability**: Proven patterns with safety mechanisms
- **Evolution**: Foundation for future architectural improvements

The service wrapper architecture provides a clean, maintainable foundation for polyglot service integration with comprehensive monitoring and error handling.