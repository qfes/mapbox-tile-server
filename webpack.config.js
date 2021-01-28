const { resolve } = require("path");
const ZipPlugin = require("zip-webpack-plugin");

module.exports = (env, { mode }) => {
  process.env.NODE_ENV = mode;
  return {
    mode,
    target: "node",
    entry: "./src/index.ts",
    output: {
      path: resolve(__dirname, "dist"),
      filename: "index.js",
      libraryTarget: "commonjs",
    },
    resolve: {
      extensions: [".ts", ".js", ".json"],
      modules: ["node_modules"],
    },
    module: {
      rules: [
        {
          test: /\.(ts|js)$/,
          exclude: /node_modules/,
          loader: "ts-loader",
        },
        {
          test: /better-sqlite3.*\.js$/,
          loader: "node-bindings-loader",
        },
        {
          test: /\.node$/,
          loader: "node-loader",
          options: {
            name: "[name].[ext]",
          },
        },
      ],
    },
    externals: ["aws-sdk"],
    devtool: mode === "development" && "source-map",
    optimization: {
      minimize: mode === "production",
    },
    plugins: [new ZipPlugin()],
  };
};