/* global __dirname */
import { resolve } from "path";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

import react from "@vitejs/plugin-react";
import { patchCssModules } from "vite-css-modules";

export default defineConfig(({ command, mode }) => {
  if (command === "serve") {
    // Enables `npm run dev` (quickstart) or `npm run example -- <name>` (other examples).
    const example = mode === "development" ? "quickstart" : mode;
    return {
      plugins: [
        {
          name: "virtual-example",
          resolveId(id) {
            if (id === "virtual:example-app") return "\0virtual:example-app";
          },
          load(id) {
            if (id === "\0virtual:example-app") {
              const path = resolve(__dirname, "examples", `${example}.tsx`);
              return `export { App } from ${JSON.stringify(path)};`;
            }
          },
        },
        react(),
        patchCssModules({ generateSourceTypes: true }),
      ],
    };
  }
  return {
    build: {
      minify: false,
      lib: {
        // Could also be a dictionary or array of multiple entry points
        entry: resolve(__dirname, "src/main.ts"),
        name: "polymorph-ui",
        // the proper extensions will be added
        fileName: "polymorph-ui",
        formats: ["es"],
      },
      rollupOptions: {
        external: ["react", "react-dom", "react/jsx-runtime"],
      },
    },
    plugins: [
      dts({
        entryRoot: "src",
        compilerOptions: {
          declarationMap: mode === "debug",
          declaration: mode === "debug",
        },
      }),
      react(),
      patchCssModules({ generateSourceTypes: true }),
    ],
  };
});
