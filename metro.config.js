const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Fix: Add 'cjs' and 'mjs' so Lucide icons can resolve correctly
config.resolver.sourceExts.push("cjs", "mjs");

module.exports = config;