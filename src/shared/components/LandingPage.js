import React from 'react';
import { Link } from 'react-router';
import { connect } from 'react-redux';

import ac from '../state/actionCreators';
import config from '../../config';

const { minPasswordLength } = config.validations;

class LandingPage extends React.Component {
  
  constructor() {
    super();
    this.state = { 
      step: 'start' ,
      email: 'admin',
      password: 'password',
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
    
    if (this.state.step === 'email' && this.state.password.length >= minPasswordLength) {
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
      
      <div style={signStyle}>
        <div>Sign in/up with</div>
        
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
            placeholder={`Min. ${minPasswordLength} characters`}
            value={this.state.password}
            onChange={this.handlePasswordInputChange.bind(this)}
            onEnterKeyDown={this.handleFormSubmit.bind(this)}
          />
        
          <button disabled={this.state.password.length < minPasswordLength} onClick={this.handleFormSubmit.bind(this)}>Enter</button>
        </div>
      </div>
        
    </div>;
  }
}

export default connect(s => ({ lastAction: s.lastAction }))(LandingPage);
