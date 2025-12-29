const { getDefaultConfig } = require("expo/metro-config");
const { withNativewind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname, { isCSSEnabled: true });

module.exports = withNativewind(config, {
  input: "@/global.css",
  inlineRem: 16,
});
