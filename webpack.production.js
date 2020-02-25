'use strict';

var path = require('path'),
    webpack = require('webpack');

const DIST_DIR = 'dist';

module.exports = {
    entry: {
        app: [path.resolve(__dirname, 'src/index.js')],
        vendor: ['phaser']
    },
    mode: 'production',
    output: {
        pathinfo: true,
        path: path.resolve(__dirname, DIST_DIR),
        publicPath: `./${DIST_DIR}/`,
        filename: 'bundle.js'
    },
    plugins: [
        new webpack.DefinePlugin({
            CANVAS_RENDERER: JSON.stringify(true),
            WEBGL_RENDERER: JSON.stringify(true)
        })
    ],
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: "babel-loader"
                }
            },
            {
                test: [/\.vert$/, /\.frag$/],
                use: "raw-loader"
            },
            {
                test: /\.(gif|png|jpe?g|svg|xml)$/i,
                use: "file-loader"
            }
        ]
    },
    optimization: {
        splitChunks: {
            name: 'vendor',
            chunks: 'all'
        }
    }
};