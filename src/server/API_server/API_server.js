import Hapi from 'hapi';
import uuid from 'uuid';
import JWT from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import io from 'socket.io-client';
import hapiAuthJWT from 'hapi-auth-jwt2'; // http://git.io/vT5dZ

import config from '../config';
import xhr from '../../utils/xhr';
import log, { logError } from '../../utils/logger';
import actionCreators from '../../state/actionCreators';
import { connect, createCollections, dropDatabase } from '../database/databaseUtils';
import queryDatabase, { initMiddleware } from '../database/databaseMiddleware';

// bring your own validation function
function validate(decoded, request, callback) {
  console.log(" - - - - - - - DECODED token:");
  console.log(decoded);
  
  // do your checks to see if the session is valid
  xhr('get', config.services.kvs.url, { store: config.jwt.kvsStore, key: decoded.id }).then(session => {
    console.log(' - - - - - - - KVS reply - - - - - - - ', session);
    
    if (session.valid === true) {
      return callback(null, true);
    }
    else {
      return callback(null, false);
    }
    
  }, err => {
    console.error(err);
    callback(err, false);
  });
}

const server = new Hapi.Server();
const port = config.services.api.port;
server.connection({ port });

// Connects to the mongo database
connect(config.mongo.url)
// .then(dropDatabase)
.then(createCollections)
.then(db => {
  
  
  server.register(hapiAuthJWT, err => {
    
    if (err) throw err;
    
    server.auth.strategy('jwt', 'jwt', true, { 
      key: config.jwt.key,
      validateFunc: validate,
      verifyOptions: { ignoreExpiration: true, algorithms: [ 'HS256' ] },
      cookieKey: 'jwt'
    });
  
    // Passes the mongoclient object to db middleware
    initMiddleware(db);
    
    // Creates websocket service connection to notice user
    const { serviceSecretNamespace, servicesSecretKey } = config.services.websocket;
    const socket = io(config.services.websocket.url + serviceSecretNamespace);
    socket.on('connect', () => {
      // log('_w_', 'API connected');
      socket.emit('auth', { key: servicesSecretKey, name: 'API dev server' });
    });
    
    socket.on('message', data => {
      // log('_w_', 'API message:', data);
    });
    
    // Allows validation and params mutation before querying db
    const beforeQuery = {
      
      createUser: (params, request) => new Promise((resolve, reject) =>
        bcrypt.genSalt(10, (err, salt) => {
          if (err) return reject(createReason(500, 'createUser bcrypt.genSalt', err));
          
          bcrypt.hash(params.password, salt, (err, passwordHash) => {
            if (err) return reject(createReason(500, 'createUser bcrypt.hash', err));
            
            const modifiedParams = Object.assign({}, params, { passwordHash });
            delete modifiedParams.password;
            resolve(modifiedParams);
          });
        })
      ),
    };
    
    // Same but after the query
    const afterQuery = {
      
      createUser: (result, params, request, response) => {
        
        createSession(response);
        
        const r = Object.assign({}, result);
        ['passwordHash', 'createdAt', 'updatedAt', 'creationIp'].map(x => delete r[x]);
        
        // Parallel profile picture processing
        xhr('get', config.services.image.url + 'random/200').then(response => {
          const data = { 
            id: result._id,
            imageUrl: response.url, 
            originalImageUrl: response.originalUrl,
          };
          
          queryDatabase('updateUser', data).then(result => socket.emit('noticeUpdateUser', data), 
            err => console.error(err));
        }, err => console.error(err));
        
        return Promise.resolve(r);
      },
      
      login: (result, { email, password }, request, response) => new Promise((resolve, reject) => {
        if (result) bcrypt.compare(password, result.passwordHash, (err, isValid) => {
          if (err) return reject(createReason(500, 'login bcrypt.compare', err));
          
          if (isValid) {
            delete result.passwordHash; // We know how to keep secrets
            
            createSession(response);
            
            resolve(result);
          }
          else reject(createReason(401, 'Invalid password'));
        });
        else reject(createReason(401, 'User not found'));
      }),
    };
    
    const resolve = x => Promise.resolve(x); // names are fun too
    
    // Dynamic construction of API routes based on actionCreators with API call
    for (let acKey in actionCreators) {
      
      const getShape = actionCreators[acKey].getShape;
      const { intention, method, path, auth } = getShape ? getShape() : {};
      
      if (method && path) {
        const before = addCommonFlags(intention) || resolve;
        const after  = afterQuery[intention]  || resolve;
        
        server.route({
          method, 
          path,
          config: { auth: auth ? 'jwt' : false },
          handler: (request, reply) => {
            
            const response = reply.response().hold();
            const params = method === 'post' || method === 'put' ? request.payload : request.query;
            
            console.log('API', request.path, params);
            
            before(params, request).then(modifiedParams => 
              queryDatabase(intention, modifiedParams).then(result => 
                after(result, modifiedParams, request, response).then(modifiedResult => {
                    
                    response.source = modifiedResult;
                    if (auth) {
                      response.header("Authorization", request.headers.authorization);
                      response.state("token", request.headers.authorization, config.jwt.cookieOptions);
                    }
                    response.send();
                  },
                  
                  handleError.bind(null, 'afterQuery')
                ),
                err => handleError('queryDatabase', createReason(500, '', err))
              ),
              handleError.bind(null, 'beforeQuery')
            );
            
            function handleError(origin, reason) {
              
              // log('!!!', reason.err);
              const err = reason.err;
              let msg = reason.msg || '';
              let code = reason.code || 500;
              
              log('!!! Error while API', origin);
              logError(msg, err);
              
              // Mongo exceptions, maybe not at the best place
              if (err && err.name === 'MongoError') {
                switch (err.code) {
                  case 11000: // duplicate key error when creating
                    code = 409; // Conflict
                    msg = 'email already exists'; // just email for now
                    break;
                  // default:
                }
              }
              log('Replying', code);
              
              response.statusCode = code;
              response.source = msg;
              response.send();
            }
          }
        });
      }
    }
    
    function createReason(code, msg, err) {
      return { code, msg, err };
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
        store: 'sessions',
        ttl: config.jwt.cookieOptions.ttl,
      });
      
      // sign the session as a JWT
      const token = JWT.sign(session, config.jwt.secretKey); // synchronous
      console.log(token);
      
      if (response) response.header("Authorization", token).state("jwt", token, config.jwt.cookieOptions);
      
      return token;
    }
    
    // This is bad
    function addCommonFlags(intention) {
      
      const before = beforeQuery[intention] || resolve;
      
      if (/^create/.test(intention)) return (params, request) => before(params, request).then(modifiedParams => {
        // log('!!!', request.info)
        const t = new Date().getTime();
        return Object.assign(modifiedParams, {
          createdAt: t,
          updatedAt: t,
          creationIp: request.info.remoteAddress,
        });
      });
      
      else if (/^update/.test(intention)) return (params, request) => before(params, request).then(modifiedParams => {
        return Object.assign(modifiedParams, {
          updatedAt: new Date().getTime(),
        });
      });
      
      else return before;
    }
    
    server.start(() => {
      log('API listening on port', port);
    });
    
  });
}, err => console.error(err));
