module.exports = function (api) {
  api.cache(true);
  return {
    // zustand'ın ESM paketi import.meta kullanıyor; web paketi bunu çevirmeden açılmıyor.
    presets: [['babel-preset-expo', { unstable_transformImportMeta: true }]],
  };
};
