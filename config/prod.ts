export default {
  mini: {},
  h5: {
    publicPath: '/mahjong-scorer/',
    staticDirectory: 'static',
    enableExtract: true,
    miniCssExtractPluginOption: {
      filename: 'css/[name].[hash].css',
      chunkFilename: 'css/[name].[chunkhash].css',
    },
  },
  defineConstants: {
    'process.env.TARO_APP_BASE_URL': '"/mahjong-scorer"',
  },
};
