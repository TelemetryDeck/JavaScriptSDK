module.exports = {
  env: {
    node: true,
    browser: true,
  },
  globals: {
    globalThis: true,
  },
  plugins: ['prettier', 'unicorn', 'ava'],
  extends: [
    'eslint:recommended',
    'plugin:prettier/recommended',
    'plugin:unicorn/recommended',
    'plugin:ava/recommended',
  ],
  rules: {
    'unicorn/prefer-module': 'off',
  },
};
