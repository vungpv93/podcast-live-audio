import React from 'react';
import Header from '../../components/header';
import Participants from '../../components/participants';
import LiveAudio from '../../components/live-audio';
import Comments from '../../components/comments';
import type { Socket } from 'socket.io-client';
import type { IAuth } from '../../dto/live-audio.ts';

interface ILiveAudio {
  roomId: string;
  socket?: Socket;
  auth?: IAuth;
}

const Index: React.FC<ILiveAudio> = ({ roomId, socket, auth }: ILiveAudio) => {
  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      <Header roomId={roomId} socket={socket} />
      <main className="flex flex-1 overflow-hidden">
        <Participants />
        <LiveAudio roomId={roomId} socket={socket} auth={auth} />
        <Comments />
      </main>
    </div>
  );
};

export default Index;
