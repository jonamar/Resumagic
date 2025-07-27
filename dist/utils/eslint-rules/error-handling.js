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
    create(context) {
      return {
        CallExpression(node) {
          if (node.callee.type === 'MemberExpression' &&
                        node.callee.object.name === 'console' &&
                        node.callee.property.name === 'error') {
            const filename = context.getFilename();
            if (filename.includes('test') || filename.includes('spec')) {
              return;
            }
            context.report({
              node,
              message: 'Use ErrorHandler.logError() instead of console.error for consistent error handling',
              fix(fixer) {
                const sourceCode = context.getSourceCode();
                const args = node.arguments.map((arg) => sourceCode.getText(arg)).join(', ');
                return fixer.replaceText(node, `ErrorHandler.logError({ message: ${args} })`);
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
    create(context) {
      return {
        CallExpression(node) {
          if (node.callee.type === 'MemberExpression' &&
                        node.callee.object.type === 'Identifier' &&
                        (node.callee.property.name === 'resolve' || node.callee.property.name === 'reject')) {
            const filename = context.getFilename();
            if (filename.includes('test') || filename.includes('spec')) {
              return;
            }
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
    create(context) {
      return {
        Literal(node) {
          if (typeof node.value === 'string' &&
                        node.value.length > 20 &&
                        (node.value.includes('error') || node.value.includes('Error') || node.value.includes('failed'))) {
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
//# sourceMappingURL=error-handling.js.map
