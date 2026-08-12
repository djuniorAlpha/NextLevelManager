import { io, type Socket } from "socket.io-client";
import { apiBaseUrl } from "@/lib/api/client";

let socket: Socket | null = null;
let socketToken: string | null = null;

/**
 * Singleton de conexão com o namespace /realtime do backend.
 * Reaproveita o socket existente se o token não mudou; caso contrário
 * desconecta o antigo (ex.: logout seguido de login com outro admin).
 */
export function getSocket(token: string): Socket {
  if (socket && socketToken === token) {
    return socket;
  }

  if (socket) {
    socket.disconnect();
  }

  socketToken = token;
  socket = io(`${apiBaseUrl()}/realtime`, {
    auth: { token },
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 10_000,
    reconnectionAttempts: Infinity,
  });

  return socket;
}

export function disconnectSocket(): void {
  socket?.disconnect();
  socket = null;
  socketToken = null;
}
