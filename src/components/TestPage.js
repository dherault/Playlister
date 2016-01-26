import React from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router';

import ac from '../state/actionCreators';
import definitions from '../models/definitions';
import { capitalizeFirstChar } from '../utils/textUtils';
import { randomInteger, randomString, randomEmail } from '../utils/randomUtils';

const cfc = capitalizeFirstChar;

class TestPage extends React.Component {
  
  constructor() {
    super();
    
    this.state = {
      recordsOffset: 0,
      model: 'user',
      readOneId: '',
      updateOneId: '',
      updateOneKey: '',
      updateOneValue: '',
      deleteOneId: '',
      createUserEmail: randomEmail(),
      createUserPassword: '12345678',
    };
  }
  
  handleClear() {
    this.setState({ recordsOffset: this.props.records.length });
  }
  
  handleModelSelection(e) {
    this.setState({ model: e.target.value });
  }
  
  // READ ALL
  handleReadAllClick() {
    this.props.dispatch(ac.readAll({ collection: definitions[this.state.model].pluralName }));
  }
  
  // READ ONE
  handleReadOneInput(e) {
    this.setState({ readOneId: e.target.value });
  }
  
  handleReadOneClick() {
    this.props.dispatch(ac['read' + cfc(this.state.model)]({ id: this.state.readOneId }));
  }
  
  // UPDATE ONE
  handleUpdateOneInput(k, e) {
    this.setState({ [k]: e.target.value });
  }
  
  handleUpdateOneClick() {
    this.props.dispatch(ac['update' + cfc(this.state.model)]({ 
      id: this.state.updateOneId,
      [this.state.updateOneKey]: this.state.updateOneValue
    }));
  }
  
  // DELETE ONE
  handleDeleteOneInput(e) {
    this.setState({ deleteOneId: e.target.value });
  }
  
  handleDeleteOneClick() {
    this.props.dispatch(ac['delete' + cfc(this.state.model)]({ id: this.state.deleteOneId }));
  }
  
  // CREATE USER
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
    const m = cfc(state.model);
    const wrapperStyle = {
      width: '80%',
      margin: 'auto',
    };
    
    return <div style={wrapperStyle} className="section group">
      
      <div className="col span_6_of_12">
      
        <h1>Test Page</h1>
        <div>It's time to manually test stuff!</div>
        <Link to='/'>Home</Link>
        &nbsp;- <a href="https://github.com/dherault/Playlister" target="_blank">Github</a>
        
        <div>
          <span>Current model: </span>
          <select value={state.model} onChange={this.handleModelSelection.bind(this)}>
            {
              Object.keys(definitions).map(key => <option key={key} value={key}>{ cfc(key) }</option>)
            }
          </select>
        </div>
        
        <section>
          <h2>readAll</h2>
          <button onClick={this.handleReadAllClick.bind(this)}>readAll</button>
        </section>
        
        <section>
          <h2>readOne</h2>
          <input type="text" value={state.readOneId} onChange={this.handleReadOneInput.bind(this)} placeholder="id"/>
          <button onClick={this.handleReadOneClick.bind(this)}>{ 'read' + m }</button>
        </section>
        
        <section>
          <h2>updateOne</h2>
          <input 
            type="text" 
            placeholder="id"
            value={state.updateOneId} 
            onChange={this.handleUpdateOneInput.bind(this, 'updateOneId')} />
          <input 
            type="text" 
            placeholder="key"
            value={state.updateOneKey} 
            onChange={this.handleUpdateOneInput.bind(this, 'updateOneKey')} />
          <input 
            type="text" 
            placeholder="value"
            value={state.updateOneValue} 
            onChange={this.handleUpdateOneInput.bind(this, 'updateOneValue')} />
          <button onClick={this.handleUpdateOneClick.bind(this)}>{ 'update' + m }</button>
        </section>
        
        <section>
          <h2>deleteOne</h2>
          <input type="text" value={state.deleteOneId} onChange={this.handleDeleteOneInput.bind(this)} placeholder="id"/>
          <button onClick={this.handleDeleteOneClick.bind(this)}>{ 'delete' + m }</button>
        </section>
        
        <section>
          <h2>createUser</h2>
          <input type="text" value={state.createUserEmail} onChange={this.handleCreateUserEmailInput.bind(this)} />
          <input type="text" value={state.createUserPassword} onChange={this.handleCreateUserPasswordInput.bind(this)} />
          <button onClick={this.handleCreateUserClick.bind(this)}>createUser</button>
          <button onClick={this.handleCreateUserRandom.bind(this)}>ʘ</button>
        </section>
        
      </div>
      
      
      <div className="col span_6_of_12">
      
        <h2 style={{display: 'inline-block'}}>Records</h2>&nbsp;&nbsp;
        <button onClick={this.handleClear.bind(this)}>Clear</button>
        <ol start={state.recordsOffset}>
        { 
          props.records.map((record, i) => {
            if (i < state.recordsOffset) return;
            
            const { type, payload, params } = record;
            return <li key={i}>
              <strong>{ type }</strong>
              &nbsp;- { JSON.stringify(params) }
              &nbsp;- { JSON.stringify(payload) }
            </li>;
          })
        }
        </ol>
        
      </div>
      
    </div>;
  }
}

export default connect(s => ({ records: s.records }))(TestPage);
