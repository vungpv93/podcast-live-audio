import React, { useEffect, useState } from 'react';
import Header from '../../components/header';
import Participants from '../../components/participants';
import LiveAudio from '../../components/live-audio';
import Comments from '../../components/comments';
import type { Socket } from 'socket.io-client';
import type { IAuth, ILiveEntity, IUser } from '../../dto/live-audio.ts';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import Forbidden from '../403';
import LoadingPage from '../../components/loading/LoadingPage.tsx';
import { useAuthVerified } from '../../hooks/useAuthVerified.ts';
import LiveNotFound from '../../components/404/live';
import { MicProvider, useMic } from '../../context/MicContext.tsx';

interface ILiveAudio {
  socket: Socket;
  auth: IAuth;
}

interface ILiveWrapper {
  liveId: string;
  socket: Socket;
  auth: IAuth;
  liveEntity: ILiveEntity | undefined;
}

function LiveWrapper({ liveId, socket, auth, liveEntity }: ILiveWrapper) {
  const { isMicOn } = useMic();
  if (isMicOn)
    return (
      <main className="flex flex-1 overflow-hidden">
        <Participants liveId={liveId || ''} socket={socket} auth={auth} />
        <LiveAudio
          liveId={liveId || ''}
          socket={socket}
          auth={auth}
          entity={liveEntity}
        />
        <Comments liveId={liveId || ''} socket={socket} auth={auth} />
      </main>
    );

  return null;
}

const Index: React.FC<ILiveAudio> = ({ socket }: ILiveAudio) => {
  const [isReady, setIsReady] = useState<boolean>(false);
  const [authenticated, setAuthenticated] = useState<boolean | undefined>(
    undefined,
  );
  const { id: liveId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const {
    isReady: liveIsReady,
    liveEntity,
    authVerified,
  } = useAuthVerified({
    liveId: liveId || '',
    socket,
  });

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('tk');

    if (token) {
      Cookies.set('token', token, {
        path: `/live/${liveId}`,
        secure: false,
        sameSite: 'strict',
      });
      navigate(`/live/${liveId}`, { replace: true });
      setIsReady(true);
      return;
    } else {
      const cookieToken = Cookies.get('token');
      if (!cookieToken) {
        console.error('Cookie not found');
        setAuthenticated(false);
      } else {
        setAuthenticated(true);
      }
      setIsReady(true);
    }
  }, [liveId, location.search, navigate]);

  if (!socket.id) {
    return <Forbidden />;
  }

  if (!isReady || !liveIsReady) {
    return <LoadingPage />;
  }

  if (authenticated === false) {
    return <Forbidden />;
  }

  if (liveEntity === null && liveIsReady) {
    return <LiveNotFound />;
  }

  if (!liveEntity) {
    return null;
  }

  return (
    <MicProvider>
      <div className="flex flex-col h-screen bg-gray-900 text-white">
        <Header
          liveId={liveId || ''}
          socket={socket}
          auth={authVerified as IUser}
        />
        <LiveWrapper
          liveId={String(liveId) || ''}
          socket={socket}
          auth={authVerified as IUser}
          liveEntity={liveEntity}
        />
      </div>
    </MicProvider>
  );
};

export default Index;
