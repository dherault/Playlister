import fs from 'fs';
import http from 'http';
import socketIO from 'socket.io';

import config from '../config';
import log from '../../utils/logger';

const app = http.createServer((req, res) => log('!!!', 'WS server request'));
const port = config.services.websocket.port;
const io = socketIO(app);
app.listen(port);
log('Websocket server listening on port', port);

io.on('connection', socket => {
  socket.emit('message', 'Hello from server');
  
  socket.on('requestUpdateUserPicture', data => {
    
    socket.emit('updateUserPicture', {id: 1});
  });
});
