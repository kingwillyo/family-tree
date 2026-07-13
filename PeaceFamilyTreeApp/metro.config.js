const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const { withReactNativeGrab } = require('react-native-grab/metro');

const config = getDefaultConfig(__dirname);

module.exports = withReactNativeGrab(config);
module.exports = withNativeWind(config, { input: './global.css' });
