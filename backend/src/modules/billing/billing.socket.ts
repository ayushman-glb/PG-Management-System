import { Socket } from 'socket.io';

export function registerBillingSocketHandlers(socket: Socket) {
  socket.on('billing:payment_completed', (payload: any) => {
    socket.broadcast.emit('billing:payment_received', payload);
  });
}
