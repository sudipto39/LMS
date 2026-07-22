import js from "@eslint/js";

export default [
  {
    ignores: ["dist/**", "node_modules/**", "src/generated/**"],
  },
  js.configs.recommended,
  {
    rules: {
      "no-unused-vars": "warn",
      "no-console": "off",
      "no-undef": "off",
    },
  },
];
