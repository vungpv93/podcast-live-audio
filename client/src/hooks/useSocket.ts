import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { SocketEvent } from '../conf/socket.ts';
import Cookies from 'js-cookie';

export function useSocket() {
  const [socketId, setSocketId] = useState<string>();
  const [socket, setSocket] = useState<Socket>();

  useEffect(() => {
    const token = Cookies.get('token');
    if (!token) return;
    console.log(
      `import.meta.env.VITE_SOCKET_URL `,
      import.meta.env.VITE_SOCKET_URL,
    );
    const newSocket = io(`${import.meta.env.VITE_SOCKET_URL}`, {
      transports: ['websocket'],
      auth: {
        token: Cookies.get('token'),
      },
    });

    newSocket.on(SocketEvent.Connect, () => {
      if (newSocket.id) {
        setSocket(newSocket);
        setSocketId(newSocket.id);
      }
    });

    newSocket.on('connect_error', (err) => {
      console.error('❌ Connect error:', err.message);
    });

    newSocket.on('disconnect', (reason) => {
      console.warn('⚠️ Disconnected:', reason);
    });

    return () => {
      // newSocket?.close();
      newSocket.disconnect();
    };
  }, []);

  return { socketId, socket };
}
