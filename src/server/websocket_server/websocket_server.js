import http from 'http';
import socketIO from 'socket.io';

import config from '../../config';
import { logWebsocket, logError, logStart } from '../../shared/utils/logger';
import { verifyToken } from '../utils/authUtils';

/*
  A websocket server for users (clients) and services
*/

const log = logWebsocket;
const { port, serviceSecretNamespace, servicesSecretKey } = config.services.websocket;
const app = http.createServer((req, res) => log('!!!', 'WS server request'));
const io = socketIO(app);

// Authenticated sockets mapping
const authUsers = new Map(); // socketId --> userId
const authUserSockets = new Map(); // userId --> socket
const authServices = new Map(); // socketId --> serviceName

// Namespaces
const usersNamespace = io.of('users');
const servicesNamespace = io.of(serviceSecretNamespace);
const getNamespaceSize = x => Object.keys(x.connected).length;
const getUsersRatio = () => authUsers.size + '/' + getNamespaceSize(usersNamespace);
const getServicesRatio = () => authServices.size + '/' + getNamespaceSize(servicesNamespace);
const gur = getUsersRatio; // shorcuts
const gsr = getServicesRatio;

/* Handlers */
const handlers = {
  
  users: {
    
    disconnect: socket => {
      const socketId = socket.id;
      const userId = authUsers.get(socketId);
      log('User disconnected:', userId || socketId, gur());
      if (userId) {
        authUsers.delete(socketId);
        authUserSockets.delete(userId);
      }
    },
    
    auth: (socket, token) => {
      verifyToken(token).then(({ id }) => {
        log('User auth success:', id);
        authUsers.set(socket.id, id);
        authUserSockets.set(id, socket);
        socket.emit('message', 'Auth success');
      }, err => logError('websocket users.auth verifyToken', err));
    },
    
  },
  
  services: {
    
    disconnect: socket => {
      const socketId = socket.id;
      const serviceName = authServices.get(socketId);
      log('Service disconnected:', serviceName || socketId, gsr());
      if (serviceName) authServices.delete(socketId);
    },
    
    // Can do better
    auth: (socket, { key, name }) => {
      if (key === servicesSecretKey) {
        authServices.set(socket.id, name);
        log('Service auth success:', name, gsr());
        socket.emit('message', 'auth success');
      } else {
        log('Service auth failure:', name, gsr());
        socket.emit('message', 'auth failure');
      }
    },
    
    noticeUpdateUser: (socket, data) => {
      log('noticeUpdateUser', data);
      if (authServices.has(socket.id)) {
        const userSocket = authUserSockets.get(data.id);
        if (userSocket) userSocket.emit('updatedUser', data);
      }
    },
  },
};

/* Wiring */

// This is a socket.io middleware to filter incomming connections
// Unauthenticated users are welcome too, so the callback is always true;
usersNamespace.use((socket, next) => {
  const { token } = socket.handshake.query;
  
  if (token) verifyToken(token)
    .then(({ id }) => {
      authUsers.set(socket.id, id);
      authUserSockets.set(id, socket);
      next(null, true);
    })
    .catch(err => next(err, true)); // Lets give the error to the client for hacking-friendly purposes
  
  else next(null, true);
});

usersNamespace.on('connect', socket => {
  const { id } = socket;
  const isAuth = authUsers.has(id);
  const h = handlers.users;
  
  log('User connected:', isAuth, id, gur());
  socket.emit('message', 'Hello from websocket server. Auth: ' + isAuth);
  
  for (let event in h) {
    socket.on(event, data => h[event](socket, data));
  }
});

servicesNamespace.on('connect', socket => {
  const { id } = socket;
  const h = handlers.services;
  log('Service connected:', id, gsr());
  
  for (let event in h) {
    socket.on(event, data => h[event](socket, data));
  }
});

app.listen(port, () => logStart('Websocket server listening on port', port));
