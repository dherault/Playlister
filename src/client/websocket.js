import io from 'socket.io-client';

import log from '../utils/logger';
import ac from '../state/actionCreators';


export default store => {
  
  const socket = io('http://localhost:8282/users');
  const { dispatch, getState, suscribe } = store;
  
  // suscribe(() => {
  //   const { lastAction } = getState();
    
  //   switch(lastAction.type) {
  //     case 'SUCCESS_LOGIN':
  //       socket.emit('')
  //       break;
  //   }
  // });
  
  const handlers = {
    message: data => {},
    
    updateUser: data => dispatch(ac.updateUserPicture(data)),
  };
  
  for (let key in handlers) {
    socket.on(key, data => {
      log('_w_', key + ':', data);
      handlers[key](data);
    });
  }
};
