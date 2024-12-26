import globals from "globals";
import pluginJs from "@eslint/js";
import jest from "eslint-plugin-jest";


/** @type {import('eslint').Linter.Config[]} */
export default [
  {languageOptions: { globals: {...globals.browser, ...globals.node} }},
  pluginJs.configs.recommended,
  {
    rules: {
      "no-unused-vars": "warn",
    }
  },
  {
    ignores: ["dist/*"]
  },
  {
    // files: ["**/*.test.js"],
    files: ["**/*.test.js", "**/__tests__/*.js"],
    ...jest.configs["flat/recommended"],
    rules: {
      ...jest.configs["flat/recommended"].rules,

    }
  }
];
