import log from '../utils/logger';
import definitions from '../models/definitions';
import isEqual from 'lodash.isequal';

const reducers = {
  users: (state={}, { type, params, payload }) => {
    
    log('.R. ' + type); // keep this line in the first reducer
    
    switch (type) {
      
      case 'SUCCESS_LOGIN':
        return Object.assign({}, state, { [payload._id]: Object.assign({}, payload) });
      
      default:
        return state;
    }
  },
  
  session: (state={}, { type, params, payload }) => {
    switch (type) {
      
      case 'SUCCESS_CREATE_USER':
      case 'SUCCESS_LOGIN':
        return { userId: payload._id };
      
      default:
        return state;
    }
  },
  
  // Side effects and logging reducers
  lastAction: (state={}, action) => action,
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
    
    // Action types to process
    const bingo = ['READ', 'CREATE', 'UPDATE', 'DELETE']
      .map(x => `SUCCESS_${x}_${ns}`)
      .concat(['SUCCESS_READ_ALL']);
    
    switch (bingo.indexOf(type)) {
      
      case -1: // Other action types
        return newState;
      
      case 0: // read
      case 1: // create
        newState[payload._id] = payload;
        return newState;
      
      case 2: // update
        const { id } = params;
        newState[id] = Object.assign({}, newState[id], params);
        return newState;
      
      case 3: // delete
        delete newState[params.id];
        return newState;
      
      case 4: // read all
        return params.collection !== np ? newState : Object.assign({}, payload);
      
      default:
        return newState;
    }
  };
}
