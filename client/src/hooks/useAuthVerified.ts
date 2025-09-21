import { useEffect, useState } from 'react';
import type { Socket } from 'socket.io-client';
import type { IResBase } from '../dto/socket.ts';
import type { IAuth, ILiveEntity } from '../dto/live-audio.ts';

interface ILiveAudio {
  liveId: string;
  socket?: Socket;
}

export interface IResponse extends IResBase {
  data: {
    entity: ILiveEntity | null;
    auth: IAuth | null;
  };
}

export function useAuthVerified({ liveId, socket }: ILiveAudio) {
  const [isReady, setIsReady] = useState<boolean>(false);

  const [liveEntity, setLiveEntity] = useState<
    ILiveEntity | null | undefined
  >();

  const [authVerified, setAuthVerified] = useState<IAuth | null | undefined>();

  useEffect(() => {
    if (liveId && socket?.id) {
      socket.emit(
        'AUTH_VERIFIED',
        { liveId: liveId, roomId: liveId },
        (response: IResponse) => {
          console.log('AUTH_VERIFIED', response);
          if (response.data) {
            setLiveEntity(response.data?.entity as ILiveEntity);
            setAuthVerified(response.data?.auth as IAuth);
          } else {
            setLiveEntity(null);
            setAuthVerified(null);
          }
        },
      );
      setIsReady(true);
    }
  }, [liveId, socket, socket?.id]);

  return {
    status: true,
    isReady: isReady,
    liveEntity: liveEntity,
    authVerified: authVerified,
  };
}
