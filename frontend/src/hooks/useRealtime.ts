import { useEffect } from "react";
import { getSocket } from "@config/socket";

export function useRealtime<T = any>(eventName: string, handler: (data: T) => void) {
  useEffect(() => {
    const socket = getSocket();
    socket.on(eventName, handler);
    return () => {
      socket.off(eventName, handler);
    };
  }, [eventName, handler]);
}

export function useRealtimeRoom(roomType: "pg" | "owner" | "resident", id: string | null) {
  useEffect(() => {
    if (!id) return;
    const socket = getSocket();
    socket.emit(`join_${roomType}`, id);
  }, [roomType, id]);
}
