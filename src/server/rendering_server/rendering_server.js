import fs from 'fs';
import Hapi from 'hapi';
import hapiAuthJWT from 'hapi-auth-jwt2'; // http://git.io/vT5dZ

import config from '../../config';
// import xhr from '../../shared/utils/xhr';
import log, { logError } from '../../shared/utils/logger';
import { addJWTAuthStrategyTo } from '../utils/authUtils';

/*
  This rendering server is the main endpoint for the app
  In development, webpack-dev-server proxies all requests to it
*/

const html = fs.readFileSync('./src/server/public/index.html', 'utf8')
  .replace('</body>', `<script src="${config.services.webpack.url}bundle.js"></script></body>`);

const server = new Hapi.Server();
const port = config.services.rendering.port;

server.connection({ port });
server.register(hapiAuthJWT, err => {
  
  if (err) throw err;
  
  // Authentication strategy
  addJWTAuthStrategyTo(server);
  
  server.route({
    method: 'get', 
    path: '/{p*}', // catch all
    config: { auth: { mode: 'try' } }, 
    handler: (request, reply) => {
      
      const response = reply.response().hold();
      // const params = method === 'post' || method === 'put' ? request.payload : request.query;
      log('RND', 'Get', request.path, request.info.remoteAddress);
      log('RND', 'state', request.state);
      log('RND', 'auth', request.auth.credentials);
      
      // let retrieveUserIdFromCookie = Promise.resolve();
      // if (request.state.token) retrieveUserIdFromCookie = verifyToken(verifyToken);
      
      // retrieveUserIdFromCookie.then(userId => {
        
      // })
      
      // response.source = html.replace('<body>', `<body><div id="mountNode">${mountMeImFamous}</div>` +
      //   `<script>window.STATE_FROM_SERVER=${JSON.stringify(serverState)}</script>` +
      //   `<script src="${hotFile}"></script>` +
      //   `<script src="${publicPath + filename}"></script>`);
      response.source = html;
      
      response.send(); // Bon voyage
      
    }
  });
  
  server.start(() => {
    log('.:. Rendering server listening on port', port);
  });
  
});
