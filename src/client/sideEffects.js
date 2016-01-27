import ac from '../state/actionCreators';
import { routeActions } from 'react-router-redux';

const goToUserProfile = (store, state, action) => store.dispatch(routeActions.push('/@' + action.payload.username));

// Side effects 
const sideEffects = {
  
  SUCCESS_LOGIN: goToUserProfile,
  SUCCESS_CREATE_USER: goToUserProfile,
};
  
export default function registerSideEffects(store) {
  
  store.subscribe(() => {
    
    const state = store.getState();
    const lastAction = state.lastAction;
    const se = sideEffects[lastAction.type];
    
    if (se) se(store, state, lastAction);
  });
}
