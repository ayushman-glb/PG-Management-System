import { Socket } from 'socket.io';

export function registerNotificationSocketHandlers(socket: Socket) {
  socket.on('notification:push', (data: any) => {
    socket.broadcast.emit('notification:received', data);
  });
}
