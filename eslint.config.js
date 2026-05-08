{
  "root": true,
  "ignorePatterns": ["projects/**/*", "src/**/*.spec.ts"],
  "overrides": [
    {
      "extends": ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
      "files": ["*.ts"],
      "parser": "@typescript-eslint/parser",
      "parserOptions": {
        "ecmaVersion": 2020,
        "sourceType": "module"
      },
      "plugins": ["@typescript-eslint"],
      "rules": {
        "@typescript-eslint/no-explicit-any": "warn"
      }
    }
  ]
}