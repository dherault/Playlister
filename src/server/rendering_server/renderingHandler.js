import fs from 'fs';
import { renderToString } from 'react-dom/server';
import { match, RouterContext } from 'react-router';

import phidippides from './phidippides';
import config from '../../config';
import routes from '../../shared/routes';
import createApp from '../../shared/createApp';
import logg, { logError } from '../../shared/utils/logger';

const log = (...x) => logg('RND', ...x);
const html = fs.readFileSync('./src/server/public/index.html', 'utf8')
  .replace('</body>', `<script src="${config.services.webpack.url}bundle.js"></script></body>`);


export default function handleRendering(request, reply) {
  
  const response = reply.response().hold();
  const handle500 = (msg, err) => {
    logError(msg, err);
    response.statusCode = 500;
    response.send();
  };
  
  // const params = method === 'post' || method === 'put' ? request.payload : request.query;
  // log('RND', 'Get', request.path, request.info.remoteAddress);
  // log('RND', 'state', request.state.token);
  log('RND', 'Auth:', request.auth.isAuthenticated);
  
  
  match({ routes, location: request.url.path }, (err, redirectLocation, renderProps) => {
    if (err) {
      handle500('Route matching', err);
    } else if (redirectLocation) {
      const url = redirectLocation.pathname + redirectLocation.search;
      log('Redirecting to', url);
      return response.redirect(url);
      
    } else if (renderProps) {
      // You can also check renderProps.components or renderProps.routes for
      // your "not found" component or route respectively, and send a 404 as
      // below, if you're using a catch-all route.
      // response.status(200).send(renderToString(<RouterContext {...renderProps} />))
      const initialState = {};
      const { store, userInterface } = createApp(initialState, renderProps);
      
      log('Entering Phidippides');
      phidippides(renderProps, store.dispatch).then(() => {
        log('Exiting Phidippides');
        
        const mountMeImFamous = renderToString(userInterface);
        const serverState = store.getState();
        
        // serverState trimming to save brandwith
        ['records'].forEach(key => delete serverState[key]);
        Object.keys(serverState).forEach(key => {
          if (!Object.keys(serverState[key]).length) delete serverState[key];
        });
        
        response.source = html.replace('<body>', `<body><div id="mountNode">${mountMeImFamous}</div>` +
          `<script>window.STATE_FROM_SERVER=${JSON.stringify(serverState)}</script>`);
        response.send(); // Bon voyage
        
      }).catch(err => handle500('Phidippides', err));
    }
  });
  
  
}
