import React from 'react';
import Header from '../../components/header';
import Participants from '../../components/participants';
import LiveAudio from '../../components/live-audio';
import Comments from '../../components/comments';
import type { Socket } from 'socket.io-client';

interface ILiveAudio {
  roomId: string;
  socket?: Socket;
}

const Index: React.FC<ILiveAudio> = ({ roomId, socket }: ILiveAudio) => {
  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      <Header roomId={roomId} socket={socket} />
      <main className="flex flex-1 overflow-hidden">
        <Participants />
        <LiveAudio roomId={roomId} socket={socket} />
        <Comments />
      </main>
    </div>
  );
};

export default Index;
