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
  
  // Server-side data fetching
  static runPhidippides(renderProps) {
    return [{
      id: 'userPageUser',
      dependencyId: 'appUser', // If this task fetches the user then no need to do it twice
      notFoundTriggers404: true,
      actionCreator: ac.readUserByUsername,
      getParams: ({ users }) => {
        const username = renderProps.params.username;
        for (let key in users) {
          if (users[key].username === username) return false; // a falsy return skips the task
        }
        return { username };
      },
    }];
  }
  
  componentDidMount() {
    // Client-side data fetching
    if (!this.findUser()) this.props.dispatch(ac.readUserByUsername({ username: this.props.routeParams.username }));
  }
  
  componentWillReceiveProps(nextProps) {
    // Client-side data fetching triggered by transitionning from one profile to another
    const nextUsername = nextProps.routeParams.username;
    if (this.props.routeParams.username !== nextUsername && !this.findUser(nextUsername)) {
      this.props.dispatch(ac.readUserByUsername({ username: nextUsername }));
    }
  }
  
  findUser(username = this.props.routeParams.username) {
    const { users } = this.props;
    for (let key in users) {
      if (users[key].username === username) return users[key];
    }
  }
  
  render() {
    const user = this.findUser();
    
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
