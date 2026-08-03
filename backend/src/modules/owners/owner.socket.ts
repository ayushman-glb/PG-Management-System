import { Socket } from 'socket.io';
import { logger } from '../../utils/logger';

export function registerOwnerSocketHandlers(socket: Socket) {
  socket.on('owner:subscribe_metrics', (ownerId: string) => {
    logger.info(`Owner ${ownerId} subscribed to metrics stream via socket ${socket.id}`);
  });
}
