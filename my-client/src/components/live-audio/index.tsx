import React, { useState } from 'react';
import type { ILiveAudio } from '../../dto/live-audio';
import AudioAnalyzer from '../AudioAnalyzer';
import { useLiveAudio } from '../../hooks/useLiveAudio';
import { MicrophoneIcon } from '@heroicons/react/24/solid';
import { useMic } from '../../hooks/useMic.ts';
import { useLive } from '../../hooks/useLive.ts';

const Index: React.FC<ILiveAudio> = ({ roomId, socket, auth }) => {
  const { isMicOn, handleMic, localStream } = useMic();
  const { liveData, handleLive } = useLive({ roomId, socket });

  const { audioStream, joinRoom, leaveRoom, handlePause, handleResume } =
    useLiveAudio({
      roomId,
      socket,
      localStream,
    });

  const [isJoined, setIsJoined] = useState<boolean>(false);

  return (
    <section className="flex-[3] flex flex-col p-4 w-full">
      <div className="relative w-full flex justify-center">
        <AudioAnalyzer audioStream={localStream || audioStream || undefined} />
        <div className="absolute inset-0 flex items-center justify-center">
          <button
            className={`h-24 w-24 rounded-full flex items-center justify-center border-0 focus:outline-none focus:ring-0 hover:bg-none hover:shadow-none hover:outline-none ${isMicOn ? 'bg-red-600' : 'bg-gray-600'}`}
            onClick={handleMic}
          >
            <MicrophoneIcon className="h-16 w-16 opacity-70" />
          </button>
        </div>
      </div>

      <div className="flex my-4 items-center justify-between bg-gray-800 p-2 rounded mb-4 shadow-md w-full">
        <div>
          {liveData && liveData?.live ? (
            <button className="px-3 py-1 bg-red-600 rounded hover:bg-green-700">
              Đang live
            </button>
          ) : (
            <button
              className="px-3 py-1 bg-green-600 rounded hover:bg-green-700"
              onClick={async () => {
                handleLive();
                await joinRoom();
                setIsJoined(true);
              }}
            >
              Bắt đầu live
            </button>
          )}
        </div>
        <div className="flex space-x-2 align-center">
          {liveData.live && (
            <>
              {auth?.role === 'host' ? (
                <>
                  {!isJoined ? (
                    <button
                      className={`px-3 py-1 bg-green-600 rounded`}
                      onClick={async () => {
                        await joinRoom();
                        setIsJoined(true);
                      }}
                    >
                      Join live
                    </button>
                  ) : (
                    <button
                      disabled={true}
                      className={`px-3 py-1 bg-gray-600 rounded disabled:bg-gray-400 disabled:cursor-not-allowed`}
                    >
                      Đã join
                    </button>
                  )}
                </>
              ) : (
                <button
                  className="px-3 py-1 bg-green-600 rounded"
                  onClick={joinRoom}
                >
                  Nghe live audio
                </button>
              )}
            </>
          )}

          <button
            className="px-3 py-1 bg-green-600 rounded hover:bg-green-700 hidden"
            onClick={handleResume}
          >
            Tiếp tục
          </button>
          <button
            className="px-3 py-1 bg-red-600 rounded hover:bg-red-700 hidden"
            onClick={handlePause}
          >
            Tạm dừng
          </button>
          <button
            className="px-3 py-1 bg-red-600 rounded hover:bg-red-700 hidden"
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
