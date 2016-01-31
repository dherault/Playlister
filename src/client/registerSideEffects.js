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
  
  let recordsIndex = 0;
  const { getState, dispatch } = store;
  
  // Lets add the new arg-given SE to the old ones
  let finalSideEffects = Object.assign({}, sideEffects);
  additionnalSideEffects.forEach(ase => {
    for (let key in ase) {
      const existant = finalSideEffects[key];
      // if a SE allready exists, then both are invoked with a coercive function
      if (existant) finalSideEffects[key] = (s, a, d) => {
        existant(s, a, d);
        ase[key](s, a, d);
      };
      else finalSideEffects[key] = ase[key];
    }
  });
  
  store.subscribe(() => {
    
    const state = getState();
    const records = state.records;
    const recordsLength = records.length;
    
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
