import log from '../utils/logger';
import definitions from '../models/definitions';
import isEqual from 'lodash.isequal';

const crud = reduceDefaultCRUDTypes;

export default {
  users: crud('user', (state={}, action) => {
    
    
    log('.R. ' + action.type); // keep this line in the first reducer
    
    return state;
  }),
  
  
  lastAction: (state={}, action) => action,
  records: (state=[], action) => [...state, Object.assign({ date: new Date().getTime() }, action)],
};

function reduceDefaultCRUDTypes(model, reducer) {
  
  return (state, action) => {
    
    // equality check to overide this fn easily
    const newState = reducer(state, action);
    if (!isEqual(state, newState)) return newState;
    
    const ns = definitions[model].name.toUpperCase();
    const np = definitions[model].pluralName;
    
    const { type, params, payload } = action;
    
    const bingo = ['READ', 'CREATE', 'UPDATE', 'DELETE']
      .map(x => `SUCCESS_${x}_${ns}`)
      .concat(['SUCCESS_READ_ALL']);
    
    switch (bingo.indexOf(type)) {
      
      case -1:
        return newState;
        
      case 0:
      case 1:
        return Object.assign({}, newState, { [payload._id]: payload });
        
      case 2:
        const { id } = params;
        return Object.assign({}, newState, { [id]: Object.assign({}, newState[id], params) });
      
      case 4:
        return params.collection !== np ? newState : Object.assign({}, payload);
      
      default:
        return newState;
    }
  };
}
