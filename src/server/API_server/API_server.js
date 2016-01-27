import Hapi from 'hapi';
import bcrypt from 'bcrypt';

import config from '../config';
import xhr from '../../utils/xhr';
import log, { logError } from '../../utils/logger';
import actionCreators from '../../state/actionCreators';
import { connect, createCollections, dropDatabase } from '../database/databaseUtils';
import queryDatabase, { initMiddleware } from '../database/databaseMiddleware';

const server = new Hapi.Server();
const port = config.services.api.port;
server.connection({ port });

// Connects to the mongo database
connect(config.services.api.mongoURL)
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
  
  // Same but after the query
  const afterQuery = {
    
    createUser: (result, params, request) => new Promise((resolve, reject) => {
      resolve(result);
      
      // Parallel profile picture processing
      xhr('get', 'http://localhost:8383/img/random/128').then(response => {
        queryDatabase('updateUser', { 
          id: result._id,
          imageUrl: response.url, 
          originalImageUrl: response.originalUrl,
        }).then(result => {
          
        }, err => console.error(err));
      }, err => console.error(err));
    }),
    
    login: (result, { email, password }, request) => new Promise((resolve, reject) => {
      if (result) bcrypt.compare(password, result.passwordHash, (err, isValid) => {
        if (err) return reject(createReason(500, 'login bcrypt.compare', err));
        
        if (isValid) {
          delete result.passwordHash; // We know how to keep secrets
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
    const { intention, method, path } = getShape ? getShape() : {};
    
    if (method && path) {
      const before = addCommonFlags(intention) || resolve;
      const after  = afterQuery[intention]  || resolve;
      
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
  
}, err => console.error(err));
