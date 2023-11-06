import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  build: {
    rollupOptions: {
      input: resolve(__dirname, "src/index.ts"),
      output: {
        entryFileNames: "[name].js",
        dir: resolve(__dirname, "dist"),
        format: "es",
      },
    },
  },
  esbuild: {
    loader: "ts",
    include: /src\/.*\.ts$/,
    exclude: [],
  },
});
