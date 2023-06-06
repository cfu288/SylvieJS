/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-var-requires */
const esbuild = require("esbuild");
const { dtsPlugin } = require("esbuild-plugin-d.ts");
const {default: umdWrapper} = require("esbuild-plugin-umd-wrapper");

esbuild
  .build({
    entryPoints: [
      "src/lokijs.ts",
      "src/loki-indexed-adapter.ts",
      "src/incremental-indexeddb-adapter.ts",
    ],
    // entryNames: "[name].min",
    outdir: "dist",
    bundle: true,
    sourcemap: true,
    minifyWhitespace: true,
    minify: true,
    keepNames: true,
    format: "umd",
    plugins: [dtsPlugin(), umdWrapper()],
  })
  .catch(() => process.exit(1));
