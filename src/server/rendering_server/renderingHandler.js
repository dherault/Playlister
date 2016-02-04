import fs from 'fs';
import { renderToString } from 'react-dom/server';
import { match, RouterContext } from 'react-router';

import phidippides from './phidippides';
import config from '../../config';
import routes from '../../shared/routes';
import createApp from '../../shared/createApp';
import logg, { logError } from '../../shared/utils/logger';
import { createSession } from '../utils/authUtils';

const log = (...x) => logg('RND', ...x);
const html = fs.readFileSync('./src/server/public/index.html', 'utf8')
  .replace('</body>', `<script src="${config.services.webpack.url}bundle.js"></script></body>`);


export default function handleRendering(request, reply) {
  
  const response = reply.response().hold();
  
  const handle500 = (msg, err) => {
    response.statusCode = 500;
    response.source = 'Internal server error.';
    response.send();
    logError(msg, err);
    log('Replied 500');
  };
  
  let userId; // The authenticated user id
  const initialState = {};
  
  if (request.auth.isAuthenticated) {
    // Session renewal
    userId = request.auth.credentials.id;
    log('Auth:', userId);
    const token = createSession(userId);
    response.state("token", token);
    initialState.session = { userId, token };
  }
  
  
  match({ routes, location: request.url.path }, (err, redirectLocation, renderProps) => {
    if (err) {
      return handle500('Route matching', err);
      
    } else if (redirectLocation) {
      const url = redirectLocation.pathname + redirectLocation.search;
      log('Redirecting to', url);
      return response.redirect(url);
      
    } else if (renderProps) {
      
      
      const { store, userInterface } = createApp(initialState, renderProps);
      
      log('Entering Phidippides');
      phidippides(store, renderProps, userId).then(shouldReply404 => {
        log('Exiting Phidippides');
        
        // Let's add the 404 code if unmatched or Phidippides said so
        if (renderProps.routes.some(route => route.component.name === 'NotFound') || shouldReply404) response.statusCode = 404;
        // Rendering can throw, let's try it
        try {
          var mountMeImFamous = renderToString(userInterface);
        }
        catch (err) {
          return handle500('renderToString', err);
        }
        
        // Phidippides took charge of populating the state
        const serverState = store.getState();
        
        // serverState trimming to save brandwith
        ['records'].forEach(key => delete serverState[key]); // Goodbye useless keys
        // for (let key in serverState) {
        //   if (!Object.keys(serverState[key]).length) delete serverState[key]; // Goodbye empty keys
        // }
        
        
        response.source = html.replace('<body>', `<body><div id="mountNode">${mountMeImFamous}</div>` +
          `<script>window.STATE_FROM_SERVER=${JSON.stringify(serverState)}</script>`);
        response.send(); // Bon voyage
        log('Response sent');
        
      }, err => handle500('Phidippides', err)); // Don't 'catch', double catch means troubles
    }
  });
}
