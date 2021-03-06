var webpack = require('webpack');
module.exports = {
    entry: [
        './src/index.js',
        'babel-polyfill'
        ],

    output: {
        path: __dirname + '/public/',
        filename: 'bundle.js'
    },

    module: {
        loaders: [
            {
                test: /\.js$/,
                loaders: ['babel?' + JSON.stringify({
                    cacheDirectory: true,
                    presets: ['es2015', 'react']
                })],
                exclude: /node_modules/,
            }
        ]
    },

    plugins:[
      new webpack.DefinePlugin({
          'process.env' : {
              'NODE_ENV' : JSON.stringify('production')
          }
      }),
        new webpack.optimize.UglifyJsPlugin({
            compress:{
                warnings : true
            }
        })
    ]
};