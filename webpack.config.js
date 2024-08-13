const path = require("path");
const fs = require("fs");
const TerserPlugin = require("terser-webpack-plugin");
const { CleanWebpackPlugin } = require('clean-webpack-plugin')
const webpack = require("webpack");

// 动态生成入口配置
function generateEntries() {
  const srcDir = path.join(__dirname, "src/scripts");
  return fs.readdirSync(srcDir).reduce((entries, dir) => {
    const fullDir = path.join(srcDir, dir);
    const entry = path.join(fullDir, "index.ts");
    if (fs.statSync(fullDir).isDirectory() && fs.existsSync(entry)) {
      entries[dir] = entry;
    }
    return entries;
  }, {});
}

function getScriptHeader(filename, argvMode) {
  console.log('filename', filename);
  const filepath = path.join(__dirname, `./src/scripts/${filename}`, 'header.js')
  const isProd = argvMode === 'production'
  return fs.existsSync(filepath) ? require(filepath)(isProd) : ''
}

module.exports = (env, argv) => ({
  // 动态生成每个脚本的入口
  entry: generateEntries(),
  output: {
    // 输出到 dist 目录
    path: path.join(__dirname, "dist"),
    // 使用目录名作为文件名
    filename: "[name].user.js", // .user.js 为 Greasy Fork 用户脚本后缀
  },
  module: {
    rules: [
      // TypeScript 加载器配置
      {
        test: /\.ts$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    // 添加 '.ts' 和 '.tsx' 作为可解析扩展。
    extensions: [".ts", ".tsx", ".js"],
    alias: {
      // 使用 src 目录作为模块根目录
      "@": path.resolve(__dirname, "src"),
    }
  },
  plugins: [
    new CleanWebpackPlugin(), // 默认依赖 output path
    new webpack.BannerPlugin({
      banner: file => getScriptHeader(file.chunk.name, argv.mode),
      raw: true,
      entryOnly: true,
    }),
  ],
  // 遵守Greasy Fork代码规定，不做最小化处理
  // https://greasyfork.org/zh-CN/help/code-rules
  optimization: {
    minimize: false,
    minimizer: [
      new TerserPlugin({
        extractComments: false,
        terserOptions: {
          output: {
            comments: true,
          },
        },
      }),
    ],
  },
});
