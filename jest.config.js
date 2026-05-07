// Jest Configuration - Pure Jest (no jest-expo preset)
// This bypasses Expo winter runtime issues for unit testing

module.exports = {
    testEnvironment: "node",
    roots: ["<rootDir>/__tests__"],
    globals: {
        __DEV__: true,  // React Native development flag
    },
    testPathIgnorePatterns: [
        "/node_modules/",
        "/web-prototype-archive/",
        "/functions/",
        // Rules tests need the Firebase emulator (Java + Firestore +
        // Realtime Database) running. They have their own config:
        // `npm run test:rules` (see package.json). Default `npx jest`
        // is the unit-test pass and skips them.
        "__tests__/rules/"
    ],
    modulePathIgnorePatterns: [
        "<rootDir>/web-prototype-archive/",
        // Note: functions/src/shared/* is intentionally not ignored — the
        // pure helpers there (crypto, phone, status) are imported by root
        // unit tests. testPathIgnorePatterns still skips functions/__tests__.
    ],
    transform: {
        "^.+\\.(ts|tsx)$": ["babel-jest", { presets: ["@babel/preset-typescript"] }]
    },
    setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
    moduleNameMapper: {
        "^@/(.*)$": "<rootDir>/$1"
    },
    collectCoverage: false,
};
