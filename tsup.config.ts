import { copyFile, readFile, writeFile } from "node:fs/promises";
import { defineConfig } from "tsup";

const CLIENT_BANNER = '"use client";\n';

async function prependClient(file: string): Promise<void> {
  const source = await readFile(file, "utf8");
  if (source.startsWith(CLIENT_BANNER) || source.startsWith("'use client'")) return;
  await writeFile(file, CLIENT_BANNER + source);
}

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
  cjsInterop: true,
  external: ["react", "react/jsx-runtime"],
  async onSuccess() {
    await Promise.all([
      copyFile("src/styles.css", "dist/styles.css"),
      prependClient("dist/index.js"),
      prependClient("dist/index.cjs"),
    ]);
    const cjs = await readFile("dist/index.cjs", "utf8");
    if (!cjs.includes("module.exports = Object.assign")) {
      await writeFile(
        "dist/index.cjs",
        `${cjs}\nmodule.exports = Object.assign(exports.default, exports);\n`,
      );
    }
  },
});
