import Hapi from 'hapi';
import uuid from 'uuid';

import config from '../../config';
import Aquarelle from './aquarelle';
import log, { logError } from '../../shared/utils/logger';

/*
  An HTTP service able to generate random profile pictures
*/

const server = new Hapi.Server();
const port = config.services.image.port;
const assetUrl = config.services.asset.url + 'images/';
const imagesDir = 'src/server/public/images/';
const profilePictureGenerator = new Aquarelle(imagesDir + 'base');

server.connection({ port });

server.route({
  method: 'get', 
  path: '/random/{size}',
  config: { cors: true }, // For the test page to make CORS calls
  handler: (request, reply) => {
    
    const response = reply.response().hold();
    const name = uuid.v4() + '.png';
    const width = request.params.size;
    
    log('IMG', 'Get /random/', width);
    
    profilePictureGenerator
      .generateFile(imagesDir + 'generated/' + name, { width })
      .then(({ originalName }) => {
        response.source = { 
          name, 
          originalName, 
          url: assetUrl + 'generated/' + name,
          originalUrl: assetUrl + 'base/' + originalName 
        };
        response.send();
      }, err => {
        logError('Image server /random', err);
        response.statusCode = 500;
        response.send();
      });
  }
});
  
server.start(err => {
  if (err) throw err;
  log('.:. Image server listening on port', port);
});
  
