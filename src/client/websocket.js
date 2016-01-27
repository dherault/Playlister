import io from 'socket.io-client';

import log from '../utils/logger';
import ac from '../state/actionCreators';


export default store => {
  
  const socket = io('http://localhost:8282');
  const { dispatch, getState } = store;
  
  const handlers = {
    message: data => {},
    
    updateUserPicture: data => dispatch(ac.updateUserPicture(data)),
  };
  
  for (let key in handlers) {
    socket.on(key, data => {
      log('_w_', key + ':', data);
      handlers[key](data);
    });
  }
};
