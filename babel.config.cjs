module.exports = {
  presets: [
    ['@babel/preset-env', {
      modules: false,
      loose: true,
    }],
    '@babel/preset-typescript',
    'babel-preset-solid',
  ],
  plugins: [
    '@babel/plugin-proposal-import-attributes-to-assertions',
    [
      'formatjs',
      {
        idInterpolationPattern: '[sha512:contenthash:base64:6]',
        ast: true
      }
    ]
    ]
};
