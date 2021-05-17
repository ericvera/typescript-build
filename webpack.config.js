/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path')
const ShebangPlugin = require('webpack-shebang-plugin')

module.exports = {
  target: 'node16',
  mode: 'production',
  entry: './src/index.ts',
  devtool: 'inline-source-map',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: {
          loader: 'ts-loader',
          options: {
            configFile: 'tsconfig.json',
            transpileOnly: false, // Set to true if you are using fork-ts-checker-webpack-plugin
            projectReferences: true,
          },
        },
        exclude: /node_modules/,
      },
    ],
  },
  output: {
    filename: 'index.js',
    path: path.resolve(__dirname, 'dist'),
    libraryTarget: 'commonjs',
  },
  plugins: [new ShebangPlugin()],
}
