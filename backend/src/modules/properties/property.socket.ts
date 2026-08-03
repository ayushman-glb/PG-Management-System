import { Socket } from 'socket.io';
import { logger } from '../../utils/logger';

export function registerPropertySocketHandlers(socket: Socket) {
  socket.on('property:join_room', (pgId: string) => {
    socket.join(`pg_${pgId}`);
    logger.info(`Socket ${socket.id} joined room pg_${pgId}`);
  });
}
