import { defineConfig } from '@tarojs/cli';
import devConfig from './dev';
import prodConfig from './prod';

export default defineConfig(async (merge) => {
  const isH5 = process.env.TARO_ENV === 'h5';
  const outputRoot = isH5 ? 'dist' : 'dist-weapp';

  const baseConfig = {
    projectName: 'MahjongScorer2',
    date: '2026-04-30',
    // 375 matches the 1x mockup width (iPhone 6/7/8 logical width). Taro doubles
    // every px → rpx so the weapp render matches the H5 px-based sizing instead
    // of looking ~half-size. designWidth only affects weapp; H5 has pxtransform
    // disabled (see config/prod.ts) so px stays as px there.
    designWidth: 375,
    deviceRatio: {
      640: 2.34 / 2,
      750: 1,
      375: 2,
      828: 1.81 / 2,
    },
    sourceRoot: 'src',
    outputRoot,
    plugins: ['@tarojs/plugin-framework-react'],
    framework: 'react',
    compiler: 'webpack5',
    // Tile PNGs aren't imported as modules (tileIcon.ts uses bare URL strings),
    // so Taro/webpack won't auto-bundle them. Both platforms need a copy step:
    //   - H5  → dist/tiles/      (so /mahjong-scorer/tiles/W1.png resolves)
    //   - weapp → dist-weapp/tiles/ (so weapp package includes them)
    // PWA assets are H5-only and skip weapp.
    copy: {
      patterns: [
        { from: 'src/assets/tiles', to: `${outputRoot}/tiles` },
        ...(isH5 ? [
          { from: 'src/manifest.webmanifest', to: 'dist/manifest.webmanifest' },
          { from: 'src/sw.js', to: 'dist/sw.js' },
          { from: 'src/icon.svg', to: 'dist/icon.svg' },
          { from: 'src/icon-192.png', to: 'dist/icon-192.png' },
          { from: 'src/icon-512.png', to: 'dist/icon-512.png' },
        ] : []),
      ],
      options: {},
    },
    mini: {
      postcss: {
        pxtransform: { enable: true },
        cssModules: {
          enable: true,
          config: {
            namingPattern: 'module',
            generateScopedName: '[name]__[local]___[hash:base64:5]',
          },
        },
      },
    },
    h5: {
      publicPath: '/',
      staticDirectory: 'static',
      postcss: {
        autoprefixer: { enable: true },
        pxtransform: { enable: false },
        cssModules: {
          enable: true,
          config: {
            namingPattern: 'module',
            generateScopedName: '[name]__[local]___[hash:base64:5]',
          },
        },
      },
    },
  };

  if (process.env.NODE_ENV === 'development') {
    return merge({}, baseConfig, devConfig);
  }
  return merge({}, baseConfig, prodConfig);
});
