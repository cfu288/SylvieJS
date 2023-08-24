import esbuild from "esbuild";

esbuild
  .build({
    entryPoints: [
      "src/sylviejs.ts",
      "src/storage-adapter/incremental-indexeddb-adapter.ts",
      "src/storage-adapter/crypted-indexeddb-adapter.ts",
      "src/storage-adapter/fs-adapter.ts",
    ],
    outdir: "dist",
    bundle: true,
    sourcemap: true,
    minifyWhitespace: true,
    minify: true,
    keepNames: true,
    format: "esm",
    external: ["fs/promises"],
  })
  // eslint-disable-next-line no-undef
  .catch(() => process.exit(1));
