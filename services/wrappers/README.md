# Service Wrappers

## Overview

This directory contains standardized JSON API wrappers for all services in the polyglot architecture. Each wrapper provides a consistent interface while maintaining compatibility with existing implementations.

## Architecture

```
wrappers/
├── README.md                     # This file
├── base-service-wrapper.js       # Base class for all service wrappers
├── keyword-analysis-wrapper.js   # Wrapper for Python keyword analysis
├── hiring-evaluation-wrapper.js  # Wrapper for Node.js hiring evaluation
├── document-generation-wrapper.js # Wrapper for document orchestration
└── service-registry.js           # Central registry for all services
```

## Standards

All service wrappers follow the same JSON API pattern:

```javascript
{
  success: boolean,
  data: any,           // Service-specific response data
  metadata: {
    service: string,   // Service name
    version: string,   // Wrapper version
    duration: number,  // Execution time in ms
    timestamp: string  // ISO timestamp
  },
  error?: {
    code: string,      // Error code
    message: string,   // Human-readable message
    details?: any      // Additional error details
  }
}
```

## Feature Flag Integration

Each wrapper respects feature flags to toggle between:
- Legacy shell-based execution
- New standardized JSON API calls

## Usage

```javascript
const { getServiceWrapper } = require('./service-registry');

const keywordService = getServiceWrapper('keyword-analysis');
const result = await keywordService.analyze(inputData);
```
