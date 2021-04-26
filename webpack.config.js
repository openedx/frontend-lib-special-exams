const path = require('path');

module.exports = {
  entry: './src/index.js',
  mode: 'production',
  target: 'web',
  node: {
    fs: 'empty',
    net: 'empty',
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'index.js',
    library: 'specialExams',
    libraryTarget: 'umd',
  },
  resolve: {
    extensions: ['.js', '.jsx'],
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'babel-loader',
          },
        ],
      },
    ],
  },
  externals: {
    '@edx/paragon': '@edx/paragon',
    '@edx/frontend-platform': '@edx/frontend-platform',
    lodash: 'lodash',
    react: 'react',
    'react-dom': 'react-dom',
    'react-intl': 'react-intl',
    'react-redux': 'react-redux',
    redux: 'redux',
  },
};
