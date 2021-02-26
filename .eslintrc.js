module.exports = {
    env: {
        browser: true,
        commonjs: true,
        es2021: true,
        node: true,
        mocha: true
    },
    extends: ['airbnb-base'],
    parserOptions: {
        ecmaVersion: 12
    },
    rules: {
        'import/newline-after-import': 0,
        indent: ['error', 4],
        'no-tabs': 0,
        'no-unused-vars': 'warn',
        'no-console': 'error',
        'consistent-return': 0,
        strict: 0,
        'padded-blocks': 0,
        'prefer-destructuring': 0,
        'comma-dangle': ['error', 'never'],
        'max-len': ['error', {code: 120}],
        'object-curly-spacing': ['error', 'never'],
        'no-restricted-syntax': ['error', 'ForInStatement', 'LabeledStatement', 'WithStatement'],
        'no-await-in-loop': 0,
        'no-continue': 0
    }
};
