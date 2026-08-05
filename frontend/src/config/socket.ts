import { io, Socket } from "socket.io-client";
import { env } from "./env";

let socketInstance: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socketInstance) {
    socketInstance = io(env.SOCKET_URL, {
      autoConnect: true,
      withCredentials: true,
      reconnectionAttempts: 3,
      timeout: 5000,
      transports: ["websocket", "polling"],
    });

    socketInstance.on("connect_error", (err) => {
      console.warn("Socket.io connection warning:", err.message);
    });
  }
  return socketInstance;
};
