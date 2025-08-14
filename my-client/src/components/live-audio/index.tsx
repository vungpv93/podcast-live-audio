import React from 'react';
import type { ILiveAudio } from '../../dto/live-audio';
import AudioAnalyzer from '../AudioAnalyzer';
import { useLiveAudio } from '../../hooks/useLiveAudio';

const Index: React.FC<ILiveAudio> = ({ roomId, socket }) => {
  const { audioStream, joinRoom, leaveRoom, handlePause, handleResume } = useLiveAudio({
    roomId,
    socket,
  });

  return (
    <section className="flex-[3] flex flex-col p-4 w-full">
      <AudioAnalyzer audioStream={audioStream} />

      <div className="flex items-center justify-between bg-gray-800 p-2 rounded mb-4 shadow-md w-full">
        <div className="flex space-x-2 align-center">
          <button
            className="px-3 py-1 bg-yellow-500 rounded hover:bg-yellow-600"
            onClick={joinRoom}
          >
            As Guest
          </button>
          <button
            className="px-3 py-1 bg-green-600 rounded hover:bg-green-700"
            onClick={handleResume}
          >
            Tiếp tục
          </button>
          <button
            className="px-3 py-1 bg-red-600 rounded hover:bg-red-700"
            onClick={handlePause}
          >
            Tạm dừng
          </button>
          <button
            className="px-3 py-1 bg-red-600 rounded hover:bg-red-700"
            onClick={leaveRoom}
          >
            Rời phòng
          </button>
        </div>
      </div>
    </section>
  );
};

export default Index;
