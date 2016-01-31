import Hapi from 'hapi';
import JWT from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import hapiAuthJWT from 'hapi-auth-jwt2'; // http://git.io/vT5dZ

import config from '../../config';
import xhr from '../../shared/utils/xhr';
import log, { logError } from '../../shared/utils/logger';
import actionCreators from '../../shared/state/actionCreators';
import { validateSession, createSession } from '../utils/authUtils';
import connectToWebsocketService from '../utils/connectToWebsocketService';
import queryDatabase, { initMiddleware } from '../database/databaseMiddleware';
import { connect, createCollections, dropDatabase } from '../database/databaseUtils';

/*
  A RESTful JSON API server, based on actionCreators
*/

const server = new Hapi.Server();
const port = config.services.api.port;

server.connection({ port });
server.register(hapiAuthJWT, err => {
  
  if (err) throw err;
  
  // Authentication strategy
  server.auth.strategy('jwt', 'jwt', true, { 
    key: config.jwt.key,
    verifyFunc: validateSession,
    verifyOptions: { ignoreExpiration: true, algorithms: [ 'HS256' ] },
  });
  
  // Sets options for the auth cookie
  server.state('token', config.jwt.cookieOptions);
  
  // Creates websocket service connection to notice user
  const socket = connectToWebsocketService('API dev server');
  
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
      
      const token = createSession(response);
      response.header("Authorization", token).state("token", token, config.jwt.cookieOptions);
      
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
          err => logError('API createUser afterQuery queryDatabase error', err));
      }, err => logError('API createUser afterQuery xhr error', err));
      
      return Promise.resolve(r);
    },
    
    login: (result, { email, password }, request, response) => new Promise((resolve, reject) => {
      if (result) bcrypt.compare(password, result.passwordHash, (err, isValid) => {
        if (err) return reject(createReason(500, 'login bcrypt.compare', err));
        
        if (isValid) {
          delete result.passwordHash; // We know how to keep secrets
          
          result.token = createSession(response);
          
          resolve(result);
        }
        else reject(createReason(401, 'Invalid password'));
      });
      else reject(createReason(401, 'User not found'));
    }),
  };
  const resolve = x => Promise.resolve(x);
  
  // Dynamic construction of API routes based on actionCreators with API call
  for (let acKey in actionCreators) {
    
    const getShape = actionCreators[acKey].getShape;
    const { intention, method, path, auth } = getShape ? getShape() : {};
    
    if (method && path) {
      const before = addCommonFlags(intention) || resolve;
      const after  = afterQuery[intention]  || resolve;
      
      server.route({
        method, 
        path: '/' + path,
        config: { auth: auth ? 'jwt' : false, cors: true },
        handler: (request, reply) => {
          
          const response = reply.response().hold();
          const params = method === 'post' || method === 'put' ? request.payload : request.query;
          
          log('API', method, path, params);
          
          before(params, request).then(modifiedParams => 
            queryDatabase(intention, modifiedParams).then(result => 
              after(result, modifiedParams, request, response).then(modifiedResult => {
                  
                  if (modifiedResult.token) {
                    // Find a way to modify cookie options globally
                    response.header("Authorization", modifiedResult.token)
                      .state("token", modifiedResult.token);
                    delete modifiedResult.token;
                    
                  } else if (auth) {
                    response.header("Authorization", request.headers.authorization)
                      .state("token", request.headers.authorization);
                  }
                  response.source = modifiedResult;
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
  
  /*
    Server initialization
  */
  
  // Connects to the mongo database
  connect(config.mongo.url + config.mongo.dbs.main)
  // .then(dropDatabase) // Not supposed to be here
  .then(createCollections)
  .then(db => {
    
    // Passes the mongoclient object to db middleware
    initMiddleware(db);
    
    server.start(() => {
      log('.:.', 'API listening on port', port);
    });
    
  });
  
}, err => console.error(err));
