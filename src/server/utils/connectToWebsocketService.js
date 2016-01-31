import io from 'socket.io-client';
import config from '../../config';

// A simple auth protocol to connect services to the Websocket service
export default function connectToWebsocketService(name) {
  
  const { serviceSecretNamespace, servicesSecretKey } = config.services.websocket;
  const socket = io(config.services.websocket.url + serviceSecretNamespace);
  
  socket.on('connect', () => {
    socket.emit('auth', { name, key: servicesSecretKey });
  });
  
  return socket;
}
