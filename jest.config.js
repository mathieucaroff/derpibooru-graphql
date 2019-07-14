const testFilePatterns = {
    'unit': '**/*.test.ts',
    'e2e': '**/tests/**/*.e2e.ts',
    'all': '**/*.test.ts|**/tests/**/*.e2e.ts'
};

module.exports = {
    globals: {
        'ts-jest': {
            tsConfig: 'tsconfig.json'
        }
    },
    setupFiles: [
        './setup-tests.ts'
    ],
    moduleFileExtensions: [
        'ts',
        'js'
    ],
    transform: {
        '^.+\\.(ts|tsx)$': 'ts-jest'
    },
    testMatch: [
        testFilePatterns[process.env.TEST_TYPE || 'unit']
    ],
    testEnvironment: 'node'
};
