const webpack = require('webpack'),
    path = require('path'),
    fileSystem = require('fs'),
    env = require('./utils/env'),
    CleanWebpackPlugin = require('clean-webpack-plugin'),
    CopyWebpackPlugin = require('copy-webpack-plugin'),
    HtmlWebpackPlugin = require('html-webpack-plugin'),
    WriteFilePlugin = require('write-file-webpack-plugin'),
    ExtractTextPlugin = require('extract-text-webpack-plugin'),
    Critters = require('critters-webpack-plugin');

// load the secrets
const alias = {};

const secretsPath = path.join(__dirname, ('secrets.' + env.NODE_ENV + '.js'));

const fileExtensions = ['jpg', 'jpeg', 'png', 'gif', 'eot', 'otf', 'svg', 'ttf', 'woff', 'woff2'];

if (fileSystem.existsSync(secretsPath)) {
  alias['secrets'] = secretsPath;
}

const options = {
  mode: process.env.NODE_ENV || 'development',
  entry: {
    background: path.join(__dirname, 'src', 'js', 'background.js'),
    content: path.join(__dirname, 'src', 'js', 'content.js'),
  },
  chromeExtensionBoilerplate: {
    notHotReload: ['background.js', 'content.js'],
  },
  output: {
    path: path.join(__dirname, 'build'),
    filename: '[name].bundle.js'
  },
  module: {
    rules: [
      {
        test: /\.scss$/,
        use: ExtractTextPlugin.extract({
          fallback: 'style-loader',
          use: [
            'css-loader',
            'sass-loader'
          ],
        })
      },
      // {
      //   test: /\.css$/,
      //   loader: 'style-loader!css-loader',
      //   exclude: /node_modules/
      // },
      {
        test: new RegExp('\.(' + fileExtensions.join('|') + ')$'),
        loader: 'file-loader?name=[name].[ext]',
        exclude: /node_modules/
      },
      {
        test: /\.html$/,
        loader: 'html-loader',
        exclude: /node_modules/
      },
      {
        test: /\.svg$/,
        loader: 'svg-inline-loader'
      },
      {
        test: /\.(woff(2)?|ttf|eot|svg)(\?v=\d+\.\d+\.\d+)?$/,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: '[name].[ext]',
              outputPath: 'fonts/',
            }
          }
        ]
      },
    ]
  },
  resolve: {
    alias: alias
  },
  plugins: [
    // clean the build folder
    new CleanWebpackPlugin(['build']),
    // expose and write the allowed env vars on the compiled bundle
    new webpack.EnvironmentPlugin(['NODE_ENV']),
    new ExtractTextPlugin('css/global.css'),
    new CopyWebpackPlugin([
      {
        from: 'src/manifest.json',
        transform: function (content, path) {
          // generates the manifest file using the package.json informations
          return Buffer.from(JSON.stringify({
            description: process.env.npm_package_description,
            version: process.env.npm_package_version,
            ...JSON.parse(content.toString())
          }))
        }
      },
      {
        from: 'src/img',
      }
    ]),
    new HtmlWebpackPlugin({
      template: path.join(__dirname, 'src', 'background.html'),
      filename: 'background.html',
      chunks: ['background']
    }),
    new HtmlWebpackPlugin({
      template: path.join(__dirname, 'src', 'chat-window.html'),
      filename: 'chat-window.html',
      chunks: ['chat-window']
    }),
    new WriteFilePlugin(),
    new Critters({}),
  ]
};

if (env.NODE_ENV === 'development') {
  options.devtool = 'cheap-module-eval-source-map';
}

module.exports = options;
