/**
 * Jest Setup for ESM
 * Makes Jest globals available for ESM modules
 */

// Jest automatically provides jest and expect globals
// This file is kept for compatibility with ESM modules

global.test = test;
global.describe = describe;
global.beforeEach = beforeEach;
global.afterEach = afterEach;
global.beforeAll = beforeAll;
global.afterAll = afterAll;
