import React from 'react';
// import { Link } from 'react-router';

class App extends React.Component {
  
  render() {
    
    return this.props.children;
  }
}

// export default connect(s => ({ records: s.records }))(App);
export default App;
