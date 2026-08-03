import { Socket } from 'socket.io';

export function registerBedSocketHandlers(socket: Socket) {
  socket.on('bed:status_changed', (payload: any) => {
    socket.broadcast.emit('bed:status_updated', payload);
  });
}
