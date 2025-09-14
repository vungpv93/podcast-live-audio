import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { SocketEvent } from '../conf/socket.ts';

export function useSocket() {
  const [socketId, setSocketId] = useState<string>();
  const [socket, setSocket] = useState<Socket>();

  useEffect(() => {
    const newSocket = io(`${import.meta.env.VITE_SOCKET_URL}`, {
      transports: ['websocket'],
      auth: {
        token: 'FAKER_TOKEN',
      },
    });
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
