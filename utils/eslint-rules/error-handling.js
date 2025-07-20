/**
 * ESLint Rules for Error Handling Standards
 * Custom rules to enforce consistent error handling patterns
 */

module.exports = {
  rules: {
    'consistent-error-logging': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Enforce consistent error logging using ErrorHandler',
          category: 'Best Practices',
          recommended: true
        },
        fixable: 'code',
        schema: []
      },
      create(context) {
        return {
          CallExpression(node) {
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
                fix(fixer) {
                  const sourceCode = context.getSourceCode();
                  const args = node.arguments.map(arg => sourceCode.getText(arg)).join(', ');
                  
                  return fixer.replaceText(
                    node,
                    `ErrorHandler.logError({ message: ${args} })`
                  );
                }
              });
            }
          }
        };
      }
    },

    'require-error-context': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Require context information in error handling',
          category: 'Best Practices',
          recommended: true
        },
        schema: []
      },
      create(context) {
        return {
          CallExpression(node) {
            // Check for ErrorHandler.logError calls
            if (
              node.callee.type === 'MemberExpression' &&
              node.callee.object.name === 'ErrorHandler' &&
              node.callee.property.name === 'logError'
            ) {
              const arg = node.arguments[0];
              if (arg && arg.type === 'ObjectExpression') {
                const hasContext = arg.properties.some(prop => 
                  prop.key && prop.key.name === 'context'
                );
                const hasDetails = arg.properties.some(prop => 
                  prop.key && prop.key.name === 'details'
                );

                if (!hasContext && !hasDetails) {
                  context.report({
                    node,
                    message: 'Error logging should include context or details for better debugging'
                  });
                }
              }
            }
          }
        };
      }
    },

    'standardized-error-results': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Enforce use of ErrorHandler.createResult for consistent return values',
          category: 'Best Practices',
          recommended: true
        },
        schema: []
      },
      create(context) {
        return {
          ReturnStatement(node) {
            if (node.argument && node.argument.type === 'ObjectExpression') {
              const properties = node.argument.properties;
              const hasIsValid = properties.some(prop => 
                prop.key && prop.key.name === 'isValid'
              );
              const hasError = properties.some(prop => 
                prop.key && prop.key.name === 'error'
              );

              // If it looks like an error result object, suggest using ErrorHandler.createResult
              if (hasIsValid || hasError) {
                const hasSuccess = properties.some(prop => 
                  prop.key && prop.key.name === 'success'
                );

                if (!hasSuccess) {
                  context.report({
                    node,
                    message: 'Consider using ErrorHandler.createResult() for standardized error results'
                  });
                }
              }
            }
          }
        };
      }
    },

    'no-hardcoded-error-messages': {
      meta: {
        type: 'suggestion',
        docs: {
          description: 'Discourage hardcoded error messages in favor of structured error handling',
          category: 'Best Practices',
          recommended: false
        },
        schema: []
      },
      create(context) {
        const errorPatterns = [
          /error:/i,
          /failed:/i,
          /invalid/i,
          /not found/i,
          /missing/i
        ];

        return {
          Literal(node) {
            if (typeof node.value === 'string') {
              const hasErrorPattern = errorPatterns.some(pattern => 
                pattern.test(node.value)
              );

              if (hasErrorPattern && node.value.length > 10) {
                context.report({
                  node,
                  message: 'Consider using structured error handling instead of hardcoded error messages'
                });
              }
            }
          }
        };
      }
    }
  }
};
