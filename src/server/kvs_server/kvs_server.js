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
server.connection({ port });

const options = { partition: config.mongo.dbs.kvs , uri: config.mongo.uri };
const mongoClient = new Catbox.Client(CatboxMongo, options);

server.route({
  method: 'get', 
  path: '/kvs/get',
  handler: (request, reply) => {
    const response = reply.response().hold();
    const key = request.query.key;
    log('KVS get', key);
    
    mongoClient.get(key, (err, cached) => {
        if (err) {
          response.statusCode = 500;
          response.send();
        } else if (cached) {
          response.source = cached.item;
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
  path: '/kvs/set',
  handler: (request, reply) => {
    const response = reply.response().hold();
    const { key, value } = request.params;
    log('KVS set', key, value);
    
    mongoClient.set(key, value, ttl, err => {
      if (err) {
        response.statusCode = 500;
        response.send();
      } else {
        response.statusCode = 200;
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