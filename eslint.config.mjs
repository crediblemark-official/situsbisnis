import nextConfig from 'eslint-config-next/core-web-vitals';

const reactHooksPlugin = nextConfig.find(c => c.plugins?.['react-hooks']);

/** @type {import('eslint').Linter.Config[]} */
const eslintConfig = [
  {
    ignores: ["**/*.d.ts", ".next/**/*", "public/**/*"]
  },
  ...nextConfig,
  {
    plugins: {
      ...(reactHooksPlugin?.plugins || {}),
    },
    rules: {
      "react-hooks/set-state-in-effect": "warn",
      "no-unused-vars": ["warn", { 
        "argsIgnorePattern": "^_", 
        "varsIgnorePattern": "^_",
        "caughtErrorsIgnorePattern": "^_"
      }],
      "jsx-a11y/alt-text": "error",
      "jsx-a11y/aria-props": "error",
      "jsx-a11y/aria-proptypes": "error",
      "jsx-a11y/aria-role": "error",
      "jsx-a11y/aria-unsupported-elements": "error",
      "jsx-a11y/heading-has-content": "warn",
      "jsx-a11y/html-has-lang": "error",
      "jsx-a11y/img-redundant-alt": "warn",
      "jsx-a11y/label-has-associated-control": "warn",
      "jsx-a11y/lang": "error",
      "jsx-a11y/no-access-key": "error",
      "jsx-a11y/no-distracting-elements": "warn",
      "jsx-a11y/role-has-required-aria-props": "error",
      "jsx-a11y/tabindex-no-positive": "warn",
    },
  },
];

export default eslintConfig;
