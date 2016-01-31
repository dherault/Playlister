import uuid from 'uuid';
import JWT from 'jsonwebtoken';

import config from '../../config';
import xhr from '../../shared/utils/xhr';
import log, { logError } from '../../shared/utils/logger';

export function createSession() {
  const session = {
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
  })
  .catch(({ status, response, error }) => log('!!! API validate kvs error', status, response, error));
  
  // sign the session as a JWT
  const token = JWT.sign(session, config.jwt.secretKey); // synchronous
  console.log(token);
  
  return token;
}

export function validateSession(decoded, request, callback) {
  console.log(" - - - - - - - DECODED token:");
  console.log(decoded);
  
  // do your checks to see if the session is valid
  xhr('get', config.services.kvs.url, { store: config.jwt.kvsStore, key: decoded.id }).then(session => {
    console.log(' - - - - - - - KVS reply - - - - - - - ', session);
    callback(null, session.valid, session);
    
  }, ({ status, response, error }) => {
    log('!!! API validate kvs error', status, response, error);
    callback(error, false);
  });
}