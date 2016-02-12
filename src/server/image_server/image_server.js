import Hapi from 'hapi';
import uuid from 'uuid';

import config from '../../config';
import Aquarelle from './aquarelle';
import { createLogger, logError, logStart, logRequest } from '../../shared/utils/logger';

/*
  An HTTP service able to generate random profile pictures
*/

const log = createLogger({
  prefix: 'IMG',
  chalk: 'bgBlack',
});

const server = new Hapi.Server();
const port = config.services.image.port;
const assetUrl = config.services.asset.url + 'images/';
const imagesDir = 'src/server/public/images/';
const profilePictureGenerator = new Aquarelle(imagesDir + 'base');

server.connection({ port });

// Logs request info
server.ext('onRequest', (request, reply) => {
  logRequest(log, request);
  reply.continue();
});

server.route({
  method: 'get', 
  path: '/random/{size}',
  config: { cors: true }, // For the test page to make CORS calls
  handler: (request, reply) => {
    
    const response = reply.response().hold();
    
    generateImage(request.params.size).then(data => {
      response.source = data;
      response.send();
    })
    .catch(err => {
      logError('Image server /random', err);
      response.statusCode = 500;
      response.send();
    });
  }
});

server.route({
  method: 'get', 
  path: '/random/test/{size}',
  config: { cors: true }, // For the test page to make CORS calls
  handler: (request, reply) => {
    
    const response = reply.response().hold();
    
    generateImage(request.params.size).then(data => {
      response.source = `<html><body><img src="${data.url}"/><br/><br/><img src="${data.originalUrl}"/></body></html>`;
      response.send();
    })
    .catch(err => {
      logError('Image server /random/test', err);
      response.statusCode = 500;
      response.send();
    });
  }
});
  
server.start(err => {
  if (err) throw err;
  logStart('Image server listening on port', port);
});
  
function generateImage(width=200, height) {
  
  const name = uuid.v4() + '.png';
  
  return profilePictureGenerator.generateFile(imagesDir + 'generated/' + name, { width, height })
  .then(({ originalName }) => ({
    name, 
    originalName, 
    url: assetUrl + 'generated/' + name,
    originalUrl: assetUrl + 'base/' + originalName 
  }));
}