import io from 'socket.io-client';

import config from '../config';
import { logWebsocket } from '../shared/utils/logger';
import ac from '../shared/state/actionCreators';

const log = logWebsocket;

export default function registerWebsocket(store) {
  
  const { dispatch, getState, subscribe } = store;
  const { token } = getState().session;
  const options = token ? { query: 'token='+token } : undefined;
  const socket = io(config.services.websocket.url + 'users', options);
  
  // Websocket-related side effects
  const sideEffects = {
    SUCCESS_LOGIN: state => socket.emit('auth', state.session.token),
    SUCCESS_CREATE_USER: state => socket.emit('auth', state.session.token),
  };
  
  const handlers = {
    message: data => {},
    
    updatedUser: data => dispatch(({ type: 'SUCCESS_UPDATE_USER', params: data, payload: undefined })),
  };
  
  for (let key in handlers) {
    socket.on(key, data => {
      log(key + ':', data);
      handlers[key](data);
    });
  }
  
  return sideEffects;
}
