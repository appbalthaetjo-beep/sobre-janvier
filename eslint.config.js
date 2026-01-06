// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*"],
    rules: {
      // Allow localized copy with apostrophes without forcing entity escapes
      'react/no-unescaped-entities': 'off',
    },
  }
]);
