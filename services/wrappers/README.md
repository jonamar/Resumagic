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

## Integration

All wrappers provide standardized JSON API interfaces that are integrated into the main CLI application through the service registry.

## Usage

```javascript
import { getServiceWrapper } from './service-registry.js';

const keywordService = getServiceWrapper('keyword-analysis');
const result = await keywordService.analyze(inputData);

// All services return standardized format:
// { success: boolean, data: any, metadata: object, error?: object }
```
