import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { ConfigApp } from '../conf';
import { SocketEvent } from '../conf/socket.ts';

export function useSocket() {
  const [socketId, setSocketId] = useState<string>();
  const [socket, setSocket] = useState<Socket>();

  useEffect(() => {
    const opts = {
      transports: ['websocket'],
      auth: { id: 1, nickname: 'VungPV' },
    };
    const newSocket = io(ConfigApp.socketURL, opts);

    setSocket(newSocket);

    newSocket.on(SocketEvent.Connect, () => {
      if (newSocket.id) setSocketId(newSocket.id);
    });

    return () => {
      newSocket.close();
      newSocket.disconnect();
    };
  }, []);

  return { socketId, socket };
}
