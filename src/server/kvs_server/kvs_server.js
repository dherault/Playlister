import Hapi from 'hapi';
import Catbox from 'catbox';
import CatboxRedis from 'catbox-redis';
// import io from 'socket.io-client';

import config from '../../config';
import log, { logError } from '../../shared/utils/logger';

/* 
  A key-value storage server with caching
*/

const defaulTtl = 1000 * 60 * 60 * 24; // 1 day
const port = config.services.kvs.port;
const options = config.redis;

const server = new Hapi.Server();
const storage = new Catbox.Client(CatboxRedis, options);

server.connection({ port });

server.route({
  method: 'GET',
  path: '/',
  config: { cors: true }, // For the test page to make CORS calls
  handler: (request, reply) => {
    
    const response = reply.response().hold();
    const { store, key } = request.query;
    
    if (!store || !key) {
      response.statusCode = 400; // Bad request (?)
      return response.send();
    }
    
    log('KVS Get', key);
    
    storage.get({ segment: store, id: key }, (err, cached) => {
      if (err) {
        response.statusCode = 500;
        response.send();
        console.error(err);
      } else if (cached) {
        response.source = JSON.stringify(cached.item);
        response.send();
      } else {
        response.statusCode = 404;
        response.send();
      }
    });
  }
});

server.route({
  method: 'PUT', 
  path: '/',
  config: { cors: true }, // For the test page to make CORS calls
  handler: (request, reply) => {
    
    const response = reply.response().hold();
    const { key, value, store, ttl } = request.payload;
    log(key, value, store, ttl);
    if (!store || !key || typeof value === 'undefined') {
      response.statusCode = 400; // Bad request (?)
      return response.send();
    }
    
    log('KVS Set', key, value);
    
    storage.set({ id: key, segment: store }, value, ttl || defaulTtl, err => {
      if (err) {
        response.statusCode = 500;
        response.send();
      } else {
        response.statusCode = 200;
        response.source = true;
        response.send();
      }
    });
  }
});

server.start(err => {
  if (err) throw err;
  
  storage.start(err => {
    if (err) throw err;
    
    log('.:. KVS server listening on port', port);
  });
});
