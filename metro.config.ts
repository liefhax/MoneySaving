const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// pastikan bundler kenal file .wasm
config.resolver.assetExts.push('wasm');
config.resolver.sourceExts.push('wasm');

module.exports = config;
