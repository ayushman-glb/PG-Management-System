import { Socket } from 'socket.io';

export function registerRoomSocketHandlers(socket: Socket) {
  socket.on('room:transfer_request_submitted', (data: any) => {
    socket.broadcast.emit('room:transfer_request_updated', data);
  });
}
