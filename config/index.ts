import { defineConfig } from '@tarojs/cli';
import devConfig from './dev';
import prodConfig from './prod';

export default defineConfig(async (merge) => {
  const isH5 = process.env.TARO_ENV === 'h5';
  const outputRoot = isH5 ? 'dist' : 'dist-weapp';

  const baseConfig = {
    projectName: 'MahjongScorer2',
    date: '2026-04-30',
    designWidth: 750,
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
    // PWA assets only matter for the H5 build — weapp has its own packaging.
    ...(isH5 ? {
      copy: {
        patterns: [
          { from: 'src/manifest.webmanifest', to: 'dist/manifest.webmanifest' },
          { from: 'src/sw.js', to: 'dist/sw.js' },
          { from: 'src/icon.svg', to: 'dist/icon.svg' },
        ],
        options: {},
      },
    } : {}),
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
