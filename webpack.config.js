var webpack = require("webpack"),
  HTMLWebPackPlugin = require("html-webpack-plugin"),
  ExtractTextPlugin = require("extract-text-webpack-plugin"),
  env = process.env.NODE_ENV || "prod",
  plugins = [
    new HTMLWebPackPlugin({
      template: __dirname + "/src/widget.html",
      filename: "widget.html",
      inject: "body"
    }),
    new ExtractTextPlugin("css/spreadsheet.css", { allChunks: false }),
    new webpack.ProvidePlugin({
      $: "jquery",
      jquery: "jQuery",
      "windows.jQuery": "jquery"
    })
  ];

// Minify for Production only.
if (env === "prod") {
  plugins.push(
    new webpack.optimize.UglifyJsPlugin({
      compress: {
        warnings: false
      }
    })
  );
}

module.exports = {
  entry: [
    "./src/components/widget-common/dist/common.js",
    "./src/components/widget-common/dist/logger.js",
    "./src/components/widget-common/dist/rise-cache.js",
    "./src/components/widget-common/dist/rise-data.js",
    "./src/components/widget-common/dist/rise-google-sheet.js",
    "./src/components/auto-scroll/dist/jquery.auto-scroll.js",
    "./src/components/gsap/src/uncompressed/utils/Draggable.js",
    "./src/components/gsap/src/uncompressed/TweenLite.js",
    "./src/components/gsap/src/uncompressed/plugins/CSSPlugin.js",
    "./src/components/gsap/src/uncompressed/plugins/ScrollToPlugin.js",
    "./src/config/config.js",
    "./src/config/version.js",
    "./src/widget/main.js",
    "./src/widget/analytics.js"
  ],
  devtool: "source-map",
  module: {
    preLoaders: [
      {
        test: /\.jsx?$/,
        include: /src\/widget/,
        loaders: ["eslint"]
      }
    ],
    loaders: [
      {
        test: /\.jsx?$/,
        include: [/src\/widget/, /test\/unit\/widget/],
        loader: "babel-loader"
      },
      {
        test: /\.css$/,
        loader: ExtractTextPlugin.extract("style-loader", "css-loader")
      },
      {
        test: require.resolve(__dirname + "/src/config/config"),
        loader: "exports?config"
      },
      {
        test: require.resolve(__dirname + "/src/config/version"),
        loader: "exports?version"
      },
      {
        test: require.resolve(__dirname + "/src/components/widget-common/dist/logger"),
        loader: "imports?WIDGET_COMMON_CONFIG=./config"
      },
      {
        test: require.resolve(__dirname + "/src/components/widget-common/dist/config"),
        loader: "exports?WIDGET_COMMON_CONFIG"
      },
      {
        test: require.resolve(__dirname + "/src/components/widget-common/dist/logger"),
        loader: "exports?RiseVision.Common.LoggerUtils"
      },
      {
        test: require.resolve(__dirname + "/src/components/widget-common/dist/common"),
        loader: "exports?RiseVision.Common.Utilities"
      },
      {
        test: require.resolve(__dirname + "/src/components/widget-common/dist/rise-cache"),
        loader: "exports?RiseVision.Common.RiseCache"
      },
      {
        test: require.resolve(__dirname + "/src/components/widget-common/dist/rise-data"),
        loader: "imports?jQuery=jquery,$=jquery,this=>window"
      },
      {
        test: require.resolve(__dirname + "/src/components/widget-common/dist/rise-data"),
        loader: "exports?RiseVision.Common.RiseData"
      },
      {
        test: require.resolve(__dirname + "/src/components/widget-common/dist/rise-google-sheet"),
        loader: "imports?jQuery=jquery,$=jquery,this=>window"
      },
      {
        test: require.resolve(__dirname + "/src/components/widget-common/dist/rise-google-sheet"),
        loader: "exports?RiseVision.Common.RiseGoogleSheet"
      },
      {
        test: require.resolve(__dirname + "/src/components/auto-scroll/dist/jquery.auto-scroll"),
        loader: "imports?jQuery=jquery,$=jquery,this=>window"
      },
      {
        test: require.resolve(__dirname + "/src/components/gsap/src/uncompressed/TweenLite"),
        loader: "imports?jQuery=jquery,$=jquery,this=>window"
      },
      {
        test: require.resolve(__dirname + "/src/components/gsap/src/uncompressed/TweenLite"),
        loader: "expose?TweenLite"
      },
      {
        test: require.resolve(__dirname + "/src/components/gsap/src/uncompressed/utils/Draggable"),
        loader: "imports?jQuery=jquery,$=jquery,this=>window"
      },
      {
        test: require.resolve(__dirname + "/src/components/gsap/src/uncompressed/plugins/CSSPlugin"),
        loader: "imports?jQuery=jquery,$=jquery,this=>window"
      },
      {
        test: require.resolve(__dirname + "/src/components/gsap/src/uncompressed/plugins/ScrollToPlugin"),
        loader: "imports?jQuery=jquery,$=jquery,this=>window"
      }

    ]
  },
  eslint: {
    failOnError: true
  },
  resolve: {
    extensions: ["", ".js", ".jsx"]
  },
  output: {
    path: __dirname + "/dist",
    filename: "js/widget.min.js"
  },
  externals: {
    "cheerio": "window",
    "react/lib/ExecutionEnvironment": true,
    "react/lib/ReactContext": true
  },
  plugins: plugins
};
