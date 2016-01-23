import React from 'react';
import ReactDOM from 'react-dom';
import RaisedButton from 'material-ui/lib/raised-button';
import Paper from 'material-ui/lib/paper';
import FontIcon from 'material-ui/lib/font-icon';
import IconButton from 'material-ui/lib/icon-button';
import Colors from 'material-ui/lib/styles/colors';
import TextField from 'material-ui/lib/text-field';
import CircularProgress from 'material-ui/lib/circular-progress';

import BookmarkIcon from 'material-ui/lib/svg-icons/action/bookmark';

// import { Link } from 'react-router';

class LandingPage extends React.Component {
  
  constructor() {
    super();
    this.state = { 
      step: 'start' ,
      email: '',
      password: '',
    };
  }
  
  handleMailClick() {
    this.setState({ step: 'email' }, () => {
      this.refs.mailInput.focus();
    });
  }
  
  handleEmailInputChange(e) {
    this.setState({ email: e.target.value });
  }
  
  handlePasswordInputChange(e) {
    this.setState({ password: e.target.value });
  }
  
  handleFormSubmit(e) {
    
    console.log('submit');
    e.preventDefault();
    
    if (this.state.step === 'email') {
      this.setState({ step: 'password' }, () => {
        this.refs.passwordInput.focus();
      });
    }
    
    else if (this.state.step === 'password' && this.state.password.length >= 8) {
      this.setState({ step: 'submit' });
    }
  }
  
  render() {
    
    const wrapperStyle = {
      width: '90%',
      margin: 'auto',
      minHeight: '100%',
      // position: 'relative',
    };
    
    const footerStyle = {
    	width: '100%',
    	height: 30,
    	position: 'absolute',
    	bottom: 0,
    	left: 0,
    // 	paddingTop: 5,
    // 	paddingBottom: 5,
      textAlign: 'center',
    };
    
    const paperStyle = {
      minHeight: 200,
      width: '100%',
      marginTop: '27%',
      // margin: '0 20px 0 20px',
      textAlign: 'center',
      display: 'inline-block',
    };
    
    const headStyle = {
      fontSize: '4.236rem',
      margin: '40px 0 40px 0',
    };
    const leadStyle = {
      fontWeight: 500,
      margin: '40px 120px 40px 120px',
      fontSize: '2.618rem',
    };
    
    const signStyle = {
      margin: '40px 0 40px 0',
    };
    const signCaptionStyle = {
      fontSize: '1.618rem',
      marginRight: 20,
      display: this.state.step === 'start' || this.state.step === 'email' ? 'inline-block' : 'none',
      overflow: 'hidden',
    };
    
    const buttonsStyle = {
      display: this.state.step === 'start' ? 'inline-block' : 'none',
    };
    const buttonStyle = {
      marginRight: 20,
    };
    const fbStyle = {
      background: '#3B5998', // bug ?
    };
    
    const emailStyle = {
      display: this.state.step === 'email' || this.state.step === 'password' ? 'inline-block' : 'none',
    };
    
    const passwordStyle = {
      display: this.state.step === 'password' ? 'inline-block' : 'none',
      margin: '0 20px 0 20px'
    };
    
    const emailInputStyle = {
      fontSize: '1.618rem',
    };
    
    const passwordInputStyle = {
      fontSize: '1.618rem',
    };
    
    const submitButtonStyle = {
      display: this.state.step === 'password' ? 'inline-block' : 'none',
    };
    
    const spinnerStyle = {
      display: this.state.step === 'submit' ? 'inline-block' : 'none',
      marginBottom: 40,
    };
    
    return <div style={wrapperStyle}>
      
      <div className="row">
        <div className="col-xs-12 col-md-6">
          <div className="box">
          </div>
        </div>
        <div className="col-xs-12 col-md-6">
          <div className="box">
          
            <Paper style={paperStyle} zDepth={1}>
            
              <div style={headStyle}>
                Playlister
              </div>
              <div style={leadStyle}>
                Combine any media into a simple and elegant playlist
              </div>
              
              <div style={signStyle}>
                <span style={signCaptionStyle}> Sign in/up with  </span>
                
                <div style={buttonsStyle}>
                  <RaisedButton style={buttonStyle} label="Mail" onClick={this.handleMailClick.bind(this)}/>
                  <RaisedButton style={Object.assign({}, buttonStyle, fbStyle)} label="Facebook" />
                  <RaisedButton style={buttonStyle} label="Google" />
                </div>
                
                <div style={emailStyle}>
                  <TextField 
                    ref="mailInput"
                    fullWidth={true} 
                    hintText="abc@mail.com" 
                    inputStyle={emailInputStyle} 
                    value={this.state.email}
                    onChange={this.handleEmailInputChange.bind(this)}
                    onEnterKeyDown={this.handleFormSubmit.bind(this)}
                  />
                </div>
                
                <div style={passwordStyle}>
                  <TextField 
                    ref="passwordInput"
                    type="password"
                    fullWidth={true} 
                    hintText="Min. 8 characters" 
                    floatingLabelText="Enter password"
                    inputStyle={passwordInputStyle} 
                    value={this.state.password}
                    onChange={this.handlePasswordInputChange.bind(this)}
                    onEnterKeyDown={this.handleFormSubmit.bind(this)}
                  />
                </div>
                
                <RaisedButton 
                  style={submitButtonStyle} 
                  label="Enter" 
                  disabled={this.state.password.length < 8}
                />
                
              </div>
              
              <CircularProgress mode="indeterminate" style={spinnerStyle}/>
              
            </Paper>
          </div>
        </div>
      </div>
      
      <div style={footerStyle}>
          Copyright 2016 David Hérault -&nbsp;
          <a href="https://github.com/dherault/Playlister" target="_blank">
            Github
          </a>
      </div>
      
    </div>;
  }
}

// export default connect(s => ({ records: s.records }))(App);
export default LandingPage;
