// Read publicPath from env var so the same build can target either:
// - Root deploy (Netlify):  TARO_PUBLIC_PATH=/  (default)
// - Subpath (GitHub Pages): TARO_PUBLIC_PATH=/mahjong-scorer/
const PUBLIC_PATH = process.env.TARO_PUBLIC_PATH || '/';
const BASE_URL = PUBLIC_PATH.replace(/\/$/, ''); // strip trailing slash for tile paths

export default {
  mini: {},
  h5: {
    publicPath: PUBLIC_PATH,
    staticDirectory: 'static',
    router: {
      mode: 'hash',
      basename: PUBLIC_PATH,
    },
    enableExtract: true,
    miniCssExtractPluginOption: {
      filename: 'css/[name].[hash].css',
      chunkFilename: 'css/[name].[chunkhash].css',
    },
  },
  defineConstants: {
    'process.env.TARO_APP_BASE_URL': JSON.stringify(BASE_URL),
  },
};
