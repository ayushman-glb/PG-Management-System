import { Socket } from 'socket.io';

export function registerAgreementSocketHandlers(socket: Socket) {
  socket.on('agreement:sign_event', (payload: any) => {
    socket.broadcast.emit('agreement:updated', payload);
  });
}
