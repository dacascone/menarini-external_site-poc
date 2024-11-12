module.exports = {
  root: true,

  parserOptions: {
    ecmaVersion: 2021,
  },

  env: {
    node: true,
    browser: true
  },

  extends: [
    'plugin:vue/vue3-essential', // Priority A: Essential (Error Prevention)
    'airbnb-base',
    'prettier' // Assicura che Prettier disattivi le regole di formattazione di ESLint
  ],

  plugins: [
    'vue',
  ],

  globals: {
    ga: 'readonly',
    cordova: 'readonly',
    __statics: 'readonly',
    __QUASAR_SSR__: 'readonly',
    __QUASAR_SSR_SERVER__: 'readonly',
    __QUASAR_SSR_CLIENT__: 'readonly',
    __QUASAR_SSR_PWA__: 'readonly',
    process: 'readonly',
    Capacitor: 'readonly',
    chrome: 'readonly'
  },

  rules: {
    'no-plusplus': 'off',
    'no-param-reassign': 'off',
    'no-void': 'off',
    'no-nested-ternary': 'off',
    'max-classes-per-file': 'off',

    'import/first': 'off',
    'import/named': 'error',
    'import/namespace': 'error',
    'import/default': 'error',
    'import/export': 'error',
    'import/extensions': 'off',
    'import/no-unresolved': 'off',
    'import/no-extraneous-dependencies': 'off',
    'import/prefer-default-export': 'off',

    'prefer-promise-reject-errors': 'off',

    // Indentazione a 2 spazi
    'indent': ['error', 2],

    // Disabilita l'uso obbligatorio del punto e virgola
    'semi': ['error', 'never'],

    'comma-dangle': ['error', 'never'],
    // Consenti debugger solo in fase di sviluppo
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off'
  }
}
