/* key-value store server with caching */

import Hapi from 'hapi';
import Catbox from 'catbox';
import CatboxMongo from 'catbox-mongodb';
import io from 'socket.io-client';

import config from '../config';
import log, { logError } from '../../utils/logger';

const ttl = 1000 * 60;
const server = new Hapi.Server();
const port = config.services.kvs.port;
const options = { partition: config.mongo.dbs.kvs , uri: config.mongo.uri };
const mongoClient = new Catbox.Client(CatboxMongo, options);

server.connection({ port });

server.route({
  method: 'get', 
  path: '/kvs/',
  handler: (request, reply) => {
    
    const { store, key } = request.query;
    if (!store || !key) {
      response.statusCode = 400; // Bad request (?)
      return response.send();
    }
    
    log('KVS get', key);
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
  method: 'put', 
  path: '/kvs/',
  handler: (request, reply) => {
    
    const { key, value, store, ttl } = request.payload;
    if (!store || !key || typeof value === 'undefined') {
      response.statusCode = 400; // Bad request (?)
      return response.send();
    }
    
    log('KVS set', key, value);
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

server.start(() => {
  mongoClient.start(() => {
    log('KVS server listening on port', port);
    
  });
});
