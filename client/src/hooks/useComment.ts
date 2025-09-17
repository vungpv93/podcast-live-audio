import { useCallback, useEffect, useState } from 'react';
import type { Socket } from 'socket.io-client';

interface ILiveAudio {
  roomId: string;
  socket?: Socket;
}

export interface IComment {
  id: string;
  content: string;
  userId: number;
  user: IUser;
  status: number;
  createdAt: string;
  score: number;
}

export interface IUser {
  id: number;
  nickname: string;
  avatar: string;
}

export type IComments = IComment[];

export function useComment({ roomId, socket }: ILiveAudio) {
  const [isReady, setIsReady] = useState<boolean>(false);
  const [comments, setComments] = useState<IComments>([]);

  useEffect(() => {
    console.log('EVT_COMMENTS : ', roomId);
    if (socket?.id && roomId) {
      socket?.emit('EVT_COMMENTS', { liveId: roomId }, (response: any) => {
        console.log('EVT_COMMENTS', response);
        const items = (response.data?.comments?.data ?? []) as IComments;
        console.log('EVT_COMMENTS', items);
        setComments((prev) => {
          return [...prev, ...items];
        });
      });

      socket.on('EVT_COMMENTS_CREATED', (data) => {
        console.log('EVT_COMMENTS_CREATED : ', data);
        setComments(prev => [data, ...prev]);
      });
    }

    setIsReady(true);
  }, [roomId, socket, socket?.id]);

  const handleAdd: () => Promise<void> = useCallback(async () => {
    if (socket && socket.id && roomId) {
      console.log('EVT_COMMENT_ADD', roomId);
    }
  }, [roomId, socket]);

  return {
    status: true,
    isReady: isReady,
    comments: comments,
    handleAdd: handleAdd,
  };
}
