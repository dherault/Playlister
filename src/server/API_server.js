import Hapi from 'hapi';
import bcrypt from 'bcrypt';

import config from './config';
import log, { logError } from '../utils/logger';
import actionCreators from '../state/actionCreators';
import { connect, createCollections, dropDatabase } from './database/databaseUtils';
import queryDatabase, { initMiddleware } from './database/databaseMiddleware';

const server = new Hapi.Server();
server.connection({ port: config.APIPort });

// Connects to the mongo database
connect()
// .then(dropDatabase)
.then(createCollections)
.then(db => {
  
  // Passes the mongoclient object to db middleware
  initMiddleware(db);
  
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
  
  const afterQuery = {
    
    // createUser: (result, params, request) => new Promise((resolve, reject) => {
    //   if (!result || !result.id) return reject(createReason(500, 'createUser no userId'));
      
    //   resolve({
    //     userId: result.id,
    //     expiration: new Date().getTime() + ttl,
    //   });
    // }),
  };
  
  const nothing = x => Promise.resolve(x);
  
  // Dynamic construction of the API routes from actionCreator with API calls
  for (let acKey in actionCreators) {
    
    const getShape = actionCreators[acKey].getShape;
    const { intention, method, path } = getShape ? getShape() : {};
    
    if (method && path) {
      const before = addCommonFlags(intention) || nothing;
      const after  = afterQuery[intention]  || nothing;
      
      server.route({
        method, 
        path,
        handler: (request, reply) => {
          
          const response = reply.response().hold();
          const params = method === 'post' || method === 'put' ? request.payload : request.query;
          
          console.log('API', request.path, params);
          
          before(params, request).then(modifiedParams => 
            queryDatabase(intention, modifiedParams).then(result => 
              after(result, modifiedParams, request).then(modifiedResult => {
                  
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
    
    const before = beforeQuery[intention] || nothing;
    
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
    log('API listening on port', config.APIPort);
  });
  
}, err => console.error(err));
