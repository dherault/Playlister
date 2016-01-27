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
    
    return <div>
      <Link to="/">Landing Page</Link>
      <div>
        { this.props.user }
      </div>
      <Paper>Playlists
      </Paper>
    </div>;
  }
}

export default connect(s => ({ user: s.user }))(UserProfile);
