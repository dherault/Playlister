import React from 'react';
import { Route, IndexRoute } from 'react-router';

import App from './components/App';
import LandingPage from './components/LandingPage';
import TestPage from './components/TestPage';
import UserPage from './components/UserPage';
import NotFound from './components/NotFound';

export default (
  
  <Route path="/" component={App}>
    <IndexRoute component={LandingPage}/>
    <Route path="test" component={TestPage} />
    <Route path="@:username" component={UserPage} />
    <Route path="*" component={NotFound} />
  </Route>
  
);
