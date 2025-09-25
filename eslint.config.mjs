// Configuración base de ESLint para todo el proyecto
// Se usa la compatibilidad plana (FlatCompat) para poder
// aprovechar las reglas recomendadas por Next.js.
// Utilidades de Node para resolver rutas y usar la API plana de ESLint
import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

// Ruta absoluta de este archivo para que FlatCompat funcione correctamente
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// FlatCompat permite usar la configuración "antigua" de ESLint dentro del
// nuevo formato plano. Indicamos la carpeta base donde se buscarán las reglas.
const compat = new FlatCompat({
  baseDirectory: __dirname,
});

// Extiende las reglas recomendadas por Next para React y TypeScript.
const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
];

export default eslintConfig;
