import { useCallback, useEffect, useState } from 'react';
import type { Socket } from 'socket.io-client';
import toast from 'react-hot-toast';
import type { IResBase } from '../dto/socket.ts';
import type { IRtpCapabilities } from '../dto/mediasoup.ts';

interface ILiveAudio {
  liveId: string;
  socket?: Socket;
}

export interface LiveEntity {
  id: number;
  code: string;
  name: string;
  image: string;
  status: string;
  scheduled_at: string;
  live_at: string;
  recorder_flag: number;
  deleted_at: string;
}

export interface IResponse extends IResBase {
  data: {
    live: boolean;
    roomId: string;
    rtpCapabilities: IRtpCapabilities;
    entity: LiveEntity | null;
  };
}

export type ISubscribesResponse = IResBase;
export type IStartLiveResponse = IResBase;

export function useLive({ liveId, socket }: ILiveAudio) {
  const [isReady, setIsReady] = useState<boolean>(false);

  const [liveData, setLiveData] = useState<{
    subscribes: boolean;
    live: boolean;
    entity: LiveEntity | null | undefined;
  }>({
    subscribes: false,
    live: false,
    entity: undefined,
  });

  useEffect(() => {
    if (liveId && socket?.id) {
      socket.emit(
        'SUBSCRIBES_LIVE',
        { liveId: liveId },
        (response: ISubscribesResponse) => {
          console.log('SUBSCRIBES_LIVE', response);
          toast.success('Subscribes thành công.');
          setLiveData((prev) => ({
            ...prev,
            subscribes: true,
          }));
        },
      );
      socket.emit('LIVE_DETAIL', { liveId: liveId }, (response: IResponse) => {
        console.log('LIVE_DETAIL', response);
        if (response.data?.live === true) {
          toast.success('Phiên live đang diễn ra');
          setLiveData((prev) => ({
            ...prev,
            live: true,
            entity: response.data?.entity
              ? (response.data?.entity as LiveEntity)
              : null,
          }));
        } else {
          toast.error('Phiên live audio chưa bắt đầu.');
          setLiveData((prev) => ({
            ...prev,
            live: false,
            entity: response.data?.entity
              ? (response.data?.entity as LiveEntity)
              : null,
          }));
        }
      });
      setIsReady(true);
      socket.on('STARTED_LIVE', () => {
        console.log('STARTED_LIVE');
        toast.success('Phiên live đã được bắt đầu');
        setLiveData((prev) => ({
          ...prev,
          live: true,
          entity: prev?.entity
            ? {
                ...prev?.entity,
                status: 'ongoing',
              }
            : null,
        }));
      });

      //
      socket.on('ENDED_LIVE', () => {
        console.log('ENDED_LIVE');
        toast.success('Phiên live đã kết thúc');
        setLiveData((prev) => ({
          ...prev,
          live: true,
          entity: prev?.entity
            ? {
                ...prev?.entity,
                status: 'finished',
              }
            : null,
        }));
      });
    }
  }, [liveId, socket, socket?.id]);

  const handleLive: () => Promise<void> = useCallback(async () => {
    if (liveId && socket?.id) {
      socket.emit(
        'BEGIN_LIVE',
        { liveId: liveId },
        (response: IStartLiveResponse) => {
          console.log('BEGIN_LIVE', response);
          if (response.status) {
            toast.success('Phiên live bắt đầu');
            setLiveData((prev) => ({
              ...prev,
              live: true,
            }));
          } else {
            toast.error('Có lỗi xảy ra. Vui lòng thông báo tới ADMIN.');
          }
        },
      );
    }
  }, [liveId, socket]);

  const handleEndLive: () => Promise<void> = useCallback(async () => {
    if (liveId && socket?.id) {
      socket.emit(
        'END_LIVE',
        { liveId: liveId },
        (response: IStartLiveResponse) => {
          console.log('END_LIVE', response);
          if (response.status) {
            toast.success('Phiên live đã kết thúc');
            setLiveData((prev) => ({ ...prev, live: false }));
          } else {
            toast.error('Không thể kết thúc phiên live. Vui lòng thử lại.');
          }
        },
      );
    }
  }, [liveId, socket]);

  return {
    status: true,
    isReady: isReady,
    liveData: liveData,
    handleLive: handleLive,
    closeLive: handleEndLive,
  };
}
