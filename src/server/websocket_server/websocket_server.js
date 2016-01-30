import http from 'http';
import socketIO from 'socket.io';

import config from '../../config';
import logg from '../../shared/utils/logger';

const log = (...x) => logg('_w_', ...x);
const { port, serviceSecretNamespace, servicesSecretKey } = config.services.websocket;
const app = http.createServer((req, res) => log('!!!', 'WS server request'));
const io = socketIO(app);

app.listen(port, () => logg('.:. Websocket server listening on port', port));

// Authenticated sockets
const users = new Map();
const services = new Map();

// Namespaces
const usersNamespace = io.of('users');
const servicesNamespace = io.of(serviceSecretNamespace);
const getNamespaceSize = x => Object.keys(x.connected).length;
const getUsersRatio = () => users.size + '/' + getNamespaceSize(usersNamespace);
const getServicesRatio = () => services.size + '/' + getNamespaceSize(servicesNamespace);
const gur = getUsersRatio;
const gsr = getServicesRatio;

// Handlers
const handlers = {
  
  users: {
    
    disconnect: id => {
      if (users.has(id)) {
        log('User disconnected: ', users[id].username, gur());
        users.delete(id);
      } else {
        log('User disconnected: ', id, gur());
      }
    },
    
  },
  
  services: {
    
    disconnect: id => {
      if (services.has(id)) {
        const name = services.get(id);
        services.delete(id);
        log('Service disconnected: ', name, gsr());
      } else {
        log('Service disconnected: ', id, gsr());
      }
    },
    
    auth: (id, { key, name }, socket) => {
      if (key === servicesSecretKey) {
        services.set(id, name);
        log('Service auth success:', name, gsr());
        socket.emit('message', 'auth success');
        
      } else {
        log('Service auth failure:', name, gsr());
        socket.emit('message', 'auth failure');
      }
    },
    
    noticeUpdateUser: (id, data, socket) => {
      log('noticeUpdateUser', data);
    },
  },
};

// Wiring
usersNamespace.on('connect', socket => {
  const { id } = socket;
  const h = handlers.users;
  log('New user connected:', id, gur());
  socket.emit('message', 'Hello from server');
  
  for (let event in h) {
    socket.on(event, data => h[event](id, data, socket));
  }
});

servicesNamespace.on('connect', socket => {
  const { id } = socket;
  const h = handlers.services;
  log('New service connected:', id, gsr());
  
  for (let event in h) {
    socket.on(event, data => h[event](id, data, socket));
  }
});
