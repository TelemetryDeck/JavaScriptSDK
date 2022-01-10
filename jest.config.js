/*
 * For a detailed explanation regarding each configuration property, visit:
 * https://jestjs.io/docs/configuration
 */

const { defaults } = require('jest-config');
const crypto = require('crypto');
const { TextEncoder } = require('util');

module.exports = {
  clearMocks: true,
  collectCoverage: false,
  globals: {
    ...defaults.globals,
    crypto: {
      subtle: {
        digest: crypto.webcrypto.subtle.digest,
      },
    },
    TextEncoder,
  },
  moduleFileExtensions: ['mjs', 'js', 'json'],
  preset: 'rollup-jest',
  setupFiles: ['./jest.setup.js'],
  testEnvironment: 'jsdom',
  testPathIgnorePatterns: ['/node_modules/'],
  testRegex: '((\\.|/)(test|spec))\\.(mjs?|js?|tsx?|ts?)$',
  transformIgnorePatterns: ['\\.pnp\\.[^\\/]+$'],
};
