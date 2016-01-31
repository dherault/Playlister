import { routeActions } from 'react-router-redux';
import ac from '../shared/state/actionCreators';
import log from '../shared/utils/logger';

const goToUserProfile = (state, action, dispatch) => dispatch(routeActions.push('/@' + action.payload.username));

// Side effects 
const sideEffects = {
  
  SUCCESS_LOGIN: goToUserProfile,
  SUCCESS_CREATE_USER: goToUserProfile,
};
  
export default function registerSideEffects(store, ...additionnalSideEffects) {
  
  // Lets add the additionnalSideEffects to the old ones
  const finalSideEffects = Object.assign({}, sideEffects);
  
  additionnalSideEffects.forEach(ase => {
    for (let key in ase) {
      const existant = finalSideEffects[key];
      
      // if a SE allready exists, then both are invoked in a new function
      if (existant) finalSideEffects[key] = (s, a, d) => {
        existant(s, a, d);
        ase[key](s, a, d);
      };
      else finalSideEffects[key] = ase[key];
    }
  });
  
  let recordsIndex = 0;
  const { getState, dispatch } = store;
  
  store.subscribe(() => {
    
    const state = getState();
    const records = state.records;
    const recordsLength = records.length;
    
    // Looks for new action records and checks for associated side effects
    for (let i = recordsIndex; i < recordsLength; i++) {
      recordsIndex++; // Don't use recordsIndex as the loop variable, bad things happen if a SE dispatches
      const action = records[i];
      const se = finalSideEffects[action.type];
      if (se) {
        log('.E.', 'Found side effect for', action.type);
        se(state, action, dispatch);
      }
    }
    
  });
}
