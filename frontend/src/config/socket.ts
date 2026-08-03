import { io, Socket } from "socket.io-client";
import { env } from "./env";

let socketInstance: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socketInstance) {
    socketInstance = io(env.SOCKET_URL, {
      autoConnect: true,
      withCredentials: true,
    });
  }
  return socketInstance;
};
