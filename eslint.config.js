import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";
import eslintConfigPrettier from "eslint-config-prettier";
import vitest from "@vitest/eslint-plugin";

export default [
  { ignores: ["dist"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" },
      ],
    },
  },
  {
    files: ["**/*.test.{ts,tsx}", "**/*.spec.{ts,tsx}"],
    plugins: {vitest},
    languageOptions: {
      globals: vitest.environments.env.globals,
    },
    rules: {
      ...vitest.configs.recommended.rules,
      // Enforce `it()` over `test()` for consistency
      "vitest/consistent-test-it": ["error", {fn: "it"}],
      // No duplicate test titles in the same describe block
      "vitest/no-identical-title": "error",
      // No committed focused tests (it.only / describe.only)
      "vitest/no-focused-tests": "error",
      // Warn on skipped tests so they're not forgotten
      "vitest/no-disabled-tests": "warn",
      // Every test body must contain at least one expect()
      "vitest/expect-expect": "error",
      // Disallow alias matchers (.toBeTruthy on strings -> toContain etc.)
      "vitest/no-alias-methods": "error",
      // prefer toBeUndefined() over toBe(undefined)
      "vitest/prefer-to-be": "error",
      // prefer toHaveLength() over toBe(x.length)
      "vitest/prefer-to-have-length": "error",
      // Prefer strict deep equality checks
      "vitest/prefer-strict-equal": "warn",
      // Catch invalid describe callback shapes
      "vitest/valid-describe-callback": "error",
      // Ensure expect() is used correctly and awaited when needed
      "vitest/valid-expect": "error",
      // Catch unhandled promise in expect chains
      "vitest/valid-expect-in-promise": "error",
      // No standalone expect outside test/it blocks
      "vitest/no-standalone-expect": "error",
    },
  },
  eslintConfigPrettier,
];
