import chalk from 'chalk';
import webpack from 'webpack';
import WDS from 'webpack-dev-server';

import config from '../config.js';

const port = config.services.webpack.port;
const WDSConfig = {
  entry: [
    './src/client/client.js', 
    'webpack/hot/only-dev-server', 
    'webpack-dev-server/client?http://localhost:' + port
  ],
  // resolve: {
  //   extensions: ['', '.js', '.jsx']
  // },
  output: {
    path: require('path').resolve('./src/server/static_server/public/'),
    filename: 'bundle.js',
    publicPath: '/static/',
  },
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoErrorsPlugin(),
    new webpack.IgnorePlugin(/databaseMiddleware/), // beware
    new webpack.IgnorePlugin(/exports/), // beware
    new webpack.ContextReplacementPlugin(/exports/, {})
  ],
  devtool: 'eval',
  module: {
    loaders: [
      {
        test: /\.js$/,
        loaders: ['react-hot', 'babel'],
        exclude: /node_modules/
      },
      { 
        test: /\.css$/, 
        loaders: ['style', 'css', 'postcss'],
        exclude: /node_modules/
      }
    ]
  },
  node: {
    // fs: 'empty',
    // http: 'empty',
  },
};

let startTime;
const bundle = webpack(WDSConfig);

bundle.plugin('compile', () => {
  startTime  = Date.now();
  console.log(chalk.green('Bundling...'));
});

bundle.plugin('done', () => {
  console.log(chalk.green(`Bundled in ${Date.now() - startTime}ms!`));
});

new WDS(bundle, {
  contentBase: './src/server/static_server/public',
  publicPath: WDSConfig.output.publicPath,
  hot: true,
  noInfo : true,
  historyApiFallback: true,
  headers: { 
    'Access-Control-Allow-Origin': '*' 
  },
  stats: {
    colors: true
  },
  proxy: { // Could be more automated
    '/api/*': {
      target: 'http://localhost:' + config.services.api.port,
      // secure: false,
    },
    '/img/*': {
      target: 'http://localhost:' + config.services.image.port,
      // secure: false,
    },
    '/kvs/*': {
      target: 'http://localhost:' + config.services.kvs.port,
      // secure: false,
    },
  },
})

// 0.0.0.0 because behind VM
.listen(port, '0.0.0.0', err => {
  if (err) return console.error('WDS.listen', err);
  console.log(`WDS listening on port ${port}`);
});
