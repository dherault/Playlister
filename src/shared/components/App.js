import React from 'react';
import ac from '../state/actionCreators';
import DevMenu from './DevMenu';

class App extends React.Component {
  
  static runPhidippides(renderProps, sessionUserId) {
    return [{
      id: 'appUser',
      actionCreator: ac.readUser,
      getParams: () => sessionUserId ? ({ id: sessionUserId }) : false, // returning a falsy value skip the invocation but completes the task
    }];
  }
  
  render() {
    
    return <div>
      <DevMenu />
      { this.props.children }
    </div>;
  }
}

// export default connect(s => ({ records: s.records }))(App);
export default App;
