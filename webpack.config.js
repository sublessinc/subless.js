// Generated using webpack-cli https://github.com/webpack/webpack-cli
const Dotenv = require('dotenv-webpack');
const ESLintPlugin = require('eslint-webpack-plugin');

const path = require("path");
const isProduction = process.env.NODE_ENV != "local";

const config = {
  entry: {
    subless: './src/subless.ts', 
    "subless2.0": './src/subless2.0.ts'
  },
  experiments: {
    outputModule: true,
  },
  output: {
    filename: '../dist/[name].js',
    library: {
      type: "module"
    }
  },
  plugins: [
    new Dotenv({
      path: './environment/' + process.env.NODE_ENV + '.env',
      safe: true
    }),
    new ESLintPlugin({
      extensions: [`js`, `jsx`, `ts`],
      exclude: [`node_modules`],
    })
  ],
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/i,
        loader: "ts-loader",
        exclude: ["/node_modules/"],
      },
      {
        test: /\.(eot|svg|ttf|woff|woff2|png|jpg|gif)$/i,
        type: "asset",
      },

      // Add your rules for custom modules here
      // Learn more about loaders from https://webpack.js.org/loaders/
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
  },
};

module.exports = () => {
  if (isProduction) {
    config.mode = "production";
  } else {
    config.mode = "development";
  }
  return config;
};
