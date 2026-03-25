export default [
  {
    files: ["src/**/*.{js,jsx}"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        window: "readonly",
        document: "readonly",
        navigator: "readonly",
        screen: "readonly",
        sessionStorage: "readonly",
        crypto: "readonly",
        fetch: "readonly",
        console: "readonly",
        process: "readonly",
        setTimeout: "readonly",
        Date: "readonly",
        Map: "readonly",
        URL: "readonly",
        JSON: "readonly",
        require: "readonly",
      },
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    rules: {
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^[A-Z]", caughtErrorsIgnorePattern: "^_" }],
      "no-undef": "error",
      "no-const-assign": "error",
      "no-dupe-keys": "error",
      "no-duplicate-case": "error",
      "no-unreachable": "warn",
      "eqeqeq": ["warn", "always"],
    },
  },
  {
    ignores: ["node_modules/", "tests/"],
  },
];
