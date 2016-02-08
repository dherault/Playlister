import Hapi from 'hapi';
import JWT from 'jsonwebtoken';
import hapiAuthJWT from 'hapi-auth-jwt2';

import config from '../../config';
import actionCreators from '../../shared/state/actionCreators';
import queryDatabase, { initMiddleware } from './databaseMiddleware';
import { beforeQuery, afterQuery } from './lifecycleMethods';
import { createReason } from './apiUtils.js';
import { logApi, logError, logRequest, logStart, logWarning } from '../../shared/utils/logger';
import isPost from '../../shared/utils/isPost';
import { addJWTAuthStrategyTo, createSession } from '../utils/authUtils';
import { openConnection, createDatabase, createTables, dropDatabase } from './databaseUtils';

/*
  A RESTful JSON API server, based on actionCreators
*/

const server = new Hapi.Server();
const port = config.services.api.port;
const log = logApi;

server.connection({ port });

// Logs request info
server.ext('onRequest', (request, reply) => {
  logRequest(log, request);
  reply.continue();
});

server.register(hapiAuthJWT, err => {
  
  if (err) throw err;
  
  // Authentication strategy
  addJWTAuthStrategyTo(server);
  
  // Dynamic construction of API routes based on actionCreators with API call
  for (let acKey in actionCreators) {
    
    const getShape = actionCreators[acKey].getShape;
    const { intention, method, path, auth, validationSchema, validationOptions } = getShape ? getShape() : {};
    
    if (intention && method) {
      
      // Lifecycle methods
      const before = beforeQuery[intention] || ((req, res, params) => Promise.resolve(params));
      const after  = afterQuery[intention]  || ((req, res, params, result) => Promise.resolve(result));
      
      // In a request object, params's location depends on the HTTP method
      const paramsKey = isPost(method) ? 'payload' : 'query';
      
      server.route({
        method, 
        path: '/' + (path || intention),
        config: { 
          auth: auth ? 'jwt' : false,   // No auth mode like 'try', it's strict or nothing
          cors: { credentials: true },  // Allows CORS requests to be made with credentials
          validate: {                   // Super simple validations
            [paramsKey]: (params, options, next) => {
              if (!validationSchema) return next(null, params);
              validationSchema.validate(params, validationOptions || config.validations.defaultValidationOptions, next);
            }
          }
        },
        handler: (request, reply) => {
          
          const response = reply.response().hold();
          const params = request[paramsKey];
          
          let userId;
          if (request.auth.isAuthenticated) {
            userId = request.auth.credentials.id;
            log('Auth:', userId);
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
                
                log('Response sent:', response.statusCode);
              },
              
              handleError.bind(null, 'afterQuery')
              ),
              err => handleError('queryDatabase', createReason(500, '', err))
            ),
            handleError.bind(null, 'beforeQuery')
          );
          
          function handleError(origin, reason) {
            
            const err = reason.err;
            const msg = reason.msg || '';
            const code = reason.code || 500;
            
            logWarning('Error while API', origin);
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
      logStart('API listening on port', port);
    });
  });
});
