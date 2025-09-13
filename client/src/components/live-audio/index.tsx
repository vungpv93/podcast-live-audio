import React, { useState } from 'react';
import type { ILiveAudio } from '../../dto/live-audio';
import AudioAnalyzer from '../AudioAnalyzer';
import { useLiveAudio } from '../../hooks/useLiveAudio';
import { useMic } from '../../hooks/useMic.ts';
import { useLive } from '../../hooks/useLive.ts';
import { HiStatusOnline } from 'react-icons/hi';
import { HiPlay } from 'react-icons/hi2';
import { BsMicFill, BsMicMuteFill } from 'react-icons/bs';
import Volume from '../Volume';

const Index: React.FC<ILiveAudio> = ({ roomId, socket, auth }) => {
  console.log('auth is ', auth);
  const [volume, setVolume] = useState<number>(80);
  const { isMicOn, handleMic, localStream } = useMic();
  const { liveData, handleLive } = useLive({ roomId, socket });

  const { audioStream, joinRoom } = useLiveAudio({
    roomId,
    socket,
    localStream,
  });

  return (
    <section className="flex-[3] flex flex-col p-4 w-full">
      <div className="relative w-full flex justify-center">
        <AudioAnalyzer audioStream={localStream || audioStream || undefined} />
        <div className="absolute inset-0 flex items-center justify-center">
          <button
            className={`h-24 w-24 rounded-full flex items-center justify-center border-0 focus:outline-none focus:ring-0 hover:bg-none hover:shadow-none hover:outline-none ${isMicOn ? 'bg-red-600' : 'bg-gray-600'}`}
            onClick={handleMic}
          >
            {isMicOn ? (
              <BsMicFill className="h-16 w-16 opacity-70" />
            ) : (
              <BsMicMuteFill className="h-16 w-16 opacity-70" />
            )}
          </button>
        </div>
      </div>

      <div className="flex my-4 items-center justify-between bg-gray-800 p-2 rounded mb-4 shadow-md w-full">
        <div>
          {liveData && liveData?.live ? (
            <>
              <button className="text-sm bg-red-600 hover:bg-red-700">
                <HiStatusOnline />
              </button>
              &nbsp;&nbsp;
              <button className="px-2 py-1 text-sm bg-red-600 rounded hover:bg-green-700">
                Kết thúc
              </button>
            </>
          ) : (
            <button
              className="px-2 py-1 text-sm bg-green-600 rounded hover:bg-green-700"
              onClick={handleLive}
            >
              Bắt đầu live
            </button>
          )}
        </div>

        <div className="flex space-x-2 align-center">
          {/*<button className="px-2 py-1 text-sm bg-green-600 rounded hover:bg-green-700">*/}
          {/*  <HiPause />*/}
          {/*</button>*/}
          <button className="px-2 py-1 text-sm bg-green-600 rounded hover:bg-green-700">
            <HiPlay />
          </button>
          <button className="px-2 py-1 text-sm bg-green-600 rounded hover:bg-green-700">
            <Volume value={volume} onChange={(v) => setVolume(v)} />
          </button>
          <button
            className="px-2 py-1 text-sm bg-green-600 rounded"
            onClick={joinRoom}
          >
            Join live
          </button>
        </div>
      </div>
    </section>
  );
};

export default Index;
