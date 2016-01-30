import io from 'socket.io-client';

import config from '../config';
import log from '../shared/utils/logger';
import ac from '../shared/state/actionCreators';


export default store => {
  
  const socket = io(config.services.websocket.url + 'users');
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
