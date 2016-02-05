import Hapi from 'hapi';
import JWT from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import hapiAuthJWT from 'hapi-auth-jwt2'; // http://git.io/vT5dZ

import config from '../../config';
// import xhr from '../../shared/utils/xhr';
import customFetch from '../../shared/utils/customFetch';
import log, { logError, logRequest } from '../../shared/utils/logger';
import actionCreators from '../../shared/state/actionCreators';
import { addJWTAuthStrategyTo, createSession, setSession } from '../utils/authUtils';
import connectToWebsocketService from '../utils/connectToWebsocketService';
import queryDatabase, { initMiddleware } from '../database/databaseMiddleware';
import { openConnection, createDatabase, createTables, dropDatabase } from '../database/databaseUtils';

/*
  A RESTful JSON API server, based on actionCreators
*/

const server = new Hapi.Server();
const port = config.services.api.port;

server.connection({ port });

server.ext('onRequest', (request, reply) => {
  logRequest('API', request);
  reply.continue();
});

server.register(hapiAuthJWT, err => {
  
  if (err) throw err;
  
  // Authentication strategy
  addJWTAuthStrategyTo(server);
  
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
    
    createUser: (result, params, request) => {
      
      result.token = createSession(result._id);
      
      const r = Object.assign({}, result);
      ['passwordHash', 'createdAt', 'updatedAt', 'creationIp'].map(x => delete r[x]);
      
      // Parallel profile picture processing
      customFetch(config.services.image.url + 'random/200')
      .then(r => {
        const data = { 
          id: result._id,
          imageUrl: r.url, 
          originalImageUrl: r.originalUrl,
        };
        queryDatabase('updateUser', data)
        .then(result => socket.emit('noticeUpdateUser', data))
        .catch(err => logError('API createUser afterQuery queryDatabase error', err));
      })
      .catch(err => logError('API createUser afterQuery fetch error', err));
      // xhr('get', config.services.image.url + 'random/200').then(response => {
      //   const data = { 
      //     id: result._id,
      //     imageUrl: response.url, 
      //     originalImageUrl: response.originalUrl,
      //   };
        
      //   queryDatabase('updateUser', data).then(result => socket.emit('noticeUpdateUser', data), 
      //     err => logError('API createUser afterQuery queryDatabase error', err));
      // }, err => logError('API createUser afterQuery xhr error', err));
      
      return Promise.resolve(r);
    },
    
    login: (result, { email, password }, request) => new Promise((resolve, reject) => {
      if (result) bcrypt.compare(password, result.passwordHash, (err, isValid) => {
        if (err) return reject(createReason(500, 'login bcrypt.compare', err));
        
        if (isValid) {
          delete result.passwordHash; // We know how to keep secrets
          
          result.token = createSession(result._id);
          
          resolve(result);
        }
        else reject(createReason(401, 'Invalid password'));
      });
      else reject(createReason(401, 'User not found'));
    }),
    
    logout: (result, params, request) => {
      const session = Object.assign({}, request.auth.credentials);
      session.valid = false;
      return setSession(session).then(() => true);
    }
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
        config: { 
          auth: auth ? 'jwt' : false, // No auth mode like 'try', it's strict or nothing
          cors: { credentials: true }, // Allows CORS requests to be made with credentials
        },
        handler: (request, reply) => {
          
          const response = reply.response().hold();
          const params = method === 'post' || method === 'put' ? request.payload : request.query;
          
          log('API', method, path, params);
          if (request.auth.isAuthenticated) log('API', 'Auth:', request.auth.credentials.id);
          
          before(params, request).then(modifiedParams => 
            queryDatabase(intention, modifiedParams).then(result => 
              after(result, modifiedParams, request, response).then(modifiedResult => {
                // Handle 404
                if (modifiedResult === null) response.statusCode = 404;
                // Give session
                else if (modifiedResult.token) response.state("token", modifiedResult.token);
                // Renew session
                else if (request.auth.isAuthenticated && intention !== 'logout') response.state("token", createSession(request.auth.credentials.id));
                
                response.source = modifiedResult;
                response.send();
                log('API', 'Response sent');
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
  openConnection(config.rethinkdb)
  .then(createDatabase)
  .then(createTables)
  .then(initMiddleware)
  .catch(err => {
    logError('databaseUtils', err);
  })
  .then(() => {
    
    server.start(err => {
      if (err) throw err;
      log('.:.', 'API listening on port', port);
    });
  });
});
