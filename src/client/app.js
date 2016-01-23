import React from 'react';
import ReactDOM from 'react-dom';

import injectTapEventPlugin from 'react-tap-event-plugin';

import App from '../components/App';

// Needed for onTouchTap
// Can go away when react 1.0 release
// Check this repo:
// https://github.com/zilverline/react-tap-event-plugin
injectTapEventPlugin();

console.log('hi!');

ReactDOM.render(
  <App />,
  document.getElementById('mount-node'),
  () => console.log('App rendered.')
);
// document.body.style.color = 'blue';

require('./stylesheets/app.css');
