import config from '../../config';
import definitions from '../models/definitions';
import xhr from '../utils/xhr';
import log from '../utils/logger';
import { capitalizeFirstChar } from '../utils/textUtils';
import isServer from '../utils/isServer';

const cac = createActionCreator;

// An action creator takes a k/v object argument and outputs a standard action
const actionCreators = {
  
  login: cac({
    intention:  'login',
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
  
  drop: cac({
    intention:  'drop',
    method:     'delete',
    path:       'drop',
    auth:       true,
  }),
  
  readAll: cac({
    intention:  'readAll',
    method:     'get',
    path:       'readAll',
    auth:       true,
  }),
};

export default Object.assign({}, createDefaultCRUDActions(), actionCreators);

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
    
    log('.A.', intention, params ? JSON.stringify(params) : '');
    log(`+++ --> ${method} ${path}`, params);
    
    const promise = xhr(method, config.services.api.url + path, params, token || true, false);
    
    // New promise chain because promiseMiddleware is the end catcher
    promise.then(result => {
      if (!isServer) log(`+++ <-- ${intention}`, result);
      return result;
    }, ({ status, response, error }) => {
      log('!!! action.promise rejection', intention, params);
      log('!!! response', status, response);
      if (error) log('!!!', error);
    }); 
    
    return { types, params, promise };
  };
  
  // getters
  actionCreator.getTypes = () => types;
  actionCreator.getShape = () => shape;
  
  return actionCreator;
}


function createDefaultCRUDActions() {
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
