import isPlainObject from 'lodash/isPlainObject';

import config from '../../config';
import definitions from '../models/definitions';
import { createLogger, logError, logFetch } from '../utils/logger';
import { capitalizeFirstChar } from '../utils/textUtils';
import isServer from '../utils/isServer';
import customFetch from '../utils/customFetch';

const log = createLogger({
  prefix: '.A.',
  chalk: 'bgGreen',
  textClient: 'White',
  backgroundClient: 'YellowGreen',
});

const cac = createActionCreator;
const apiUrl = config.services.api.url;

// An action creator takes a k/v object argument and outputs a standard action
const actionCreators = {
  
  login: cac({
    intention:  'login', // The ac's name, its intention and its path are redundant, to be fixed ?
    method:     'post',
    path:       'login',
    auth:       false,
  }),
  
  logout: cac({
    intention:  'logout',
    method:     'get',
    path:       'logout',
    auth:       true,
  }),
  
  readAll: cac({
    intention:  'readAll',
    method:     'get',
    path:       'readAll',
    auth:       true,
  }),
  
  readUserByUsername: cac({
    intention:  'readUserByUsername',
    method:     'get',
    path:       'readUserByUsername',
    auth:       false,
  }),
  
};

export default Object.assign({}, createDefaultCRUDActionCreators(), actionCreators);

// (string)            intention   The queryDatabase handle, also used to create actionTypes
// (string)            method      HTTP method
// (string)            path        API path. If (method && path) a corresponding API route gets created
// (string or false)   auth        Authentication strategy
// returns an actionCreator
function createActionCreator(shape) {
  
  const { intention, method, path } = shape;
  
  // Action type is created from intention
  const types = ['REQUEST', 'SUCCESS', 'FAILURE'].map(t => `${t}_${intention.replace(/[A-Z]/g, '_$&')}`.toUpperCase());
  
  // Optionnaly, a token can be passed to the actionCreator to ensure remote auth via the Authorization header
  const actionCreator = (params, token) => {
    
    if (params && !isPlainObject(params)) throw new Error(`actionCreator ${intention}: params should be a plain object.`);
    
    const options = { method };
    const url = apiUrl + path;
    
    log(intention, params);
    logFetch(`--> ${method} ${url}`);
    
    // Credentials management
    if (token) options.headers = { 'Authorization': token };
    else options.credentials = 'include'; // for CORS requests
    
    const promise = customFetch(url, params, options);
    
    // New promise chain because promiseMiddleware is the end catcher
    promise.then(result => {
      if (!isServer) logFetch(`<-- ${intention}`, result);
    }, response => {
      logError(`Action ${intention} error:`, response.statusText || response);
    });
    
    return { types, params, promise };
  };
  
  // getters
  actionCreator.getTypes = () => types;
  actionCreator.getShape = () => shape;
  
  return actionCreator;
}


function createDefaultCRUDActionCreators() {
  const ac = {};
  
  for (let model in definitions) {
    const x = capitalizeFirstChar(model);
    const path = x;
    const _create = 'create' + x;
    const _read   = 'read'   + x;
    const _update = 'update' + x;
    const _delete = 'delete' + x;
    
    ac[_create] = createActionCreator({
      path,
      method: 'post',
      intention: _create,
    });
    ac[_read] = createActionCreator({
      path,
      method: 'get',
      intention: _read,
    });
    ac[_update] = createActionCreator({
      path,
      method: 'put',
      intention: _update,
    });
    ac[_delete] = createActionCreator({
      path,
      method: 'delete',
      intention: _delete,
    });
  }
  
  return ac;
} 
