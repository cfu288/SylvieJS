import esbuild from "esbuild";

esbuild
  .build({
    entryPoints: [
      "src/sylviejs.ts",
      "src/storage-adapter/incremental-indexeddb-adapter.ts",
      "src/storage-adapter/crypted-indexeddb-adapter.ts",
      "src/storage-adapter/opfs-adapter.ts",
      "src/storage-adapter/fs-adapter.ts",
      "src/storage-adapter/fs-structured-adapter.ts",
    ],
    outdir: "dist",
    bundle: true,
    sourcemap: true,
    minifyWhitespace: true,
    minify: true,
    keepNames: true,
    format: "esm",
    external: ["fs/promises", "node:stream", "node:readline", "node:fs"],
    plugins: [],
  })
  // eslint-disable-next-line no-undef
  .catch(() => process.exit(1));
