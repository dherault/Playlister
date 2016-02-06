import bcrypt from 'bcrypt';

import config from '../../config';
import customFetch from '../../shared/utils/customFetch';
import queryDatabase from './databaseMiddleware';
import connectToWebsocketService from '../utils/connectToWebsocketService';
import { logApi, logError } from '../../shared/utils/logger';
import { createReason } from './apiUtils.js';
import { createSession, setSession } from '../utils/authUtils';


const log = logApi;

// Creates websocket service connection to notice user
const socket = connectToWebsocketService('API dev server');

// Allows validation and params mutation before querying db
export const beforeQuery = {
  
  createUser: (request, response, params) => new Promise((resolve, reject) =>
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
export const afterQuery = {
  
  createUser: (request, response, params, result) => {
    
    delete result.passwordHash;
    result.token = createSession(result.id);
    
    // Parallel profile picture processing
    customFetch(config.services.image.url + 'random/200')
    .then(r => {
      const data = { 
        id: result.id,
        imageUrl: r.url, 
        originalImageUrl: r.originalUrl,
      };
      queryDatabase('updateUser', data)
      .then(result => socket.emit('noticeUpdateUser', data))
      .catch(err => logError('API createUser afterQuery queryDatabase error', err));
    })
    .catch(err => logError('API createUser afterQuery fetch error', err));
    
    return Promise.resolve(result);
  },
  
  login: (request, response, params, result) => new Promise((resolve, reject) => {
    if (result) bcrypt.compare(params.password, result.passwordHash, (err, isValid) => {
      if (err) return reject(createReason(500, 'login bcrypt.compare', err));
      
      if (isValid) {
        delete result.passwordHash; // We know how to keep secrets
        result.token = createSession(result.id);
        
        resolve(result);
      }
      else reject(createReason(401, 'Invalid password'));
    });
    else reject(createReason(401, 'User not found'));
  }),
  
  logout: (request, response, params, result) => {
    const session = Object.assign({}, request.auth.credentials);
    session.valid = false;
    return setSession(session).then(() => true);
  }
};
