// import path from 'path';
import chalk from 'chalk';
import webpack from 'webpack';
import WDS from 'webpack-dev-server';
import config from './config.js';

const WDSPort = config.WDSPort;
const WDSConfig = {
  entry: [
    './src/client/client.js', 
    'webpack/hot/only-dev-server', 
    'webpack-dev-server/client?http://localhost:' + WDSPort
  ],
  // resolve: {
  //   extensions: ['', '.js', '.jsx']
  // },
  output: {
    path: require('path').resolve('./src/server/build'),
    filename: 'bundle.js',
    publicPath: '/static/',
  },
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoErrorsPlugin(),
    new webpack.IgnorePlugin(/databaseMiddleware/), // beware
    // new webpack.ContextReplacementPlugin(/databaseMiddleware/, null)
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
  contentBase: './src/server/public',
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
  proxy: {
    '/api/*': {
      target: 'http://localhost:' + config.APIPort,
      // secure: false,
    },
  },
})

// 0.0.0.0 because behind VM
.listen(WDSPort, '0.0.0.0', err => {
  if (err) return console.error('devServer.listen', err);
  console.log(`WDS listening on port ${WDSPort}`);
});
