/* eslint-disable @typescript-eslint/no-unused-vars */
import config from "./jest.config";

const {
  collectCoverage,
  collectCoverageFrom,
  coverageDirectory,
  ...configWithoutCoverage
} = config;

export default {
  ...configWithoutCoverage,
  testEnvironment: "jest-bench/environment",
  testEnvironmentOptions: {
    testEnvironment: "jest-environment-node",
  },
  reporters: ["default", "jest-bench/reporter"],
  testRegex: "(\\.bench)\\.(ts|tsx)$",
};
