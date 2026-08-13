import { useEffect } from "react";
import { io, Socket } from "socket.io-client";
import { env } from "../config/env";

const SOCKET_URL = env.SOCKET_URL;

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("accessToken") ||
        localStorage.getItem("token") ||
        localStorage.getItem("roombae_access_token")
      : null;

  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: false,
      auth: { token },
      withCredentials: true,
      reconnectionAttempts: 3,
      timeout: 5000,
      transports: ["websocket", "polling"],
    });

    socket.on("connect_error", (err) => {
      console.warn("⚠️ Real-time Socket connection notice:", err.message);
    });

    if (token) {
      socket.connect();
    }
  } else if (token && !socket.connected) {
    socket.auth = { token };
    socket.connect();
  }

  return socket;
};

export const updateSocketAuth = (newToken: string) => {
  if (!newToken) return;
  const s = getSocket();
  s.auth = { token: newToken };
  if (s.connected) {
    s.emit("auth_refresh", newToken);
  } else {
    s.connect();
  }
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export function useSocketEvent<T = any>(
  eventName: string,
  handler: (data: T) => void,
) {
  useEffect(() => {
    const s = getSocket();
    s.on(eventName, handler);
    return () => {
      s.off(eventName, handler);
    };
  }, [eventName, handler]);
}

export function useSocketRoom(
  roomType: "pg" | "owner" | "resident",
  id: string | null,
) {
  useEffect(() => {
    if (!id) return;
    const s = getSocket();

    const joinRoom = () => {
      s.emit(`join_${roomType}`, id);
    };

    if (s.connected) {
      joinRoom();
    }

    s.on("connect", joinRoom);
    return () => {
      s.off("connect", joinRoom);
    };
  }, [roomType, id]);
}
