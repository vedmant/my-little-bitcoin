'use strict'

let path = require('path')
let webpack = require('webpack')

let merge = require('webpack-merge')
let baseWpConfig = require('./webpack.base.config')
//let StatsPlugin = require('stats-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')

module.exports = merge(baseWpConfig, {
  mode: 'production',
  devtool: '#source-map',

	module: {
		rules: [
			{
				test: /\.scss$/,
				use: [
					MiniCssExtractPlugin.loader,
					{
						loader: 'css-loader'/*,
						options: {
							modules: true,
							sourceMap: true,
							importLoader: 2
						}*/
					},
					'sass-loader',
				],
			}, {
				test: /\.vue$/,
				loader: 'vue-loader',
				options: {
					loaders: {
						sass: [
							MiniCssExtractPlugin.loader,
							{
								loader: 'css-loader'/*,
								options: {
									modules: true,
									sourceMap: true,
									importLoader: 2
								}*/
							},
							'sass-loader',
						],
					},
				},
			}, {
				test: /\.pug$/,
				loader: 'pug-plain-loader'
			}
		]
	},
	optimization: {
		splitChunks: {
			cacheGroups: {
				vendor: {
					test: 'vendor',
					name: 'vendor',
					enforce: true,
				},
			},
		},
	},
	plugins: [
		new webpack.DefinePlugin({
			'process.env': {
				'NODE_ENV': JSON.stringify('production')
			},
		}),
		new webpack.LoaderOptionsPlugin({
			minimize: true,
		}),

		new MiniCssExtractPlugin({
			filename: '[name].css?[hash:9]',
    }),

    new HtmlWebpackPlugin({
      filename: 'index.html',
      template: 'client/index.html',
      inject: true,
      minify: {
        removeComments: true,
        collapseWhitespace: true,
        removeAttributeQuotes: true
        // more options:
        // https://github.com/kangax/html-minifier#options-quick-reference
      },
      // necessary to consistently work with multiple chunks via CommonsChunkPlugin
      chunksSortMode: 'dependency',
    }),


		/*new StatsPlugin(path.resolve(__dirname, 'stats.json'), {
			chunkModules: true
			//exclude: [/node_modules[\\\/]react/]
		})*/
	]
})
