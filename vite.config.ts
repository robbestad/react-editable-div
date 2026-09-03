import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const root = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: resolve(root, "demo"),
  plugins: [react()],
  resolve: {
    alias: {
      "react-editable-div/styles.css": resolve(root, "src/styles.css"),
      "react-editable-div": resolve(root, "src/index.ts"),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
  },
});
