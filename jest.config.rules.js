// ResQ Kenya — Rules unit-test runner.
//
// Runs only the Firestore + Realtime Database security-rules tests
// against the Firebase Emulator Suite. Invoke with:
//
//   npm run test:rules
//
// The script chains `firebase emulators:exec` so you don't need the
// emulator running ahead of time. Java 11+ is required.
//
// Source: https://firebase.google.com/docs/rules/unit-tests
//         https://firebase.google.com/docs/emulator-suite/install_and_configure

module.exports = {
    testEnvironment: "node",
    roots: ["<rootDir>/__tests__/rules"],
    testTimeout: 30_000,
    transform: {
        "^.+\\.(ts|tsx)$": [
            "babel-jest",
            { presets: ["@babel/preset-typescript"] }
        ]
    },
    collectCoverage: false,
};
