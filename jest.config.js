// FILE: jest.config.js
/** @type {import('ts-jest').JestConfigWithTsJest} */
export const preset = 'ts-jest';
export const testEnvironment = 'node';
export const testMatch = ['**/tests/**/*.test.ts', '**/*.test.ts'];
export const verbose = true;
export const forceExit = true;
export const clearMocks = true;
export const resetMocks = true;
export const restoreMocks = true;