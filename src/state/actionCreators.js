import log from '../utils/logger';
import isServer from '../utils/isServer';
import definitions from '../models/definitions';
import { capitalizeFirstChar } from '../utils/textUtils';

const cac = createActionCreator;

// An action creator outputs a standard action from a plain object or undefined input
const actionCreators = {
  logout: () => ({ type: 'LOGOUT' }),
  
  login: cac({
    intention:  'login',
    method:     'post',
    path:      '/api/login',
    auth:       false,
  }),
  
  readAll: cac({
    intention: 'readAll',
    method: 'get',
    path: '/api/readAll',
    auth: false, // !
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
  
  const actionCreator = params => {
    
    log('.A.', intention, params ? JSON.stringify(params) : '');
    
    const action = { 
      types, 
      params, 
      promise: isServer ? 
        
        // Server rendering : direct db middleware call  // Or call API ?
        require('../server/database/databaseMiddleware')(intention, params) :
        
        // Client : API call through XMLHttpRequest
        new Promise((resolve, reject) => {
          
          const xhr = new XMLHttpRequest();
          const isPost = method === 'post' || method === 'put';
          
          // URI construction
          let pathWithQuery = path;
          if (!isPost && params) {
            pathWithQuery += '?';
            let addand = false;
            
            for (let key in params) {
              const val = params[key];
              addand ? pathWithQuery += '&' : addand = true;
              if (val) pathWithQuery += `${encodeURIComponent(key)}=${encodeURIComponent(val)}`;
            }
          }
          
          log(`+++ --> ${method} ${path}`, params);
          
          xhr.onerror = err => reject({ 
            status: 0, 
            response: 'An error occured, check your internet connection: ' + err.message, 
          });
          
          // Queries are launched when an action gets created, not dispatched
          xhr.open(method, pathWithQuery);
          
          xhr.onload = () => {
            const { status, response } = xhr;
            let data;
            try { // Let's try to parse the answer
              data = JSON.parse(response);
              status === 200 ? resolve(data) : reject({ status, response });
            }
            catch(e) {
              reject({ status, response });
            }
          };
          
          if (isPost) {
            xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
            xhr.send(JSON.stringify(params));
          }
          else xhr.send();
        })
    };
    
    // New promise chain because promiseMiddleware is the end catcher
    action.promise.then(result => {
      log(`+++ <-- ${intention}`, result);
      return result;
    }, ({ status, response }) => {
      log('!!! action.promise error', intention, params);
      log('!!! response', status, response);
    }); 
    
    return action;
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
    const path = '/api/' + x;
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
