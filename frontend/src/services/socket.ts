import { useEffect } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:5000';

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: true,
      withCredentials: true
    });
  }
  return socket;
};

export function useSocketEvent<T = any>(eventName: string, handler: (data: T) => void) {
  useEffect(() => {
    const s = getSocket();
    s.on(eventName, handler);
    return () => {
      s.off(eventName, handler);
    };
  }, [eventName, handler]);
}

export function useSocketRoom(roomType: 'pg' | 'owner' | 'resident', id: string | null) {
  useEffect(() => {
    if (!id) return;
    const s = getSocket();
    s.emit(`join_${roomType}`, id);
  }, [roomType, id]);
}
