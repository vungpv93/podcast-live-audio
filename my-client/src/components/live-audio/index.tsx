import React from 'react';
import type { ILiveAudio } from '../../dto/live-audio';
import AudioAnalyzer from '../AudioAnalyzer';
import { useLiveAudio } from '../../hooks/useLiveAudio';
import { MicrophoneIcon } from '@heroicons/react/24/solid';

const Index: React.FC<ILiveAudio> = ({ roomId, socket }) => {
  const { audioStream, localStream, handleTestMic, joinRoom, leaveRoom, handlePause, handleResume } = useLiveAudio({
    roomId,
    socket
  });
  
  return (
    <section className='flex-[3] flex flex-col p-4 w-full'>
      
      <div className='relative w-full flex justify-center'>
        <AudioAnalyzer audioStream={localStream || audioStream || undefined} />
        <div className='absolute inset-0 flex items-center justify-center'>
          <button className='h-24 w-24 rounded-full flex items-center justify-center bg-blue-600'
                  onClick={handleTestMic}>
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
