import express from 'express';
import webpack from 'webpack';
import config from '../../config';
import webpackConfig from './webpack.config.dev';
import { logStart, logError } from '../../shared/utils/logger';

const app = express();
const compiler = webpack(webpackConfig);
const port = config.services.webpack.port;

app.use(require('webpack-dev-middleware')(compiler, {
  noInfo: true,
  publicPath: webpackConfig.output.publicPath
}));

app.use(require('webpack-hot-middleware')(compiler));

app.listen(port, '0.0.0.0', err => {
  if (err) return logError('dev_server start', err);
  
  logStart(`Webpack server listening on port ${port}`);
});
