// Jest Configuration - Pure Jest (no jest-expo preset)
// This bypasses Expo winter runtime issues for unit testing

module.exports = {
    testEnvironment: "node",
    testPathIgnorePatterns: [
        "/node_modules/",
        "/web-prototype-archive/",
        "/functions/"
    ],
    modulePathIgnorePatterns: [
        "<rootDir>/web-prototype-archive/",
        "<rootDir>/functions/"
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
