import React from 'react';
import type { ILiveAudio } from '../../dto/live-audio';
import AudioAnalyzer from '../AudioAnalyzer';
import { useLiveAudio } from '../../hooks/useLiveAudio';
import { MicrophoneIcon } from '@heroicons/react/24/solid';
import { useMic } from '../../hooks/useMic.ts';

const Index: React.FC<ILiveAudio> = ({ roomId, socket }) => {
  const { isMicOn, handleMic, localStream } = useMic();
  const { audioStream, joinRoom, leaveRoom, handlePause, handleResume } = useLiveAudio({
    roomId,
    socket,
    localStream,
  });
  
  return (
    <section className='flex-[3] flex flex-col p-4 w-full'>
      
      <div className='relative w-full flex justify-center'>
        <AudioAnalyzer audioStream={localStream || audioStream || undefined} />
        <div className='absolute inset-0 flex items-center justify-center'>
          <button
            className={`h-24 w-24 rounded-full flex items-center justify-center border-0 focus:outline-none focus:ring-0 hover:bg-none hover:shadow-none hover:outline-none ${isMicOn ? 'bg-blue-600' : 'bg-gray-600'}`}
            onClick={handleMic}
          >
            <MicrophoneIcon className='h-16 w-16 text-white opacity-70' />
          </button>
        </div>
      </div>
      
      <div className='flex my-4 items-center justify-between bg-gray-800 p-2 rounded mb-4 shadow-md w-full'>
        <div className='flex space-x-2 align-center'>
          <button
            className='px-3 py-1 bg-green-600 rounded'
            onClick={joinRoom}
          >
            Bắt đầu live audio
          </button>
          <button
            className='px-3 py-1 bg-green-600 rounded hover:bg-green-700'
            onClick={handleResume}
          >
            Tiếp tục
          </button>
          <button
            className='px-3 py-1 bg-red-600 rounded hover:bg-red-700'
            onClick={handlePause}
          >
            Tạm dừng
          </button>
          <button
            className='px-3 py-1 bg-red-600 rounded hover:bg-red-700'
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
