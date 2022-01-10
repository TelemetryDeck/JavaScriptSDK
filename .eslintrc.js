module.exports = {
  env: {
    browser: true,
  },
  plugins: ['prettier', 'unicorn', 'jest'],
  extends: [
    'eslint:recommended',
    'plugin:prettier/recommended',
    'plugin:unicorn/recommended',
    'plugin:jest/recommended',
  ],

  overrides: [
    {
      files: ['.eslintrc.js', 'jest.config.js', 'jest.setup.js'],
      env: {
        browser: false,
        node: true,
      },
      rules: {
        'unicorn/prefer-module': 'off',
      },
    },
    {
      files: ['tests/**/*'],
      env: {
        jest: true,
      },
    },
  ],
};
