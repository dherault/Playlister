import Hapi from 'hapi';
import JWT from 'jsonwebtoken';
import hapiAuthJWT from 'hapi-auth-jwt2';

import config from '../../config';
import actionCreators from '../../shared/state/actionCreators';
import queryDatabase, { initMiddleware } from './databaseMiddleware';
import { beforeQuery, afterQuery } from './lifecycleMethods';
import { createReason } from './apiUtils.js';
import log, { logError, logRequest } from '../../shared/utils/logger';
import { addJWTAuthStrategyTo, createSession } from '../utils/authUtils';
import { openConnection, createDatabase, createTables, dropDatabase } from './databaseUtils';

/*
  A RESTful JSON API server, based on actionCreators
*/

const server = new Hapi.Server();
const port = config.services.api.port;

server.connection({ port });

// Logs request info
server.ext('onRequest', (request, reply) => {
  logRequest('API', request);
  reply.continue();
});

server.register(hapiAuthJWT, err => {
  
  if (err) throw err;
  
  // Authentication strategy
  addJWTAuthStrategyTo(server);
  
  // Dynamic construction of API routes based on actionCreators with API call
  for (let acKey in actionCreators) {
    
    const getShape = actionCreators[acKey].getShape;
    const { intention, method, path, auth } = getShape ? getShape() : {};
    
    if (intention && method && path) {
      
      // Lifecycle methods
      const before = beforeQuery[intention] || ((req, res, params) => Promise.resolve(params));
      const after  = afterQuery[intention]  || ((req, res, params, result) => Promise.resolve(result));
      
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
          
          let userId;
          if (request.auth.isAuthenticated) {
            userId = request.auth.credentials.id;
            log('API', 'Auth:', userId);
          }
          
          // Common keys creation, maybe not at the best place
          if (intention.startsWith('create')) {
            const t = new Date().getTime();
            params.createdAt = t;
            params.updatedAt = t;
            params.creationIp = request.info.remoteAddress;
            if (userId) params.creatorId = userId;
          } else if (intention.startsWith('update')) {
            params.updatedAt = new Date().getTime();
            params.updaterId = userId || 'unknown';
          }
          
          before(request, response, params).then(modifiedParams => 
            queryDatabase(intention, modifiedParams).then(result => 
              after(request, response, modifiedParams, result).then(modifiedResult => {
                
                // Handle 404
                if (modifiedResult === undefined || modifiedResult === null) {
                  response.statusCode = 404;
                } else {
                  response.source = modifiedResult;
                }
                
                // Give session
                if (modifiedResult && modifiedResult.token) {
                  response.state("token", modifiedResult.token);
                // Renew session
                } else if (userId && intention !== 'logout') {
                  response.state("token", createSession(userId));
                }
                
                response.send(); // Bon voyage !
                
                log('API', 'Response sent:', response.statusCode);
              },
              
              handleError.bind(null, 'afterQuery')
              ),
              err => handleError('queryDatabase', createReason(500, '', err))
            ),
            handleError.bind(null, 'beforeQuery')
          );
          
          function handleError(origin, reason) {
            
            const err = reason.err;
            let msg = reason.msg || '';
            let code = reason.code || 500;
            
            log('!!! Error while API', origin);
            logError(msg, err);
            log('Replying', code);
            
            response.statusCode = code;
            response.source = msg;
            response.send();
          }
        }
      });
    }
  }
  
  // Connects to the database
  // databaseUtils should be scripts or whatever, but in dev it's handy to comment in/out a line
  openConnection(config.rethinkdb)
  .then(dropDatabase)
  .then(createDatabase)
  .then(createTables)
  .then(initMiddleware)
  .catch(err => {
    logError('databaseUtils', err);
  })
  .then(() => {
    
    server.start(err => {
      if (err) logError('API server.start', err);
      log('.:.', 'API listening on port', port);
    });
  });
});
