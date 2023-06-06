import esbuild from "esbuild";
import { dtsPlugin } from "esbuild-plugin-d.ts";

esbuild
  .build({
    entryPoints: [
      "src/lokijs.ts",
      "src/loki-indexed-adapter.ts",
      "src/incremental-indexeddb-adapter.ts",
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
