import React from 'react';
import type { ILiveAudio } from '../../dto/live-audio.ts';

const Index: React.FC<ILiveAudio> = ({ roomId, socket }: ILiveAudio) => {
  return (
    <header className="flex items-center justify-between p-4 bg-gray-800 shadow-md">
      <h1 className="text-xl font-bold">
        Live Audio : #{roomId || 'NotAvailable '}
      </h1>
      <span> SocketId: {socket?.id || 'NA'}</span>
    </header>
  );
};

export default Index;
