// eslint.config.mjs
import antfu from "@antfu/eslint-config";

export default antfu({
  stylistic: {
    semi: "always",
    quotes: "double",
  },
  rules: {
    "no-console": ["error", { allow: ["log", "warn", "error"] }],
    "@stylistic/member-delimiter-style": [
      "error",
      {
        multiline: { delimiter: "semi", requireLast: true },
        singleline: { delimiter: "semi", requireLast: false },
      },
    ],
  },
});
