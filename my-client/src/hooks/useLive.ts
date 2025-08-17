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
        'ROOM_SUBSCRIBES',
        { roomId: roomId },
        (response: ISubscribesResponse) => {
          console.log('[socket.emit] - ROOM_SUBSCRIBES', response);
          toast.success('Subscribes thành công.');
          setLiveData((prev) => ({
            ...prev,
            subscribes: true,
          }));
        },
      );
      socket.emit('ROOM_STATUS', { roomId: roomId }, (response: IResponse) => {
        console.log('[socket.emit] - ROOM_STATUS', response);
        if (response.data?.live === true) {
          toast.success('Phiên live đang diễn ra');
          setLiveData((prev) => ({
            ...prev,
            live: true,
          }));
        } else {
          toast.success('Phiên live audio chưa bắt đầu.');
          setLiveData((prev) => ({
            ...prev,
            live: false,
          }));
        }
      });

      socket.on('ROOM_LIVE', () => {
        console.log('[socket.on] - ROOM_LIVE');
        toast.success('Phiên live bắt đầu');
        setLiveData((prev) => ({
          ...prev,
          live: true,
        }));
      });
    }
  }, [roomId, socket, socket?.id]);

  const handleLive: () => void = useCallback(() => {
    if (roomId && socket?.id) {
      socket.emit(
        'ROOM_LIVE',
        { roomId: roomId },
        (response: IStartLiveResponse) => {
          console.log('[socket.emit] - ROOM_LIVE', response);
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
  }, [roomId, socket, socket?.id]);

  return { status: true, liveData: liveData, handleLive: handleLive };
}
