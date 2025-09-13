import { useCallback, useEffect, useState } from 'react';
import type { Socket } from 'socket.io-client';
import toast from 'react-hot-toast';
import type { IResBase } from '../dto/socket.ts';
import type { IRtpCapabilities } from '../dto/mediasoup.ts';

interface ILiveAudio {
  roomId: string;
  socket?: Socket;
}

export interface IResponse extends IResBase {
  data: {
    live: boolean;
    roomId: string;
    rtpCapabilities: IRtpCapabilities;
  };
}

export type ISubscribesResponse = IResBase;
export type IStartLiveResponse = IResBase;

export function useLive({ roomId, socket }: ILiveAudio) {
  const [liveData, setLiveData] = useState({
    subscribes: false,
    live: false,
  });

  useEffect(() => {
    if (roomId && socket?.id) {
      socket.emit(
        'SUBSCRIBES_LIVE',
        { roomId: roomId, liveId: roomId },
        (response: ISubscribesResponse) => {
          console.log('SUBSCRIBES_LIVE', response);
          toast.success('Subscribes thành công.');
          setLiveData((prev) => ({
            ...prev,
            subscribes: true,
          }));
        },
      );
      socket.emit(
        'LIVE_DETAIL',
        { roomId: roomId, liveId: roomId },
        (response: IResponse) => {
          console.log('LIVE_DETAIL', response);
          if (response.data?.live === true) {
            toast.success('Phiên live đang diễn ra');
            setLiveData((prev) => ({
              ...prev,
              live: true,
            }));
          } else {
            toast.error('Phiên live audio chưa bắt đầu.');
            setLiveData((prev) => ({
              ...prev,
              live: false,
            }));
          }
        },
      );

      socket.on('STARTED_LIVE', () => {
        console.log('STARTED_LIVE');
        toast.success('Phiên live đã được bắt đầu');
        setLiveData((prev) => ({
          ...prev,
          live: true,
        }));
      });
    }
  }, [roomId, socket, socket?.id]);

  const handleLive: () => Promise<void> = useCallback(async () => {
    if (roomId && socket?.id) {
      socket.emit(
        'BEGIN_LIVE',
        { roomId: roomId, liveId: roomId },
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
  }, [roomId, socket]);

  return { status: true, liveData: liveData, handleLive: handleLive };
}
