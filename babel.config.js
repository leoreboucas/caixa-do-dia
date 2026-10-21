module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // Necessário para o Drizzle importar as migrations .sql como texto
    plugins: [['inline-import', { extensions: ['.sql'] }]],
  };
};
