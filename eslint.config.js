import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
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
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true, allowExportNames: ["loader", "action", "meta"] },
      ],
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-explicit-any": "off", // Too many to fix at once
      "@typescript-eslint/no-empty-object-type": "off",
      "@typescript-eslint/no-unused-expressions": "error",
      "no-useless-catch": "error",
      "@typescript-eslint/no-require-imports": "off",
      "react-hooks/exhaustive-deps": "off", // Can cause infinite loops if not carefully handled
    },
  },
  // Disable react-refresh warnings for specific file patterns
  {
    files: [
      "**/components/ui/**/*.{ts,tsx}",
      "**/components/applicant-table/**/*.{ts,tsx}",
      "**/*Context.{ts,tsx}",
      "**/utils/**/*.{ts,tsx}",
      "**/hooks/**/*.{ts,tsx}",
    ],
    rules: {
      "react-refresh/only-export-components": "off",
    },
  },
);
