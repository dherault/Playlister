import JWT from 'jsonwebtoken';

import config from '../../config';
import xhr from '../../shared/utils/xhr';
import log, { logError } from '../../shared/utils/logger';

const { secretKey } = config.jwt;

export function createSession(userId) {
  log('... createSession');
  
  const session = {
    id: userId,
    valid: true, // this will be set to false when the person logs out
    exp: new Date().getTime() + config.jwt.cookieOptions.ttl
  };
  
  // create the session in kvs
  xhr('put', config.services.kvs.url, { 
    key: session.id, 
    value: session,
    store: config.jwt.kvsStore,
    ttl: config.jwt.cookieOptions.ttl,
  })
  .catch(({ status, response, error }) => log('!!! API validate kvs error', status, response, error));
  
  // sign the session as a JWT
  const token = JWT.sign(session, secretKey); // synchronous
  
  return token;
}

export function validateSession(decoded, request, callback) {
  // console.log(" - - - - - - - DECODED token:");
  // console.log(decoded);
  log('... validateSession');
  
  // do your checks to see if the session is valid
  xhr('get', config.services.kvs.url, { store: config.jwt.kvsStore, key: decoded.id }).then(session => {
    // console.log(' - - - - - - - KVS reply - - - - - - - ', session);
    callback(null, session.valid, session);
    
  }, ({ status, response, error }) => {
    log('!!! API validate kvs error', status, response, error);
    callback(error, false);
  });
}

export function addJWTAuthStrategyTo(server) {
  server.auth.strategy('jwt', 'jwt', true, { 
    key: secretKey,
    verifyFunc: validateSession,
    verifyOptions: { ignoreExpiration: false, algorithms: [ 'HS256' ] },
  });
}

export function verifyToken(token) {
  
  return new Promise((resolve, reject) => {
    JWT.verify(token, secretKey, (err, decoded) => {
      if (err) return reject(err);
      else if (!decoded) return reject('malformed token');
      else if (!decoded.valid) return reject('invalid token');
      else if (decoded.exp < new Date().getTime()) return reject('expired token');
      
      resolve(decoded.id);
    });
  });
}
