import antfu from "@antfu/eslint-config";
import nextPlugin from "@next/eslint-plugin-next";
import eslintPluginBetterTailwindcss from "eslint-plugin-better-tailwindcss";

export default antfu(
  {
    type: "app",
    react: true,
    typescript: true,
    formatters: true,
    stylistic: {
      indent: 2,
      semi: true,
      quotes: "double",
    },
    // Known issue with react-refresh/only-export-components and shadcn.
    // see https://github.com/shadcn-ui/ui/issues/7736 and
    // https://github.com/ArnaudBarre/eslint-plugin-react-refresh/issues/84#issuecomment-3076117181
    ignores: ["**/migrations/*", "next-env.d.ts", "**/components/ui/*", "**/reports/*.md", "**/docs/*.md"],
  },
  {
    plugins: {
      "better-tailwindcss": eslintPluginBetterTailwindcss,
    },
    rules: {
      ...eslintPluginBetterTailwindcss.configs["recommended-warn"].rules,
      "better-tailwindcss/no-unregistered-classes": "off",
    },
  },
  {
    plugins: {
      "@next/next": nextPlugin,
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,
      "@next/next/no-img-element": "off",
    },
  },
  {
    rules: {
      "ts/no-redeclare": "off",
      "ts/consistent-type-definitions": ["error", "type"],
      "no-console": "warn",
      "antfu/no-top-level-await": ["off"],
      "node/prefer-global/process": ["off"],
      "node/no-process-env": ["error"],
      "perfectionist/sort-imports": ["error", { tsconfigRootDir: "." }],
      "unicorn/filename-case": [
        "error",
        {
          case: "kebabCase",
          ignore: ["README.md"],
        },
      ],
    },
  },
);
