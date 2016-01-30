import Hapi from 'hapi';
import Catbox from 'catbox';
import CatboxMongo from 'catbox-mongodb';
// import io from 'socket.io-client';

import config from '../../config';
import log, { logError } from '../../shared/utils/logger';

/* 
  A key-value storage server with caching 
*/

const server = new Hapi.Server();
const port = config.services.kvs.port;
const options = { partition: config.mongo.dbs.kvs , uri: config.mongo.url };
const mongoClient = new Catbox.Client(CatboxMongo, options);

server.connection({ port });

server.route({
  method: 'GET',
  path: '/',
  config: { cors: true }, // For the test page to make CORS calls
  handler: (request, reply) => {
    
    const { store, key } = request.query;
    if (!store || !key) {
      response.statusCode = 400; // Bad request (?)
      return response.send();
    }
    
    log('KVS Get', key);
    const response = reply.response().hold();
    
    mongoClient.get({ segment: store, id: key }, (err, cached) => {
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
    
    const { key, value, store, ttl } = request.payload;
    if (!store || !key || typeof value === 'undefined') {
      response.statusCode = 400; // Bad request (?)
      return response.send();
    }
    
    log('KVS Set', key, value);
    const response = reply.response().hold();
    
    mongoClient.set({ id: key, segment: store }, value, ttl || 1000 * 60, err => {
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
  mongoClient.start(() => {
    log('.:. KVS server listening on port', port);
  });
});
