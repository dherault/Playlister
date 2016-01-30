import Hapi from 'hapi';
import inert from 'inert';

import config from '../../config';
import log from '../../shared/utils/logger';

/*
  A super-classic development-only static server 
  (renamed asset server because 'static' is a reserved JS word)
*/

const server = new Hapi.Server();
const port = config.services.asset.port;

server.connection({ port });
server.register(inert, err => {

  if (err) throw err;
  
  server.route({
    method: 'GET',
    path: '/{param*}',
    handler: {
      directory: {
        path: './src/server/public',
        listing: true,
        index: false // won't return index.html on 'get /' but a listing of the directory
      }
    }
  });
  
  server.start(err => {
    if (err) throw err;
    log('.:. Static server listening on port', port);
  });
  
});
