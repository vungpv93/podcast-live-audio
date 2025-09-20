import React, { useEffect, useState } from 'react';
import Header from '../../components/header';
import Participants from '../../components/participants';
import LiveAudio from '../../components/live-audio';
import Comments from '../../components/comments';
import type { Socket } from 'socket.io-client';
import type { IAuth, ILiveEntity } from '../../dto/live-audio.ts';
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
  id: string;
  socket: Socket;
  auth: IAuth;
  liveEntity: ILiveEntity | undefined;
}

function LiveWrapper({ id, socket, auth, liveEntity }: ILiveWrapper) {
  const { isMicOn } = useMic();
  if (isMicOn)
    return (
      <main className="flex flex-1 overflow-hidden">
        <Participants />
        <LiveAudio
          roomId={id || ''}
          socket={socket}
          auth={auth}
          entity={liveEntity}
        />
        <Comments roomId={id || ''} socket={socket} auth={auth} />
      </main>
    );

  return null;
}

const Index: React.FC<ILiveAudio> = ({ socket, auth }: ILiveAudio) => {
  const [isReady, setIsReady] = useState<boolean>(false);
  const [authenticated, setAuthenticated] = useState<boolean | undefined>(
    undefined,
  );
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const { liveEntity, isReady: liveIsReady } = useAuthVerified({
    liveId: id || '',
    socket,
  });

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('tk');

    if (token) {
      Cookies.set('token', token, {
        path: `/live/${id}`,
        secure: false,
        sameSite: 'strict',
      });
      navigate(`/live/${id}`, { replace: true });
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
  }, [id, location.search, navigate]);

  if (!isReady || !liveIsReady) {
    return <LoadingPage />;
  }

  if (authenticated === false) {
    return <Forbidden />;
  }

  if (liveEntity === null) {
    return <LiveNotFound />;
  }

  if (!liveEntity) {
    return null;
  }

  return (
    <MicProvider>
      <div className="flex flex-col h-screen bg-gray-900 text-white">
        <Header roomId={id || ''} socket={socket} />
        {/*<main className="flex flex-1 overflow-hidden">*/}
        {/*  <Participants />*/}
        {/*  <LiveAudio*/}
        {/*    roomId={id || ''}*/}
        {/*    socket={socket}*/}
        {/*    auth={auth}*/}
        {/*    entity={liveEntity}*/}
        {/*  />*/}
        {/*  <Comments roomId={id || ''} socket={socket} auth={auth} />*/}
        {/*</main>*/}
        <LiveWrapper
          id={String(id) || ''}
          socket={socket}
          auth={auth}
          liveEntity={liveEntity}
        />
      </div>
    </MicProvider>
  );
};

export default Index;
