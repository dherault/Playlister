import React from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router';
import ac from '../state/actionCreators';
import { randomInteger, randomString } from '../utils/randomUtils';

class TestPage extends React.Component {
  
  constructor() {
    super();
    
    this.state = {
      readAllSelectValue: 'users',
      createUserEmail: randomString(randomInteger(1, 6)) + '@' + randomString(randomInteger(1, 6)) + '.com',
      createUserPassword: '12345678',
    };
  }
  
  handleReadAllSelection(e) {
    this.setState({ readAllSelectValue: e.target.value });
  }
  
  handleReadAllClick() {
    this.props.dispatch(ac.readAll({ collection: this.state.readAllSelectValue }));
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
        <h2>createUser</h2>
        <input type="text" value={state.createUserEmail} onChange={this.handleCreateUserEmailInput.bind(this)} />
        <input type="text" value={state.createUserPassword} onChange={this.handleCreateUserPasswordInput.bind(this)} />
        <button onClick={this.handleCreateUserClick.bind(this)}>createUser</button>
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
