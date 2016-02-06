import React from 'react';
import ac from '../state/actionCreators';
import DevMenu from './DevMenu';

class App extends React.Component {
  
  static runPhidippides(renderProps, sessionUserId) {
    if (sessionUserId) return [{
      id: 'sessionUser',
      actionCreator: ac.readUser,
      getParams: () => ({ id: sessionUserId })
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
