import { esbuildPlugin } from "@web/dev-server-esbuild";

export default {
  plugins: [esbuildPlugin({ ts: true, target: "auto", externals: ["fs/promises"] })],
  testRunnerHtml: (testFramework) => `
      <html>
            <head>
                <script type="module" src="${testFramework}"></script>
                <script src='../node_modules/jest-browser-globals/build-es5/index.js'></script>
            </head>
      </html>
      `,
  files: [
    "**/*.spec.ts", // include `.spec.ts` files
    "!**/node/*.spec.ts", // exclude `.e2e.spec.ts` files
    "!**/node_modules/**/*", // exclude any node modules
  ],
};
