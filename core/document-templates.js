/**
 * Main entry point for document generation
 * Re-exports all document builders for backward compatibility
 */

// Re-export document builders from compiled TypeScript
export { createResumeDocx } from '../dist/core/document-builders/resume-builder.js';
export { createCoverLetterDocx } from '../dist/core/document-builders/cover-letter-builder.js';
export { createCombinedDocx } from '../dist/core/document-builders/combined-builder.js';
