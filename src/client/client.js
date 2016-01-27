import React from 'react';
import ReactDOM from 'react-dom';
import injectTapEventPlugin from 'react-tap-event-plugin';

import createApp from '../createApp';
import registerSideEffects from './sideEffects';
import registerShortcuts from './shortcuts';
import registerWebsocket from './websocket';

console.log('hi!');

// Needed for onTouchTap
// Can go away when react 1.0 release
// Check this repo:
// https://github.com/zilverline/react-tap-event-plugin
injectTapEventPlugin();

const { store, userInterface } = createApp(window.STATE_FROM_SERVER || {});

ReactDOM.render(
  userInterface,
  document.getElementById('mount-node'),
  () => console.log('App rendered.')
);

registerSideEffects(store);
registerWebsocket(store);
registerShortcuts(store);

require('./stylesheets/app.css');
