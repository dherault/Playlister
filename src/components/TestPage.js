import React from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router';
import ac from '../state/actionCreators';
import { randomInteger, randomString, randomEmail } from '../utils/randomUtils';

class TestPage extends React.Component {
  
  constructor() {
    super();
    
    this.state = {
      readAllSelectValue: 'users',
      createUserEmail: randomEmail(),
      createUserPassword: '12345678',
      readOneId: '',
      readOneModel: 'User',
    };
  }
  handleReadAllSelection(e) {
    this.setState({ readAllSelectValue: e.target.value });
  }
  
  handleReadAllClick() {
    this.props.dispatch(ac.readAll({ collection: this.state.readAllSelectValue }));
  }
  
  handleReadOneSelection(e) {
    this.setState({ readOneModel: e.target.value });
  }
  
  handleReadOneInput(e) {
    this.setState({ readOneId: e.target.value });
  }
  
  handleReadOneClick() {
    this.props.dispatch(ac['read' + this.state.readOneModel]({ id: this.state.readOneId }));
  }
  
  handleCreateUserEmailInput(e) {
    this.setState({ createUserEmail: e.target.value });
  }
  
  handleCreateUserPasswordInput(e) {
    this.setState({ createUserPassword: e.target.value });
  }
  
  handleCreateUserClick() {
    this.props.dispatch(ac.createUser({ 
      email: this.state.createUserEmail,
      password: this.state.createUserPassword
    }));
  }
  
  handleCreateUserRandom() {
    this.setState({ createUserEmail: randomEmail() });
  }
  
  
  render() {
    
    const { state, props } = this;
    const wrapperStyle = {
      width: '80%',
      margin: 'auto',
    };
    
    return <div style={wrapperStyle}>
      <h1>Test Page</h1>
      <div>It's time to manually test stuff!</div>
      <Link to='/'>Home</Link>
      
      <section>
        <h2>readAll</h2>
        <select value={state.readAllSelectValue} onChange={this.handleReadAllSelection.bind(this)}>
          <option value="users">users</option>
          <option value="nothinggood">nothing good</option>
        </select>
        <button onClick={this.handleReadAllClick.bind(this)}>readAll</button>
      </section>
      
      <section>
        <h2>readOne</h2>
        <select value={state.readOneModel} onChange={this.handleReadOneSelection.bind(this)}>
          <option value="User">User</option>
          <option value="nothinggood">nothing good</option>
        </select>
        <input type="text" value={state.readOneId} onChange={this.handleReadOneInput.bind(this)} />
        <button onClick={this.handleReadOneClick.bind(this)}>{ 'read' + this.state.readOneModel }</button>
      </section>
      
      <section>
        <h2>createUser</h2>
        <input type="text" value={state.createUserEmail} onChange={this.handleCreateUserEmailInput.bind(this)} />
        <input type="text" value={state.createUserPassword} onChange={this.handleCreateUserPasswordInput.bind(this)} />
        <button onClick={this.handleCreateUserClick.bind(this)}>createUser</button>
        <button onClick={this.handleCreateUserRandom.bind(this)}>ʘ</button>
      </section>
      
      <section>
        <h2>Records</h2>
        <ol>
          { props.records.map((record, i) => {
            const { type, payload, params } = record;
            return <li key={i}>
              <strong>{ type }</strong>
              &nbsp;- { JSON.stringify(params) }
              &nbsp;- { JSON.stringify(payload) }
            </li>;
          }) }
        </ol>
      </section>
      
      
    </div>;
  }
}

export default connect(s => ({ records: s.records }))(TestPage);
