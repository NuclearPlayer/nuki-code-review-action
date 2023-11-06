import { defineConfig } from "vite";
import { resolve } from "path";
import target from "vite-plugin-target";

export default defineConfig({
  plugins: [
    target({
      node: {},
    }),
  ],
  build: {
    rollupOptions: {
      input: resolve(__dirname, "src/index.ts"),
      output: {
        entryFileNames: "[name].js",
        dir: resolve(__dirname, "dist"),
        format: 'module'
      },
    },
  },
  esbuild: {
    target: "es2019",
    loader: "ts",
    include: /src\/.*\.ts$/,
    exclude: [],
  },
});
