import React from 'react';
import ReactDOM from 'react-dom';
import injectTapEventPlugin from 'react-tap-event-plugin';

import createApp from '../shared/createApp';
import registerSideEffects from './registerSideEffects';
import registerShortcuts from './registerShortcuts';
import registerWebsocket from './registerWebsocket';

console.log('Hi!');

// Needed for onTouchTap
// Can go away when react 1.0 release
// Check this repo:
// https://github.com/zilverline/react-tap-event-plugin
injectTapEventPlugin();

const { store, userInterface } = createApp(window.STATE_FROM_SERVER || {});

ReactDOM.render(
  userInterface,
  document.getElementById('mountNode'),
  () => console.log('App rendered.')
);

const websocketSideEffects = registerWebsocket(store);
registerSideEffects(store, websocketSideEffects);
registerShortcuts(store);

require('./stylesheets/app.css');
