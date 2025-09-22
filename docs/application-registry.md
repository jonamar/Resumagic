# Application Registry System

## Overview
The Application Registry provides dynamic discovery and health validation for all applications in the data directory, preventing test false alarms and providing debugging capabilities.

## Problem Solved
Previously, tests used hard-coded application lists and silently skipped missing applications, causing false alarms and wasted debugging time. Now tests fail fast with clear error messages.

## Usage

### In Tests
```javascript
import { getTestableApplications, validateRequiredApplications } from '../helpers/application-registry.js';

// Get all healthy applications dynamically
const healthyApps = getTestableApplications();

// Validate specific applications exist and are healthy
validateRequiredApplications(['test-application']);
```

### CLI Health Check
```bash
# Check health of all applications
node scripts/debug/application-health.js
```

### API Reference

#### `discoverApplications()`
Returns all applications found in test/ and applications/ directories with health status.

#### `getTestableApplications(type?)`
Returns only healthy applications suitable for testing. Filter by 'test' or 'live'.

#### `validateRequiredApplications(names[])`
Throws error if any required applications are missing or unhealthy.

#### `generateHealthReport()`
Returns summary statistics and detailed health information.

## Health Statuses
- **HEALTHY**: Application has all required files and directories
- **INCOMPLETE**: Missing some components (inputs/, outputs/, resume.json)
- **MISSING**: Application directory doesn't exist
- **ERROR**: Exception occurred during health check

## Benefits
1. **No False Alarms**: Tests fail fast with clear messages instead of silent skips
2. **Dynamic Discovery**: No hard-coded application lists to maintain
3. **Health Debugging**: Easy identification of application issues
4. **Future-Proof**: Automatically adapts as applications are added/removed

## Files
- `__tests__/helpers/application-registry.js` - Core registry system
- `scripts/debug/application-health.js` - CLI health checker
- `__tests__/unit/application-registry.test.js` - Unit tests