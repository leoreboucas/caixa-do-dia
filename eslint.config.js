const { readdirSync } = require("node:fs");
const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");

const features = readdirSync(`${__dirname}/src/features`, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name);

const noComments = {
  meta: {
    type: "suggestion",
    messages: { noComment: "Comentários não são permitidos no código-fonte." },
  },
  create(context) {
    return {
      Program() {
        for (const comment of context.sourceCode.getAllComments()) {
          const isDirective =
            comment.value.startsWith("/ <reference") || /^\s*eslint-/.test(comment.value);
          if (!isDirective) context.report({ loc: comment.loc, messageId: "noComment" });
        }
      },
    };
  },
};

const relativeImports = {
  regex: "^\\.\\./|^\\./[^/]+/",
  message: "Use o alias @/ para importar de outro diretório.",
};

const pureSharedModules = "shared/(utils|validators|definitions)$";

const featureInternals = {
  regex: `^@/features/(?!${pureSharedModules})[^/]+/`,
  message:
    "Importe uma feature apenas pelo barrel dela (o shared também libera utils, validators e definitions).",
};

const ownFeatureBarrel = (feature) => ({
  regex: `^@/features/${feature}$`,
  message: "Dentro da feature, importe pelo barrel do subdiretório ou pelo módulo da raiz.",
});

const otherFeatures = (feature) =>
  feature === "shared"
    ? { regex: "^@/features/(?!shared/)", message: "O shared não importa outras features." }
    : {
        regex: `^@/features/(?!${feature}/)(?!${pureSharedModules})[^/]+/`,
        message: "Importe outra feature apenas pelo barrel dela.",
      };

const componentViews = {
  regex: "^@/features/[^/]+/views(/|$)",
  message: "Componentes não importam views.",
};

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*", "src/db/migrations/**"],
  },
  {
    files: ["src/**/*.{ts,tsx}"],
    plugins: { local: { rules: { "no-comments": noComments } } },
    rules: {
      "local/no-comments": "error",
      "no-restricted-imports": ["error", { patterns: [relativeImports, featureInternals] }],
      "@typescript-eslint/consistent-type-imports": ["error", { fixStyle: "inline-type-imports" }],
      "@typescript-eslint/no-import-type-side-effects": "error",
      "@typescript-eslint/no-redeclare": "off",
    },
  },
  ...features.flatMap((feature) => {
    const patterns = [relativeImports, ownFeatureBarrel(feature), otherFeatures(feature)];

    return [
      {
        files: [`src/features/${feature}/**/*.{ts,tsx}`],
        rules: { "no-restricted-imports": ["error", { patterns }] },
      },
      {
        files: [`src/features/${feature}/components/**/*.{ts,tsx}`],
        rules: { "no-restricted-imports": ["error", { patterns: [...patterns, componentViews] }] },
      },
    ];
  }),
]);
