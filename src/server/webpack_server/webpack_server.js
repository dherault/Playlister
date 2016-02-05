import chalk from 'chalk';
import webpack from 'webpack';
import WDS from 'webpack-dev-server';

import config from '../../config.js';
import log from '../../shared/utils/logger';

const port = config.services.webpack.port;
const publicPath = config.services.webpack.url;

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
    path: require('path').resolve('./src/server/public/'),
    filename: 'bundle.js',
    publicPath,
  },
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoErrorsPlugin(),
    new webpack.ProvidePlugin({ // http://mts.io/2015/04/08/webpack-shims-polyfills/
      fetch: 'imports?this=>global!exports?global.fetch!whatwg-fetch'
    }),
    new webpack.IgnorePlugin(/chalk/),
    new webpack.IgnorePlugin(/node-fetch/)
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
  contentBase: './src/server/public',
  publicPath,
  hot: true,
  noInfo : true,
  historyApiFallback: true,
  headers: { 
    'Access-Control-Allow-Origin': '*' // CORS management made easy during dev
  },
  stats: {
    colors: true
  },
  // proxy: {
  //   '*': config.services.rendering.url
  // },
})

// 0.0.0.0 because behind VM
.listen(port, '0.0.0.0', err => {
  if (err) return console.error('WDS.listen', err);
  log(`.:. Webpack server listening on port ${port}`);
});
