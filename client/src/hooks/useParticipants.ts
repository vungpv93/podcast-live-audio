import { useEffect, useState } from 'react';
import type { Socket } from 'socket.io-client';
import type { IResBase } from '../dto/socket.ts';

interface ILiveAudio {
  liveId: string;
  socket?: Socket;
}

export interface ISocketInfo {
  socketId: string;
  userId: number;
  nickname?: string | null | undefined;
}

export type ISockets = ISocketInfo[];

export function useParticipants({ liveId, socket }: ILiveAudio) {
  const [isReady, setIsReady] = useState<boolean>(false);
  const [count, setCount] = useState<number>(0);
  const [sockets, setSockets] = useState<ISockets>([]);

  useEffect(() => {
    console.log('EVT_GET_SOCKETS : ', liveId);
    if (socket?.id && liveId) {
      socket.emit(
        'EVT_GET_SOCKETS',
        { liveId: liveId },
        (response: IResBase) => {
          console.log('EVT_GET_SOCKETS', response);
          const items = (response.data?.sockets ?? []) as ISockets;
          console.log('EVT_GET_SOCKETS', items);
          setSockets(() => {
            return [...items];
          });
        },
      );

      socket.emit(
        'EVT_COUNT_SOCKETS',
        { liveId: liveId },
        (response: IResBase) => {
          console.log('EVT_COUNT_SOCKETS', response);
          const count = (response.data?.count ?? 0) as number;
          console.log('EVT_COUNT_SOCKETS', count);
          setCount(response.data?.count ?? 0);
        },
      );

      socket.on('PARTICIPANTS_UPDATED', (data) => {
        console.log('PARTICIPANTS_UPDATED', data);
        setCount(data?.participants?.count as number);
        const socket = data.participants?.participant as ISocketInfo;
        setSockets((prev) => {
          return [{ ...socket }, ...prev];
        });
      });

      socket.on('PARTICIPANTS_LEAVE', (data) => {
        console.log('PARTICIPANTS_LEAVE', data);
        setCount(data.count as number);
        const socketId: string = data.socketId as string;
        setSockets((prev) => prev.filter((s) => s.socketId !== socketId));
      });
      setIsReady(true);
    }
  }, [liveId, socket, socket?.id]);

  return {
    status: true,
    isReady: isReady,
    sockets: sockets,
    count: count,
  };
}
