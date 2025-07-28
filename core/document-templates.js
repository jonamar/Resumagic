/**
 * Main entry point for document generation
 * Re-exports all document builders for backward compatibility
 */

// Re-export document builders
export { createResumeDocx } from './document-builders/resume-builder.js';
export { createCoverLetterDocx } from './document-builders/cover-letter-builder.js';
export { createCombinedDocx } from './document-builders/combined-builder.js';
