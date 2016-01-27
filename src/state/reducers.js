import log from '../utils/logger';
import definitions from '../models/definitions';
import isEqual from 'lodash.isequal';

const crud = reduceDefaultCRUDTypes;

export default {
  users: crud('user', (state={}, { type, params, payload }) => {
    
    log('.R. ' + type); // keep this line in the first reducer
    
    switch (type) {
      case 'UPDATE_USER_PICTURE':
        const { id } = params;
        const newState = Object.assign({}, state);
        delete params.id;
        return Object.assign({}, newState, { [id]: Object.assign({}, newState[id], params) });
      
      default:
        return state;
    }
  }),
  
  // Side effects and logging reducers
  lastAction: (state={}, action) => action,
  records: (state=[], action) => [...state, Object.assign({ date: new Date().getTime() }, action)],
};

// Default reduce cases for CRUD operations
function reduceDefaultCRUDTypes(model, reducer) {
  
  return (state, action) => {
    
    // equality check to overide this fn easily
    // This is bad, the whole fn is
    const newState = reducer(state, action);
    if (!isEqual(state, newState)) return newState;
    
    const ns = definitions[model].name.toUpperCase();
    const np = definitions[model].pluralName;
    
    const { type, params, payload } = action;
    
    // Actions types to process
    const bingo = ['READ', 'CREATE', 'UPDATE', 'DELETE']
      .map(x => `SUCCESS_${x}_${ns}`)
      .concat(['SUCCESS_READ_ALL']);
    
    switch (bingo.indexOf(type)) {
      
      case -1: // Other action types
        return newState;
        
      case 0: // read
      case 1: // create
        return Object.assign({}, newState, { [payload._id]: payload });
        
      case 2: // update
        const { id } = params;
        return Object.assign({}, newState, { [id]: Object.assign({}, newState[id], params) });
        
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
