const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Permite que o Metro resolva os arquivos .sql das migrations do Drizzle
config.resolver.sourceExts.push('sql');

module.exports = config;
