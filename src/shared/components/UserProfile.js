import React from 'react';
import { Link } from 'react-router';
import { connect } from 'react-redux';

import NotFound from './NotFound';
import ac from '../state/actionCreators';

class UserProfile extends React.Component {
  
  constructor() {
    super();
    this.state = { 
    };
  }
  
  static runPhidippides(renderProps) {
    return [{
      id: 'userProfile',
      notFoundTriggers404: true,
      actionCreator: ac.readUserByUsername,
      getParams: () => ({ username: renderProps.params.username }),
    }];
  }
  
  render() {
    const { users, routeParams: { username } } = this.props;
    
    const user = users[Object.keys(users).find(key => users[key].username === username)];
    // if (!user) throw new Error('no user found in store!');
    // if (true) throw new Error('yolo');
    
    const wrapperStyle = {
      width: '80%',
      margin: 'auto',
    };
    
    const profileStyle = {
      textAlign: 'center',
    };
    
    // This is not enough
    return !user ? <NotFound /> : <div style={wrapperStyle}>
      <Link to="/test">Test Page</Link>&nbsp;
      <Link to="/">Landing Page</Link>&nbsp;
      <div style={profileStyle}>
        <div>{ user._id }</div>
        <div>{ user.username }</div>
        <img src={user.imageUrl} style={{borderRadius:100}}/>
      </div>
      <div>Playlists
      </div>
    </div>;
  }
}

export default connect(s => ({ users: s.users }))(UserProfile);
