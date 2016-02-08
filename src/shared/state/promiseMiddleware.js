import isServer from '../utils/isServer';
import { logError, logFetch } from '../utils/logger';

export default function promiseMiddleware({ dispatch, getState }) {
  
  return next => action => {
    const { intention, types, params, promise } = action;
    
    if (!promise) return next(action);
    
    const [REQUEST, SUCCESS, FAILURE, INVALID] = types;
    next({ intention, params, type: REQUEST });
    
    promise
    .then(payload => {
      if (!isServer) logFetch(`<-- ${intention}`, payload);
      next({ intention, params, payload, type: SUCCESS });
    })
    .catch(payload => { // Payload is the (failed) response object or validation Error or fetch Error
      logError(`Action ${intention} error:`, payload.statusText || payload);
      next({ intention, params, payload, type: payload instanceof Error && payload.name === 'ValidationError' ? INVALID : FAILURE });
    });
  };
}
