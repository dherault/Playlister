import isPlainObject from 'lodash/isPlainObject';
import yup from 'yup';

import config from '../../config';
import definitions from '../models/definitions';
import { createLogger, logError, logFetch } from '../utils/logger';
import { capitalizeFirstChar } from '../utils/textUtils';
// import isServer from '../utils/isServer';
import customFetch from '../utils/customFetch';

const log = createLogger({
  prefix: '.A.',
  chalk: 'bgGreen',
  textClient: 'White',
  backgroundClient: 'YellowGreen',
});

const cac = createActionCreator;
const apiUrl = config.services.api.url;

// An action creator takes a plain object argument and outputs a standard action
const actionCreators = {
  
  login: cac({
    intention:  'login', // The ac's name, its intention and its path are redundant, to be fixed ? --> path defaults to intention
    method:     'post',
    auth:       false,
    validationSchema: yup.object().shape({
      email: yup.string().required(), // No email validation because it can be the username
      password: yup.string().required().min(config.validations.minPasswordLength),
    }),
  }),
  
  logout: cac({
    intention:  'logout',
    method:     'get',
    auth:       true,
  }),
  
  readAll: cac({
    intention:  'readAll',
    method:     'get',
    auth:       false,
    validationSchema: yup.object().shape({
      table: yup.string().required(),
    }),
  }),
  
  readUserByUsername: cac({
    intention:  'readUserByUsername',
    method:     'get',
    auth:       false,
    validationSchema: yup.object().shape({
      username: yup.string().required(),
    }),
  }),
  
};

export default Object.assign({}, createDefaultCRUDActionCreators(), actionCreators);

// (string)   intention   The queryDatabase handle, also used to create actionTypes
// (string)   method      HTTP method
// (string)   path        optionnal API path, defaults to intention
// (boolean)  auth        optionnal Authentication strategy
// returns an actionCreator
function createActionCreator(shape) {
  
  const { intention, method, path, validationSchema, validationOptions } = shape;
  
  // Action type is created from intention
  const types = ['REQUEST', 'SUCCESS', 'FAILURE', 'INVALID'].map(t => `${t}_${intention.replace(/[A-Z]/g, '_$&')}`.toUpperCase());
  
  // Optionnaly, a token can be passed to the actionCreator to ensure remote auth via the Authorization header
  const actionCreator = (params, token) => {
    
    if (params && !isPlainObject(params)) throw new Error(`actionCreator ${intention}: params should be a plain object.`);
    
    const options = { method };
    const url = apiUrl + (path || intention);
    
    log(intention, params);
    
    // Credentials management
    if (token) options.headers = { 'Authorization': token };
    else options.credentials = 'include'; // for CORS requests during dev
    
    // Let's perform some validations before firing the API call
    const validationPromise = validationSchema ? 
      validationSchema.validate(params, validationOptions || config.validations.defaultValidationOptions) : 
      Promise.resolve(params);
    const promise = validationPromise.then(validatedParams => {
      logFetch(`--> ${method} ${url}`);
      return customFetch(url, validatedParams, options); // API call
    });
    
    return { intention, types, params, promise }; // A cool action
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
      validationSchema: yup.object().shape({
        id: yup.string().required(),
      }),
    });
    ac[_update] = createActionCreator({
      path,
      method: 'put',
      intention: _update,
      validationSchema: yup.object().shape({
        id: yup.string().required(),
      }),
    });
    ac[_delete] = createActionCreator({
      path,
      method: 'delete',
      intention: _delete,
      validationSchema: yup.object().shape({
        id: yup.string().required(),
      }),
    });
  }
  
  return ac;
} 
