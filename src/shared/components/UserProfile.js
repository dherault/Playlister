import React from 'react';
import { Link } from 'react-router';
import { connect } from 'react-redux';

import NotFound from './NotFound';
import LoadingSpinner from './LoadingSpinner';
import ac from '../state/actionCreators';

class UserProfile extends React.Component {
  
  // constructor() {
  //   super();
  //   this.state = { 
  //   };
  // }
  
  static runPhidippides(renderProps) {
    return [{
      id: 'userProfile',
      notFoundTriggers404: true,
      actionCreator: ac.readUserByUsername,
      getParams: () => ({ username: renderProps.params.username }),
    }];
  }
  
  componentDidMount() {
    // Client-side data fetching
    const { username } = this.props.routeParams;
    if (!this.getUser(username)) {
      this.props.dispatch(ac.readUserByUsername({ username }));
    }
  }
  
  componentWillReceiveProps(nextProps) {
    // Client-side data fetching triggered by transitionning from one profile to another
    const nextUsername = nextProps.routeParams.username;
    if (this.props.routeParams.username !== nextUsername && !this.getUser(nextUsername)) {
      this.props.dispatch(ac.readUserByUsername({ username: nextUsername }));
    }
  }
  
  getUser(username) {
    const { users } = this.props;
    return users[Object.keys(users).find(key => users[key].username === username)];
  }
  
  render() {
    const user = this.getUser(this.props.routeParams.username);
    
    // if (!user) throw new Error('no user found in store!');
    // if (true) throw new Error('yolo');
    
    const wrapperStyle = {
      width: '80%',
      margin: 'auto',
    };
    
    const profileStyle = {
      textAlign: 'center',
    };
    
    return !user ? <LoadingSpinner /> : user.notFound ? <NotFound /> : <div style={wrapperStyle}>
      <div style={profileStyle}>
        <div>{ user.id }</div>
        <div>{ user.username }</div>
        <img src={user.imageUrl} style={{borderRadius:100}}/>
      </div>
      <div>Playlists
      </div>
    </div>;
  }
}

export default connect(s => ({ users: s.users }))(UserProfile);
