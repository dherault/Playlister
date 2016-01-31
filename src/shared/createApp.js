import React from 'react';
import { Provider } from 'react-redux';
import { syncHistory, routeReducer } from 'react-router-redux';
import { Router, RouterContext, browserHistory } from 'react-router';
import { createStore, combineReducers, applyMiddleware } from 'redux';
// RouterContext gets imported to client for now;

import routes from './routes';
import log from './utils/logger';
import isServer from './utils/isServer';
import reducers from './state/reducers';
import promiseMiddleware from './state/promiseMiddleware';
// import sideEffects from '../../client/sideEffects';

export default function createApp(initialState, renderProps={}) {
  
  log('... Initializing UI and store');
  
  let enhance, reducer, router;
  
  if (isServer) {
    enhance = applyMiddleware(promiseMiddleware);
    reducer = combineReducers(reducers);
    router = <RouterContext {...renderProps} />;
    
  } else {
    const history = browserHistory;
    const routerMiddleware = syncHistory(history);
    enhance = applyMiddleware(routerMiddleware, promiseMiddleware);
    reducer = combineReducers(Object.assign({}, reducers, { routing: routeReducer }));
    router = <Router history={history} routes={routes} />;
    
    // Enables Webpack hot module replacement for reducers
    if (module.hot) module.hot.accept('./state/reducers.js', () => store.replaceReducer(require('./state/reducers.js')));
  }
  
  const store = enhance(createStore)(reducer, initialState);
  
  return {
    store,
    userInterface: <Provider store={store} children={router} />
  };
}
