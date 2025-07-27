declare const _default: {
    rules: {
        'consistent-error-logging': {
            meta: {
                type: string;
                docs: {
                    description: string;
                    category: string;
                    recommended: boolean;
                };
                fixable: string;
                schema: never[];
            };
            create(context: any): {
                CallExpression(node: any): void;
            };
        };
        'standardized-error-results': {
            meta: {
                type: string;
                docs: {
                    description: string;
                    category: string;
                    recommended: boolean;
                };
                fixable: string;
                schema: never[];
            };
            create(context: any): {
                CallExpression(node: any): void;
            };
        };
        'no-hardcoded-error-messages': {
            meta: {
                type: string;
                docs: {
                    description: string;
                    category: string;
                    recommended: boolean;
                };
                schema: never[];
            };
            create(context: any): {
                Literal(node: any): void;
            };
        };
    };
};
export default _default;
//# sourceMappingURL=error-handling.d.ts.map