module.exports = {
  env: {
    browser: true,
  },
  plugins: ['prettier', 'unicorn'],
  extends: ['eslint:recommended', 'plugin:prettier/recommended', 'plugin:unicorn/recommended'],

  overrides: [
    {
      files: ['.eslintrc.js'],
      env: {
        browser: false,
        node: true,
      },
      rules: {
        'unicorn/prefer-module': 'off',
      },
    },
  ],
};
