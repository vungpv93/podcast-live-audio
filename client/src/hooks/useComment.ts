import { useCallback, useEffect, useState } from 'react';
import type { Socket } from 'socket.io-client';
import type { IResBase } from '../dto/socket.ts';
import toast from 'react-hot-toast';

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
  const [pagination, setPagination] = useState<
    { hasMore: boolean; nextCursor: number } | undefined
  >();

  useEffect(() => {
    console.log('EVT_COMMENTS : ', roomId);
    if (socket?.id && roomId) {
      socket?.emit('EVT_COMMENTS', { liveId: roomId }, (response: IResBase) => {
        console.log('EVT_COMMENTS', response);
        const items = (response.data?.comments?.data ?? []) as IComments;
        setPagination({
          hasMore: !!(
            response.data?.comments?.hasMore &&
            response.data?.comments?.nextCursor
          ),
          nextCursor: response.data?.comments?.nextCursor || null,
        });
        console.log('EVT_COMMENTS', items);
        setComments((prev) => {
          return [...prev, ...items];
        });
      });

      socket.on('EVT_COMMENTS_CREATED', (data) => {
        console.log('EVT_COMMENTS_CREATED : ', data);
        setComments((prev) => [data, ...prev]);
      });

      socket.on('EVT_COMMENTS_DELETED', (data) => {
        console.log('EVT_COMMENTS_DELETED : ', data);
        setComments((prev) => prev.filter((c) => c.id !== data.commentId));
      });
    }

    setIsReady(true);
  }, [roomId, socket, socket?.id]);

  const handleLoadMore: () => Promise<void> = useCallback(async () => {
    if (socket && socket.id && roomId) {
      console.log('EVT_COMMENTS_LOAD_MORE', { pagination });
      socket.emit(
        'EVT_COMMENTS',
        {
          liveId: roomId,
          cursor: pagination?.nextCursor || undefined,
        },
        (response: IResBase) => {
          console.log('EVT_COMMENTS', response);
          const items = (response.data?.comments?.data ?? []) as IComments;
          console.log(
            'The item ....',
            items.map((c) => c.score),
          );
          setPagination({
            hasMore: !!(
              response.data?.comments?.hasMore &&
              response.data?.comments?.nextCursor
            ),
            nextCursor: response.data?.comments?.nextCursor || null,
          });
          console.log('EVT_COMMENTS', items);
          setComments((prev) => {
            return [...prev, ...items];
          });
        },
      );
    }
  }, [pagination, roomId, socket]);

  const handleAdd: () => Promise<void> = useCallback(async () => {
    if (socket && socket.id && roomId) {
      console.log('EVT_COMMENTS_CREATE', roomId);
    }
  }, [roomId, socket]);

  const handleDel: (comment: IComment) => Promise<void> = useCallback(
    async (comment: IComment): Promise<void> => {
      if (socket && socket.id && roomId) {
        console.log('EVT_COMMENTS_DELETE', {
          liveId: roomId,
          commentId: comment.id,
          score: comment.score,
        });
        socket.emit(
          'EVT_COMMENTS_DELETE',
          { liveId: roomId, commentId: comment.id, score: comment.score },
          (response: IResBase) => {
            if (response.status) {
              toast.success('Bình luận này đã bị loại bỏ');
            } else {
              toast.error('Xóa bình luận không thành công');
            }
          },
        );
      }
    },
    [roomId, socket],
  );

  return {
    status: true,
    isReady: isReady,
    comments: comments,
    pagination: pagination,
    handleLoadMore: handleLoadMore,
    handleAdd: handleAdd,
    handleDel: handleDel,
  };
}
