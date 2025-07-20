// module.exports = {
//   "preset": "@shelf/jest-mongodb",
//   testEnvironment: 'node',
//   setupFilesAfterEnv: ['./jest.setup.ts'], // Only this one
//   moduleNameMapper: {
//     '^@/(.*)$': '<rootDir>/src/$1',
//   },
//   testTimeout: 30000,
//   detectOpenHandles: true,
//   verbose: true,
// };

module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testMatch: ["**/*.test.ts"],
  verbose: true,
  forceExit: false,
  moduleNameMapper: {
    '^@src/(.*)$': '<rootDir>/src/$1'
  },
};