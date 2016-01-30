import fs from 'fs';
import Hapi from 'hapi';
import uuid from 'uuid';
import JWT from 'jsonwebtoken';
import hapiAuthJWT from 'hapi-auth-jwt2'; // http://git.io/vT5dZ

import config from '../../config';
import xhr from '../../shared/utils/xhr';
import log, { logError } from '../../shared/utils/logger';

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
  
  server.auth.strategy('jwt', 'jwt', true, { 
    key: config.jwt.key,
    verifyFunc: validate,
    verifyOptions: { ignoreExpiration: true, algorithms: [ 'HS256' ] },
  });
  
  server.route({
    method: 'get', 
    path: '/{p*}', // catch all
    config: { auth: false },
    handler: (request, reply) => {
      
      const response = reply.response().hold();
      // const params = method === 'post' || method === 'put' ? request.payload : request.query;
      log('RND', 'Get', request.path, request.info.remoteAddress);
      
      // response.source = html.replace('<body>', `<body><div id="mountNode">${mountMeImFamous}</div>` +
      //   `<script>window.STATE_FROM_SERVER=${JSON.stringify(serverState)}</script>` +
      //   `<script src="${hotFile}"></script>` +
      //   `<script src="${publicPath + filename}"></script>`);
      response.source = html;
      
      response.send(); // Bon voyage
      
    }
  });
  
  // bring your own validation function
  function validate(decoded, request, callback) {
    console.log(" - - - - - - - DECODED token:");
    console.log(decoded);
    
    // do your checks to see if the session is valid
    xhr('get', config.services.kvs.url, { store: config.jwt.kvsStore, key: decoded.id }).then(session => {
      console.log(' - - - - - - - KVS reply - - - - - - - ', session);
      callback(null, session.valid, session);
      
    }, err => {
      logError('RND validate kvs error', err);
      callback(err, false);
    });
  }
  
  function createSession(response) {
    var session = {
      valid: true, // this will be set to false when the person logs out
      id: uuid(), // a random session id
      exp: new Date().getTime() + config.jwt.cookieOptions.ttl
    };
    
    // create the session in kvs
    xhr('put', config.services.kvs.url, { 
      key: session.id, 
      value: session,
      store: config.jwt.kvsStore,
      ttl: config.jwt.cookieOptions.ttl,
    }).catch(err => logError('API kvs put', err));
    
    // sign the session as a JWT
    const token = JWT.sign(session, config.jwt.secretKey); // synchronous
    console.log(token);
    
    if (response) response.header("Authorization", token).state("jwt", token, config.jwt.cookieOptions);
    
    return token;
  }
  
  server.start(() => {
    log('.:. Rendering server listening on port', port);
  });
  
});
