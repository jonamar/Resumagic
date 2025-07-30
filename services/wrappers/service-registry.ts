/**
 * Service Registry
 * Central registry for all standardized service wrappers
 * Part of Phase 2: Standardize Existing Service Infrastructure
 */

import KeywordAnalysisWrapper from './keyword-analysis-wrapper';
import HiringEvaluationWrapper from './hiring-evaluation-wrapper';
import DocumentGenerationWrapper from './document-generation-wrapper';
import ValeLintingWrapper from './vale-linting-wrapper';
import { getFeatureFlags } from '../../utils/feature-flags';

/**
 * Registry of all available service wrappers
 */
const SERVICE_REGISTRY = {
  'keyword-analysis': KeywordAnalysisWrapper,
  'hiring-evaluation': HiringEvaluationWrapper,
  'document-generation': DocumentGenerationWrapper,
  'vale-linting': ValeLintingWrapper,
};

/**
 * Singleton instances of service wrappers
 */
const serviceInstances = new Map();

/**
 * Get a service wrapper instance
 * @param {string} serviceName - Name of the service
 * @returns {BaseServiceWrapper} - Service wrapper instance
 * @throws {Error} - If service is not found
 */
function getServiceWrapper(serviceName) {
  if (!SERVICE_REGISTRY[serviceName]) {
    throw new Error(`Service '${serviceName}' not found. Available services: ${Object.keys(SERVICE_REGISTRY).join(', ')}`);
  }

  // Return singleton instance
  if (!serviceInstances.has(serviceName)) {
    const ServiceClass = SERVICE_REGISTRY[serviceName];
    serviceInstances.set(serviceName, new ServiceClass());
  }

  return serviceInstances.get(serviceName);
}

/**
 * Get all available service names
 * @returns {Array<string>} - Array of service names
 */
function getAvailableServices() {
  return Object.keys(SERVICE_REGISTRY);
}

/**
 * Check if a service is available
 * @param {string} serviceName - Name of the service
 * @returns {boolean} - Whether the service is available
 */
function isServiceAvailable(serviceName) {
  return serviceName in SERVICE_REGISTRY;
}

/**
 * Get service health status for all services
 * @returns {Promise<Object>} - Health status for all services
 */
async function getServicesHealthStatus() {
  const healthStatus = {
    timestamp: new Date().toISOString(),
    overall_status: 'unknown',
    services: {},
    feature_flags: getFeatureFlags().getAll(),
  };

  let allHealthy = true;
  let anyHealthy = false;

  for (const serviceName of getAvailableServices()) {
    try {
      const service = getServiceWrapper(serviceName);
      
      // Check if service has validateCapabilities method
      let status = 'unknown';
      if (typeof service.validateCapabilities === 'function') {
        const result = await service.validateCapabilities();
        status = result.success ? 'healthy' : 'unhealthy';
        healthStatus.services[serviceName] = {
          status,
          implementation: 'standardized',
          details: result.data || result.error,
        };
      } else {
        // Basic availability check
        status = 'available';
        healthStatus.services[serviceName] = {
          status,
          implementation: 'standardized',
          details: { message: 'Service wrapper instantiated successfully' },
        };
      }

      if (status === 'healthy' || status === 'available') {
        anyHealthy = true;
      } else {
        allHealthy = false;
      }

    } catch (error) {
      allHealthy = false;
      healthStatus.services[serviceName] = {
        status: 'error',
        implementation: 'standardized',
        details: { error: error.message },
      };
    }
  }

  // Determine overall status
  if (allHealthy) {
    healthStatus.overall_status = 'healthy';
  } else if (anyHealthy) {
    healthStatus.overall_status = 'degraded';
  } else {
    healthStatus.overall_status = 'unhealthy';
  }

  return healthStatus;
}

/**
 * Batch execute operations across multiple services
 * @param {Array} operations - Array of operation objects
 * @param {string} operations[].service - Service name
 * @param {string} operations[].method - Method name
 * @param {Object} operations[].input - Input data
 * @returns {Promise<Array>} - Array of results
 */
async function batchExecute(operations) {
  if (!Array.isArray(operations)) {
    throw new Error('Operations must be an array');
  }

  const promises = operations.map(async (operation, index) => {
    try {
      const { service: serviceName, method, input } = operation;
      
      if (!serviceName || !method || !input) {
        throw new Error(`Operation ${index} missing required fields: service, method, input`);
      }

      const service = getServiceWrapper(serviceName);
      
      if (typeof service[method] !== 'function') {
        throw new Error(`Method '${method}' not found on service '${serviceName}'`);
      }

      const result = await service[method](input);
      return {
        operation_index: index,
        success: true,
        result,
      };

    } catch (error) {
      return {
        operation_index: index,
        success: false,
        error: {
          message: error.message,
          operation: operation,
        },
      };
    }
  });

  return Promise.all(promises);
}

/**
 * Clear all service instances (useful for testing)
 */
function clearServiceInstances() {
  serviceInstances.clear();
}

/**
 * Get service configuration summary
 * @returns {Object} - Configuration summary
 */
function getServiceConfiguration() {
  return {
    available_services: getAvailableServices(),
    total_services: getAvailableServices().length,
    implementation: 'standardized',
    registry_info: {
      singleton_instances: serviceInstances.size,
      initialization_time: new Date().toISOString(),
    },
  };
}

export {
  getServiceWrapper,
  getAvailableServices,
  isServiceAvailable,
  getServicesHealthStatus,
  batchExecute,
  clearServiceInstances,
  getServiceConfiguration,
};
