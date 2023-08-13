import esbuild from "esbuild";
import { dtsPlugin } from "esbuild-plugin-d.ts";

esbuild
  .build({
    entryPoints: [
      "src/sylviejs.ts",
      // "src/storage-adapter/incremental-indexeddb-adapter.ts",
      // "src/storage-adapter/indexeddb-adapter.ts",
      "src/storage-adapter/crypted-indexeddb-adapter.ts",
      // "src/storage-adapter/fs-adapter.ts",
    ],
    outdir: "dist",
    bundle: true,
    sourcemap: true,
    minifyWhitespace: true,
    minify: true,
    keepNames: true,
    format: "esm",
    plugins: [dtsPlugin()],
  })
  // eslint-disable-next-line no-undef
  .catch(() => process.exit(1));
