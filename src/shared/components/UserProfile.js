import React from 'react';
import { Link } from 'react-router';
import { connect } from 'react-redux';
import Paper from 'material-ui/lib/paper';
// import TextField from 'material-ui/lib/text-field';
// import RaisedButton from 'material-ui/lib/raised-button';
// import CircularProgress from 'material-ui/lib/circular-progress';

// import FontIcon from 'material-ui/lib/font-icon';
// import IconButton from 'material-ui/lib/icon-button';
// import Colors from 'material-ui/lib/styles/colors';
// import BookmarkIcon from 'material-ui/lib/svg-icons/action/bookmark';

class UserProfile extends React.Component {
  
  constructor() {
    super();
    this.state = { 
    };
  }
  
  render() {
    
    const { users, routeParams: { username } } = this.props;
    
    const user = users[Object.keys(users).find(key => users[key].username === username)];
    if (!user) throw new Error('no user found in store!');
    
    const wrapperStyle = {
      width: '80%',
      margin: 'auto',
    };
    
    const profileStyle = {
      textAlign: 'center',
    };
    
    return <div style={wrapperStyle}>
      <Link to="/test">Test Page</Link>&nbsp;
      <Link to="/">Landing Page</Link>&nbsp;
      <div style={profileStyle}>
        <div>{ user._id }</div>
        <div>{ user.username }</div>
        <img src={user.imageUrl} style={{borderRadius:100}}/>
      </div>
      <Paper>Playlists
      </Paper>
    </div>;
  }
}

export default connect(s => ({ users: s.users, routing: s.routing }))(UserProfile);
