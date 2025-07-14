module.exports = function (api) {
  api.cache(true)
  return {
  presets: ['babel-preset-expo'],
  plugins: [
    ['@babel/plugin-transform-private-methods', { loose: true }],
    ['@babel/plugin-transform-private-property-in-object', { loose: true }],
    ['@babel/plugin-transform-class-properties', { loose: true }],
    ['react-native-paper/babel'],
    [
      'module-resolver',
      {
        root: ['./'],
        alias: {
          '@app': './src/app',
          '@pages': './src/pages',

          // ASSETS
          '@images': './src/assets/images',
          '@icons': './src/assets/icons',
          '@fonts': './src/assets/fonts',
          '@sounds': './src/assets/sounds',
          '@videos': './src/assets/videos',
          '@styles': './src/assets/styles',
          '@animations': './src/assets/animations',

          // SHARED
          '@shared': './src/shared',
          '@ui': './src/shared/ui',
          '@lib': './src/shared/lib',

          // STORES
          '@stores': './src/stores',

          '@locales': './src/shared/locales',
          '@schemas': './src/shared/schemas',
          '@api': './src/shared/api',
          '@config': './src/shared/config',

          // WIDGETS
          '@widgets': './src/widgets',
          '@modals': './src/widgets/modals',
          '@bottomsheets': './src/widgets/bottomsheets',
          '@navigations': './src/widgets/navigations',
          '@headers': './src/widgets/headers',

          // COMPONENTS
          '@components': './src/components',

          // HOOKS
          '@hooks': './src/shared/hooks',
        },
        extensions: ['.ts', '.tsx', '.js', '.jsx'],
      },
    ],
    [
      'module:react-native-dotenv',
      {
        moduleName: '@env',
        path: '.env',
        blacklist: null,
        whitelist: null,
        safe: false,
        allowUndefined: true,
      },
    ],
    ['react-native-reanimated/plugin'],
  ],
  }
}