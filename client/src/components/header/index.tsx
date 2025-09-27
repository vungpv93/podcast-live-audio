import React from 'react';
import type { ILiveAudio } from '../../dto/live-audio.ts';

const Index: React.FC<ILiveAudio> = ({ liveId, socket, auth }: ILiveAudio) => {
  return (
    <header className="flex items-center justify-between p-4 bg-gray-800 shadow-md">
      <span className="text-sm">Username: {auth?.nickname || 'NA'}</span>
      <h1 className="text-base font-bold">
        LiveId : #{liveId || 'NotAvailable '}
      </h1>
      <span className="text-sm"> SocketId: {socket?.id || 'NA'}</span>
    </header>
  );
};

export default Index;
