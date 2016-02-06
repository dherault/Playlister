import { createLogger } from '../utils/logger';
import definitions from '../models/definitions';
import isEqual from 'lodash/isEqual';

const log = createLogger({
  prefix: '.R.',
  chalk: 'bgCyan',
  textClient: 'White',
  backgroundClient: 'SkyBlue',
});

const reducers = {
  users: (state={}, { type, params, payload }) => {
    
    log(type); // keep this line in the first reducer
    
    switch (type) {
      
      case 'SUCCESS_LOGIN':
      case 'SUCCESS_READ_USER_BY_USERNAME':
        return Object.assign({}, state, { [payload.id]: Object.assign({}, payload) });
        
      case 'FAILURE_READ_USER_BY_USERNAME':
        return payload.status === 404 ? 
          Object.assign({}, state, { ['notFound' + Math.random()]: Object.assign({}, params, { notFound: true }) }) :
          state;
          
      default:
        return state;
    }
  },
  
  session: (state={}, { type, params, payload }) => {
    switch (type) {
      
      case 'SUCCESS_LOGIN':
      case 'SUCCESS_CREATE_USER':
        return { userId: payload.id, token: payload.token };
        
      case 'SUCCESS_LOGOUT':
        return {};
      
      default:
        return state;
    }
  },
  
  // Side effects and logging reducers
  // lastAction: (state={}, action) => action,
  records: (state=[], action) => [...state, Object.assign({ date: new Date().getTime() }, action)],
};

// Adds default reduce cases for defined models
for (let model in definitions) {
  const np = definitions[model].pluralName;
  const reducer = reducers[np] || ((s={}, a) => s);
  reducers[np] = enhanceCRUD(model, reducer);
}

export default reducers;

// A reducer "enhancer" for CRUD operations
function enhanceCRUD(model, reducer) {
  
  return (state, action) => {
    
    // equality check to overide this fn easily :( this is slow ):
    const newState = Object.assign({}, reducer(state, action));
    if (!isEqual(state, newState)) return newState;
    
    const ns = definitions[model].name.toUpperCase();
    const np = definitions[model].pluralName;
    
    const { type, params, payload } = action;
    
    switch (type) {
      
      case `SUCCESS_READ_${ns}`:
      case `SUCCESS_CREATE_${ns}`:
        newState[payload.id] = payload;
        return newState;
      
      case `SUCCESS_UPDATE_${ns}`:
        const { id } = params;
        newState[id] = Object.assign({}, newState[id], params);
        return newState;
      
      case `SUCCESS_DELETE_${ns}`:
        delete newState[params.id];
        return newState;
      
      case 'SUCCESS_READ_ALL':
        return params.table !== np ? newState : Object.assign({}, payload);
        
      case `FAILURE_READ_${ns}`:
        if (payload.status === 404) newState[params.id] = Object.assign({}, params, { notFound: true });
        return newState;
      
      default:
        return newState;
    }
  };
}
