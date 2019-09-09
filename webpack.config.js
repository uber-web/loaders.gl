const getWebpackConfig = require('ocular-dev-tools/config/webpack.config');

const BABEL_CONFIG = {
  presets: ['@babel/env'],
  plugins: [
    [
      'babel-plugin-inline-import',
      {
        extensions: ['.worker.js']
      }
    ],
    ['@babel/plugin-transform-runtime', {useESModules: true}]
  ],
  ignore: ['**/*.worker.js']
};

module.exports = (env = {}) => {
  const config = getWebpackConfig(env);

  config.module.rules.push(
    {
      // This is required to handle inline worker!
      test: /worker.*\.js$/,
      exclude: /node_modules/,
      use: [
        {
          loader: 'babel-loader',
          options: BABEL_CONFIG
        }
      ]
    },
    {
      // Load worker tests
      test: /\.worker\.js$/,
      use: {
        loader: 'worker-loader'
      }
    }
  );

  return [
    config,
    // For worker tests
    // Output bundles to root and can be loaded with `new Worker('/*.worker.js')`
    {
      mode: 'development',
      entry: {
        'json-loader': './modules/core/test/worker-utils/json-loader.worker.js',
        'jsonl-loader': './modules/core/test/worker-utils/jsonl-loader.worker.js'
      },
      output: {
        filename: '[name].worker.js'
      },
      target: 'webworker'
    }
  ];
};
