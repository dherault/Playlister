import Hapi from 'hapi';
import hapiAuthJWT from 'hapi-auth-jwt2'; // http://git.io/vT5dZ

import config from '../../config';
import log, { logError, logRequest } from '../../shared/utils/logger';
import { addJWTAuthStrategyTo } from '../utils/authUtils';
import renderingHandler from './renderingHandler';

/*
  This rendering server is the main endpoint for the app
*/

const server = new Hapi.Server();
const port = config.services.rendering.port;

server.connection({ port });

server.ext('onRequest', (request, reply) => {
  logRequest('RND', request);
  reply.continue();
});

server.register(hapiAuthJWT, err => {
  
  if (err) throw err;
  
  // Authentication strategy
  addJWTAuthStrategyTo(server);
  
  server.route({
    method: 'get', 
    path: '/{p*}', // catch all
    config: { auth: { mode: 'try' } }, 
    handler: renderingHandler,
  });
  
  server.start(err => {
    
    if (err) throw err;
    log('.:. Rendering server listening on port', port);
  });
  
});
