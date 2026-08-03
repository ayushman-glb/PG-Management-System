import { Socket } from 'socket.io';

export function registerComplaintSocketHandlers(socket: Socket) {
  socket.on('complaint:ticket_created', (data: any) => {
    socket.broadcast.emit('complaint:ticket_updated', data);
  });
}
