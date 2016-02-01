import React from 'react';
import ReactDOM from 'react-dom';

import createApp from '../shared/createApp';
import registerSideEffects from './registerSideEffects';
import registerShortcuts from './registerShortcuts';
import registerWebsocket from './registerWebsocket';

console.log('Hello client!');

// App creation
const { store, userInterface } = createApp(window.STATE_FROM_SERVER || {});

// User interface rendering
ReactDOM.render(
  userInterface,
  document.getElementById('mountNode'),
  () => console.log('App rendered.')
);

// Let's give the store instance to whatever needs it
const websocketSideEffects = registerWebsocket(store); // Websocket-related logic init
registerSideEffects(store, websocketSideEffects); // Side effects init
registerShortcuts(store); // Keyboard shortcuts init

// Some side effects want to know when the app is green
// store.dispatch({ type: 'APP_BOOT' });

require('./stylesheets/app.css');
