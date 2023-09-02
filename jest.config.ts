import type { JestConfigWithTsJest } from "ts-jest";
import { defaults as tsjPreset } from "ts-jest/presets";

const config: JestConfigWithTsJest = {
  preset: "ts-jest",
  transform: {
    ...tsjPreset.transform,
  },
  testPathIgnorePatterns: [
    "<rootDir>/node_modules/",
    "<rootDir>/dist/",
    "<rootDir>/spec/browser/",
  ],
  // collectCoverage: true,
  // collectCoverageFrom: ["src/**/*.ts"],
  // coverageDirectory: "coverage",
  testTimeout: 60000,
};

export default config;
