import React from 'react';
import { Link } from 'react-router';
import { connect } from 'react-redux';

import ac from '../state/actionCreators';

class LandingPage extends React.Component {
  
  constructor() {
    super();
    this.state = { 
      step: 'start' ,
      email: 'admin',
      password: 'password',
    };
  }
  
  componentWillReceiveProps(nextprops) {
    if (nextprops.lastAction.type === 'FAILURE_LOGIN' && this.state.step !== 'email') this.setState({ step: 'email' });
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
    
    if (this.state.step === 'email' && this.state.password.length >= 8) {
      this.setState({ step: 'submit' });
      const { email, password } = this.state;
      this.props.dispatch(ac.login({ email, password }));
    }
  }
  
  render() {
    
    const wrapperStyle = {
      width: '90%',
      margin: 'auto',
      minHeight: '100%',
      fontSize: '1.3rem',
    };
    const signStyle = {
      margin: '40px 0 40px 0',
    };
    const buttonsStyle = {
      display: this.state.step === 'start' ? 'inline-block' : 'none',
    };
    const buttonStyle = {
      marginRight: 20,
    };
    const inputsStyle = {
      display: this.state.step === 'email'? 'block' : 'none',
    };
    
    return <div style={wrapperStyle}>
      
      <div>
          <Link to='/test'>Test page</Link>  -&nbsp;
          <a href="https://github.com/dherault/Playlister" target="_blank">
            Github
          </a>
      </div>
      
      <div style={signStyle}>
        <div> Sign in/up with  </div>
        
        <div style={buttonsStyle}>
          <button style={buttonStyle} onClick={this.handleMailClick.bind(this)}>Mail</button>
          <button style={buttonStyle}>Facebook</button>
          <button style={buttonStyle}>Google</button>
        </div>
        
        <div style={inputsStyle}>
          <input 
            ref="mailInput"
            type="text"
            placeholder="abc@mail.com" 
            value={this.state.email}
            onChange={this.handleEmailInputChange.bind(this)}
          />
        
          <input 
            ref="passwordInput"
            type="password"
            placeholder="Min. 8 characters" 
            value={this.state.password}
            onChange={this.handlePasswordInputChange.bind(this)}
            onEnterKeyDown={this.handleFormSubmit.bind(this)}
          />
        
          <button disabled={this.state.password.length < 8} onClick={this.handleFormSubmit.bind(this)}>Enter</button>
        </div>
      </div>
        
    </div>;
  }
}

export default connect(s => ({ lastAction: s.lastAction }))(LandingPage);
