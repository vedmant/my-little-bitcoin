'use strict'

let path = require('path')
let webpack = require('webpack')
const VueLoaderPlugin = require('vue-loader/lib/plugin')

module.exports = {
	devtool: '#inline-source-map',

	entry: {
		app: ['./client/main.js'],
		vendor: [
			'es6-promise',
			'vue',
			'vue-router',
			'vuex',
			'moment-mini',
			'jquery',
			'axios',
		],
	},

	output: {
		path: path.resolve(__dirname, '..', 'dist'),
		publicPath: '/',
		filename: '[name].js?[hash:9]',
		chunkFilename: '[chunkhash].js?[hash:9]',
	},

	module: {
		noParse: /es6-promise\.js$/, // avoid webpack shimming process
		rules: [
			{
				test: /\.css$/,
				loaders: ['style-loader', 'css-loader'],
			},
			// ES6/7 syntax and JSX transpiling out of the box
			{
				test: /\.js$/,
				loader: 'babel-loader',
				exclude: [/node_modules/, /vendor/],
			},
			{
				test: /\.gif$/,
				loader: 'url-loader',
				options: {
					name: 'images/[name]-[hash:6].[ext]',
					limit: 10000,
				},
			},
			{
				test: /\.png$/,
				loader: 'url-loader',
				options: {
					name: 'images/[name]-[hash:6].[ext]',
					limit: 10000,
				},
			},
			{
				test: /\.jpg$/,
				loader: 'file-loader',
				options: {
					name: 'images/[name]-[hash:6].[ext]',
				},
			},
			// required for font-awesome icons
			{
				test: /\.(woff2?|svg)$/,
				loader: 'url-loader',
				options: {
					limit: 10000,
					prefix: 'font/',
				},
			},
			{
				test: /\.(ttf|eot)$/,
				loader: 'file-loader',
				options: {
					prefix: 'font/',
				},
			},
		],
	},

	resolve: {
		extensions: ['.vue', '.js', '.json'],
		mainFiles: ['index'],
		alias: {
			'images': path.resolve(__dirname, '..', 'client', 'images'),
			// 'vue$': 'vue/dist/vue.common.js',
		},
	},

	performance: {
		hints: false,
	},

	plugins: [
		new VueLoaderPlugin(),
	],
}
