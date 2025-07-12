// .eslintrc.cjs
module.exports = {
  root: true,
  extends: [
    '@nuxt/eslint-config',
    'plugin:@typescript-eslint/recommended'
  ],
  parser: 'vue-eslint-parser',
  parserOptions: {
    parser: '@typescript-eslint/parser',
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  rules: {
    // Only essential code quality rules
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': 'warn',
    'vue/multi-word-component-names': 'off',
    'vue/require-default-prop': 'off',
    'no-useless-escape': 'warn',
    // Disable style rules since you're not using stylistic rules
    'semi': 'off',
    'quotes': 'off',
    'comma-dangle': 'off',
    'indent': 'off',
    'space-before-function-paren': 'off'
  },
  ignorePatterns: [
    'dist',
    'node_modules',
    '.nuxt',
    '.output',
    'playground/.nuxt',
    'playground/dist',
    'scripts/*.js'
  ]
}