// jest.config.js
export default {
  testEnvironment: 'node',
  setupFiles: ['dotenv/config'], // Load environment variables
  transform: {
    '^.+\\.js$': 'babel-jest', // Transform all .js files with babel-jest
  },
  // Optional: Ignore node_modules except for specific packages if needed
  transformIgnorePatterns: [
    '/node_modules/(?!(@babel|mongodb-memory-server)/)',
  ],
};