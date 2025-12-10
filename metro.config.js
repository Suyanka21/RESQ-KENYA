const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// NativeWind disabled temporarily - requires react-native-worklets/plugin
// To re-enable: 1) npm install react-native-worklets 2) use withNativeWind wrapper
// const { withNativeWind } = require("nativewind/metro");
// module.exports = withNativeWind(config, { input: "./global.css" });

module.exports = config;
