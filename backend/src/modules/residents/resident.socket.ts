import { Socket } from 'socket.io';
import { logger } from '../../utils/logger';

export function registerResidentSocketHandlers(socket: Socket) {
  socket.on('resident:status_changed', (payload: any) => {
    socket.broadcast.emit('resident:status_updated', payload);
    logger.info(`Resident status updated event received: ${JSON.stringify(payload)}`);
  });
}
