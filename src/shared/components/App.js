import React from 'react';
import ac from '../state/actionCreators';
// import { Link } from 'react-router';

class App extends React.Component {
  
  static runPhidippides(renderProps, sessionUserId) {
    if (sessionUserId) return [{
      id: 'sessionUser',
      actionCreator: ac.readUser,
      getParams: () => ({ id: sessionUserId })
    }];
  }
  
  render() {
    
    return this.props.children;
  }
}

// export default connect(s => ({ records: s.records }))(App);
export default App;
