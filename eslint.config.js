import js from "@eslint/js"
import globals from "globals"
import reactHooks from "eslint-plugin-react-hooks"
import reactRefresh from "eslint-plugin-react-refresh"
import tseslint from "typescript-eslint"

export default tseslint.config(
  {
    /**
     * Generated output is never linted — only `files` below is, and nothing here
     * was written with these files in mind.
     *
     * ⚠️ **`.preview` and `tests/.tmp` are load-bearing entries, not tidying**
     * (#111). `.preview` holds one full `dist` per build, because `vite build`
     * empties `dist` and the safe-delete guard refuses that, so each build is
     * moved aside instead — measured 2026-10-27 at **6 088** minified `.js`
     * files. `tests/.tmp` holds the esbuild bundles `load()` writes, one per
     * module, up to 8 000 lines each. Without these two entries a bare `eslint`
     * ran for **seven minutes without finishing** while `Gates` did the same
     * config in 37 s, and the one check a contributor can run before pushing was
     * the one they would skip.
     *
     * Both are gitignored, so nothing reviewable stops being linted.
     */
    ignores: ["dist", ".preview", "tests/.tmp", "archive", "node_modules", "public"],
  },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2022,
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
        { allowConstantExport: true },
      ],
    },
  },
)
