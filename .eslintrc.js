const { FlatCompat } = require("@eslint/eslintrc");
const js = require("@eslint/js");
const typescriptEslint = require("@typescript-eslint/eslint-plugin");
const typescriptParser = require("@typescript-eslint/parser");
const boundaries = require("eslint-plugin-boundaries");

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
});

module.exports = [
  ...compat.extends("eslint:recommended", "plugin:@typescript-eslint/recommended"),
  {
    languageOptions: {
      parser: typescriptParser,
    },
    plugins: {
      "@typescript-eslint": typescriptEslint,
      boundaries,
    },
    rules: {
      "boundaries/element-types": ["error", {
        default: "disallow",
        rules: [
          { from: ["apps/web"], allow: ["packages/api-client", "packages/contracts"] },
          { from: ["apps/bff"], allow: ["packages/services", "packages/contracts"] },
          { from: ["packages/services"], allow: ["packages/contracts"] }
        ]
      }]
    },
  },
  {
    ignores: ["**/dist/**", "**/.next/**", "**/types.gen.ts", "**/node_modules/**", "**/.turbo/**"]
  }
];
