import { io, Socket } from "socket.io-client";

const sockets: Record<string, Socket> = {};

export const getSocket = (key: string, path = "/api/socket"): Socket => {
  if (!sockets[key]) {
    sockets[key] = io({ path });
  }
  return sockets[key];
};

export const disconnectSocket = (key: string) => {
  sockets[key]?.disconnect();
  delete sockets[key];
};
