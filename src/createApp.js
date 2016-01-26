import routes from './routes';
import log from './utils/logger';
import isServer from './utils/isServer';
import reducers from './state/reducers';
import promiseMiddleware from './state/promiseMiddleware';

import React from 'react';
import { Provider } from 'react-redux';
import { syncHistory, routeReducer } from 'redux-simple-router';
import { createStore, combineReducers, applyMiddleware } from 'redux';
import { Router, browserHistory, createMemoryHistory } from 'react-router';

export default function createApp(initialState) {
  
  log('... Initializing UI and store');
  
  const history = isServer ? createMemoryHistory() : browserHistory;
  
  const routerMiddleware = syncHistory(history);
  
  const middlewares = isServer ? 
    applyMiddleware(routerMiddleware, promiseMiddleware) :
    applyMiddleware(routerMiddleware, promiseMiddleware/*, websocketMiddleware*/);
  
  const reducer = combineReducers(Object.assign({}, reducers, {
    routing: routeReducer
  }));
  
  const store = middlewares(createStore)(reducer, initialState);
  
  // Enables Webpack hot module replacement for reducers
  if (module.hot) module.hot.accept('./state/reducers.js', () => store.replaceReducer(require('./state/reducers.js')));
  
  const userInterface = (
    <Provider store={store}>
      <Router history={history} routes={routes} />
    </Provider>
  );
  
  return { store, userInterface, history };
}
