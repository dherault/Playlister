import Hapi from 'hapi';
import inert from 'inert';
import uuid from 'uuid';

import config from '../config';
import Aquarelle from './aquarelle';
import log, { logError } from '../../utils/logger';

const server = new Hapi.Server();
const port = config.services.image.port;
server.connection({ port });

server.register(require('inert'), err => {

  if (err) throw err;
  
  const imagesDir = 'src/server/image_server/images/';
  const profilePictureGenerator = new Aquarelle(imagesDir + 'base');
  
  server.route({
    method: 'get', 
    path: '/img/{folder}/{name}',
    handler: (request, reply) => {
      reply.file(imagesDir + request.params.folder + '/' + request.params.name);
    }
  });
  
  server.route({
    method: 'get', 
    path: '/img/random/{size}',
    handler: (request, reply) => {
      
      const response = reply.response().hold();
      const name = uuid.v4() + '.png';
      
      profilePictureGenerator
        .generateFile(imagesDir + 'generated/' + name, { width: request.params.size })
        .then(({ originalName }) => {
          response.source = { 
            name, 
            originalName, 
            url: '/img/generated/' + name,
            originalUrl: '/img/base/' + originalName 
          };
          response.send();
        }, err => {
          response.statusCode = 500;
          response.source = err;
          response.send();
        });
    }
  });
    
  server.start(err => {
    if (err) return console.error(err);
    log('Image server listening on port', port);
  });
  
});
