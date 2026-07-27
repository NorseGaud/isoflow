/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  modulePaths: ['node_modules', '<rootDir>'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  // sql.js client imports a .wasm asset (handled by Webpack in the app).
  // Jest cannot load wasm; map it to a string stub.
  moduleNameMapper: {
    '\\.wasm$': '<rootDir>/src/__mocks__/wasmMock.js'
  }
};
