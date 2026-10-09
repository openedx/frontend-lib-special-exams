module.exports = {
  testEnvironment: 'jsdom',
  testEnvironmentOptions: {
    url: 'http://localhost/',
  },
  setupFilesAfterEnv: ['<rootDir>/src/setupTest.js'],
  moduleNameMapper: {
    '\\.(css|scss|svg|jpg|jpeg|png|gif|eot|otf|webp|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': 'identity-obj-proxy',
  },
  transform: {
    '^.+\\.[jt]sx?$': 'babel-jest',
  },
  // react-intl 10 and its formatjs packages ship ES modules only.
  transformIgnorePatterns: [
    '/node_modules/(?!@(open)?edx|react-intl|@formatjs|intl-messageformat)',
  ],
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
  ],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    'src/data/messages/handlers.js',
    'src/setupTest.js',
    'src/i18n',
  ],
  watchPathIgnorePatterns: [
    '/node_modules/',
  ],
};
