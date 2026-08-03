import { Socket } from 'socket.io';
import { logger } from '../../utils/logger';

export function registerAuthSocketHandlers(socket: Socket) {
  socket.on('auth:ping', () => {
    socket.emit('auth:pong', { timestamp: new Date().toISOString() });
    logger.info(`Auth ping from socket ${socket.id}`);
  });
}
