import JWT from 'jsonwebtoken';

import config from '../../config';
import customFetch from '../../shared/utils/customFetch';
// import xhr from '../../shared/utils/xhr';
import { log, logError } from '../../shared/utils/logger';

const { secretKey } = config.jwt;

export function createSession(userId) {
  log('createSession');
  
  const session = {
    id: userId,
    valid: true, // this will be set to false when the person logs out
  };
  
  // create the session in kvs
  setSession(session).catch(err => logError('createSession.setSession', err));
  
  // sign the session as a JWT
  const token = JWT.sign(session, secretKey); // synchronous
  
  return token;
}

export function validateSession(decoded, request, callback) {
  log('validateSession');
  // log(decoded);
  const { id } = decoded;
  if (!id) return callback(new Error('validateSession: no id found in decoded token'), false);
  
  getSession(id)
  .then(session => callback(null, session.valid, session))
  .catch(({ status, response, error }) => {
    log('!!! API validate kvs error', status, response, error);
    callback(error, false);
  });
}

export function addJWTAuthStrategyTo(server) {
  
  server.auth.strategy('jwt', 'jwt', true, { 
    key: secretKey,
    verifyFunc: validateSession,
    verifyOptions: { 
      ignoreExpiration: true, // Only the KVS service knows when the session expires
      algorithms: [ 'HS256' ] 
    },
  });
  
  // Sets options for the auth cookie
  server.state('token', config.jwt.cookieOptions);
}

// This is to be used only by the websocket server, which does not have a hapi auth strategy
// It basically does what hapi-auth-jwt2 does but much more carelessly
// It is still not safe enough, only a http-only cookie could safen it (I think)
export function verifyToken(token) {
  
  return new Promise((resolve, reject) => {
    JWT.verify(token, secretKey, (err, decoded) => { // Does not take into account params like 'algorithms'
      if (err) return reject(err);
      else if (!decoded) return reject('malformed token');
      else if (!decoded.id) return reject('invalid token');
      
      getSession(decoded.id)
      .then(session => session.valid ? resolve(session) : reject('invalid session'))
      .catch(reject);
    });
  });
}

export function getSession(id) {
  log('getSession');
  return customFetch(config.services.kvs.url, { store: config.jwt.kvsStore, key: id });
}

export function setSession(session) {
  log('setSession');
  return customFetch(config.services.kvs.url, { 
    store: config.jwt.kvsStore, 
    key: session.id, 
    value: session, 
    ttl: config.jwt.cookieOptions.ttl
  }, {
    method: 'put'
  });
}
