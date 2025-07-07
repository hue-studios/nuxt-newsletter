// eslint.config.mjs
// @ts-check
import { createConfigForNuxt } from "@nuxt/eslint-config/flat";

// Run `npx @eslint/config-inspector` to inspect the resolved config interactively
export default createConfigForNuxt({
  features: {
    // Rules for module authors
    tooling: true,
    // Rules for formatting - configure to match your code style
    stylistic: {
      semi: true, // This is overridden by the append section below, but good to keep consistent
      quotes: "double", // This is overridden by the append section below, but good to keep consistent
      // Add arrowParens here for global effect if you want them always
      arrowParens: "always", // Explicitly set if you want parentheses around single arrow function args
      braceStyle: "1tbs", // '1tbs' for "one true brace style" (e.g., '} else {')
    },
  },
  dirs: {
    src: ["./playground"],
  },
}).append({
  rules: {
    // TypeScript rules - more lenient
    "@typescript-eslint/no-explicit-any": "warn", // Allow any but warn
    "@typescript-eslint/no-unsafe-argument": "off",
    "@typescript-eslint/no-unsafe-assignment": "off",
    "@typescript-eslint/no-unsafe-call": "off",
    "@typescript-eslint/no-unsafe-member-access": "off",
    "@typescript-eslint/no-unsafe-return": "off",

    // Promise/async rules
    "no-async-promise-executor": "error", // Keep this as error to catch issues

    // Regex rules - more lenient for existing code
    "regexp/no-super-linear-backtracking": "warn",
    "regexp/no-misleading-capturing-group": "warn",
    "regexp/no-potentially-useless-backreference": "off",
    "regexp/optimal-quantifier-concatenation": "off",

    // Style rules to match your existing code
    "@stylistic/semi": ["error", "always"], // Require semicolons (explicitly defined here)
    "@stylistic/quotes": ["error", "double"], // Require double quotes (explicitly defined here)
    "@stylistic/comma-dangle": ["error", "only-multiline"],
    "@stylistic/arrow-parens": ["error", "always"], // Explicitly define for consistency
    "@stylistic/brace-style": ["error", "1tbs"], // Explicitly define brace style
    "@stylistic/operator-linebreak": ["error", "before"], // Or "after" if you prefer `&&` at the end of the line

    // Other common issues
    "no-console": "warn", // Allow console but warn
    "no-debugger": "warn",
    "no-unused-vars": "off", // Let TypeScript handle this
    "@typescript-eslint/no-unused-vars": [
      "warn",
      {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
      },
    ],
    "prefer-const": "error", // Keep this for good practice, fix your code
    // If you absolutely need to disable it for specific cases where `let` is truly required,
    // you can use an inline comment: `// eslint-disable-next-line prefer-const`

    // Vue/Nuxt specific
    "vue/multi-word-component-names": "off",
    "vue/no-multiple-template-root": "off",
  },

  // Ignore certain files/patterns
  ignores: ["dist/**", ".nuxt/**", ".output/**", "node_modules/**", "*.d.ts"],
});
