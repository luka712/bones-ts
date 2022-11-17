const path = require("path");

module.exports = {
	entry: {
		"index": "./src/index.ts"
	},
	mode: "none", // 'none' for dev, 'production' for well, production
	module: {
		rules: [
			{
				test: /\.tsx?$/,
				use: "ts-loader",
				exclude: /node_modules/,
			},
		],
	},
	resolve: {
		extensions: [".tsx", ".ts", ".js"],
		modules: [path.resolve(__dirname, "src"), 'node_modules'],
	},
	output: {
		filename: "index.js",
		path: path.resolve(__dirname, "dist"),
		library: "BonesFramework",
		libraryTarget: "umd",
		// globalObject: "this",
		// umdNamedDefine: true,
	},
};