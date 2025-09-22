/**
 * ESLint Rules for Error Handling Standards
 * Custom rules to enforce consistent error handling patterns
 */



const rules = {
  'consistent-error-logging': {
    meta: {
      type: 'problem',
      docs: {
        description: 'Enforce consistent error logging using ErrorHandler',
        category: 'Best Practices',
        recommended: true,
      },
      fixable: 'code',
      schema: [],
    },
    create(context: any) {
      return {
        CallExpression(node: any) {
          // Check for console.error usage
          if (
            node.callee.type === 'MemberExpression' &&
            node.callee.object.name === 'console' &&
            node.callee.property.name === 'error'
          ) {
            // Allow console.error in test files
            const filename = context.getFilename();
            if (filename.includes('test') || filename.includes('spec')) {
              return;
            }

            context.report({
              node,
              message: 'Use ErrorHandler.logError() instead of console.error for consistent error handling',
              fix(fixer: any) {
                const sourceCode = context.getSourceCode();
                const args = node.arguments.map((arg: any) => sourceCode.getText(arg)).join(', ');
                
                return fixer.replaceText(
                  node,
                  `ErrorHandler.logError({ message: ${args} })`,
                );
              },
            });
          }
        },
      };
    },
  },

  'standardized-error-results': {
    meta: {
      type: 'problem',
      docs: {
        description: 'Enforce use of ErrorHandler.createResult() for standardized result objects',
        category: 'Best Practices',
        recommended: true,
      },
      fixable: 'code',
      schema: [],
    },
    create(context: any) {
      return {
        CallExpression(node: any) {
          // Check for direct object returns in functions that should use ErrorHandler.createResult()
          if (
            node.callee.type === 'MemberExpression' &&
            node.callee.object.type === 'Identifier' &&
            (node.callee.property.name === 'resolve' || node.callee.property.name === 'reject')
          ) {
            // Implementation would check if the resolved/rejected value follows the standard format
            // This is a simplified version
            const filename = context.getFilename();
            if (filename.includes('test') || filename.includes('spec')) {
              return;
            }

            // For now, we'll just log that this check exists
            // A full implementation would be more complex
          }
        },
      };
    },
  },

  'no-hardcoded-error-messages': {
    meta: {
      type: 'suggestion',
      docs: {
        description: 'Disallow hardcoded error messages, use ERROR_TYPES constants instead',
        category: 'Best Practices',
        recommended: false,
      },
      schema: [],
    },
    create(context: any) {
      return {
        Literal(node: any) {
          // Check for string literals that look like error messages
          if (
            typeof node.value === 'string' &&
            node.value.length > 20 &&
            (node.value.includes('error') || node.value.includes('Error') || node.value.includes('failed'))
          ) {
            // Allow in test files
            const filename = context.getFilename();
            if (filename.includes('test') || filename.includes('spec')) {
              return;
            }

            context.report({
              node,
              message: 'Use ERROR_TYPES constants instead of hardcoded error messages',
            });
          }
        },
      };
    },
  },
};

export default { rules };
