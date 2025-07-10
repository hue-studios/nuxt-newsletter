// @ts-check
import { createConfigForNuxt } from "@nuxt/eslint-config/flat";

// Run `npx @eslint/config-inspector` to inspect the resolved config interactively
export default createConfigForNuxt({
  features: {
    // Rules for module authors
    tooling: true,
    // Disable stylistic rules to avoid formatting conflicts
    stylistic: false,
  },
  dirs: {
    src: ["./src", "./playground"],
  },
}).append({
  rules: {
    // Only essential code quality rules
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/no-unused-vars": "warn",
    "vue/multi-word-component-names": "off",
    "vue/require-default-prop": "off",

    // Disable problematic regex rules
    "regexp/no-super-linear-backtracking": "off",
    "regexp/no-unused-capturing-group": "off",
    "regexp/use-ignore-case": "off",
    "regexp/optimal-quantifier-concatenation": "off",

    // Allow common patterns
    "no-useless-escape": "warn",
  },
});
