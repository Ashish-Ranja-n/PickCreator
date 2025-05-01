import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // Suppress warnings about React Hook dependencies
      "react-hooks/exhaustive-deps": "off",
      
      // Suppress errors about unused variables
      "@typescript-eslint/no-unused-vars": "off",
      
      // Suppress errors about explicit any types
      "@typescript-eslint/no-explicit-any": "off",
      
      // Suppress errors about unescaped entities
      "react/no-unescaped-entities": "off",
      
      // Suppress warnings about using img element instead of next/image
      "@next/next/no-img-element": "off"
    }
  }
];

export default eslintConfig;
