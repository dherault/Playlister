import log from '../utils/logger';

export default {
  users: (state={}, action) => {
    
    
    log('.R. ' + action.type); // keep this line in the first reducer
    
    return state;
  },
  
  
  lastAction: (state={}, action) => action,
  records: (state=[], action) => [...state, Object.assign({ date: new Date().getTime() }, action)],
};

function deepCopy(a) {
  if (typeof a === 'object') {
    if (a === null) return null;
    else if (a instanceof Date) return new Date(a);
    else if (a instanceof RegExp) return new RegExp(a);
    else if (Array.isArray(a)) return a.map(i => deepCopy(i));
    else {
      const b = {};
      for (let k in a) {
        if (a.hasOwnProperty(k)) {
          b[k] = deepCopy(a[k]);
        }
      }
      return b;
    }
  } 
  else return a;
}
