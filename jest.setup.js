/**
 * Jest Setup for ESM
 * Makes Jest globals available for ESM modules
 */

import { jest } from '@jest/globals';

// Make Jest globals available globally
global.jest = jest;
global.expect = expect;
global.test = test;
global.describe = describe;
global.beforeEach = beforeEach;
global.afterEach = afterEach;
global.beforeAll = beforeAll;
global.afterAll = afterAll;