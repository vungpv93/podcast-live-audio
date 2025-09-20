import React, { useState, useEffect, useMemo } from 'react';
import type { ILiveAudio } from '../../dto/live-audio';
import AudioAnalyzer from '../AudioAnalyzer';
import { useLiveAudio } from '../../hooks/useLiveAudio';
import { useLive } from '../../hooks/useLive.ts';
import { HiStatusOffline, HiStatusOnline } from 'react-icons/hi';
import { HiPlay } from 'react-icons/hi2';
import { BsMicFill, BsMicMuteFill } from 'react-icons/bs';
import Volume from '../Volume';
import { useConfirm } from '../../hooks/useConfirm.tsx';
import moment from 'moment';
import { useMic } from '../../context/MicContext.tsx';

const Index: React.FC<ILiveAudio> = ({ roomId, socket, auth, entity }) => {
  console.log('auth is ', auth);
  const [volume, setVolume] = useState<number>(80);
  const { isMicOn, localStream } = useMic();
  const { liveData, handleLive, closeLive } = useLive({ roomId, socket });
  const { audioStream, joinRoom } = useLiveAudio({
    roomId,
    socket,
    localStream,
  });

  useEffect(() => {
    console.log('Live data updated: ', liveData);
  }, [liveData]);

  const { confirm, ConfirmModal } = useConfirm();
  const handleEndLive: () => Promise<void> = async (): Promise<void> => {
    const ok = await confirm(
      'Bạn có chắc muốn kết thúc phiên live podcast này không?',
      {
        title: 'Kết thúc phiên live podcast',
      },
    );

    if (ok) {
      console.log('Đang thực hiện kết thúc phiên live podcast...');
      // await new Promise((res) => setTimeout(res, 3000));
      await closeLive();
      console.log('Phiên live podcast đã kết thúc ✅');
    }
  };

  const handleStartLive = async () => {
    const result = await confirm('Bạn có chắc chắn muốn bắt đầu phiên live?', {
      title: 'Xác nhận bắt đầu',
    });

    if (result) {
      await handleLive();
    }
  };

  useEffect(() => {
    console.log('DEBUG : Live Audio');
    if (socket?.id && roomId && liveData.live)
      joinRoom()
        .then((response) => console.log(`AUTO JOIN_LIVE `, response))
        .catch((err) => console.error('AUTO JOIN_LIVE:', err));
  }, [socket, roomId, liveData.live, joinRoom]);

  const isDisabled = useMemo(() => {
    return !liveData?.entity?.status || liveData?.entity?.status === 'finished';
  }, [liveData]);

  return (
    <section className="flex-[3] flex flex-col p-4 w-full">
      <div
        className="flex justify-between items-center p-4 mb-4 text-sm text-blue-800 border border-blue-300 rounded-lg bg-blue-50 dark:bg-gray-800 dark:text-blue-400 dark:border-blue-800"
        role="alert"
      >
        <span className="font-semibold">🎙️ {entity?.name}</span>
        <span className="text-xs text-blue-800 dark:text-gray-300">
          {moment(entity?.live_at || entity?.scheduled_at).format(
            'YYYY-MM-DD HH:mm',
          )}
        </span>
      </div>

      {liveData?.entity?.status === 'ongoing' && (
        <div
          className="flex items-center p-4 mb-4 text-sm text-green-800 border border-green-300 rounded-lg bg-green-50 dark:bg-gray-800 dark:text-green-400 dark:border-green-800"
          role="alert"
        >
          <svg
            className="flex-shrink-0 inline w-4 h-4 me-3"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M16.707 5.293a1 1 0 0 0-1.414 0L9 11.586 6.707 9.293a1 1 0 0 0-1.414 1.414l3 3a1 1 0 0 0 1.414 0l7-7a1 1 0 0 0 0-1.414Z" />
          </svg>
          <span className="sr-only"></span>
          <div>Phiên live podcast đang được diễn ra.</div>
        </div>
      )}

      {liveData?.entity?.status === 'finished' && (
        <div
          className="flex items-center p-4 mb-4 text-sm text-red-800 border border-red-300 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400 dark:border-red-800"
          role="alert"
        >
          <svg
            className="flex-shrink-0 inline w-4 h-4 me-3"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm1 14.5H9v-2h2Zm0-4H9V5h2Z" />
          </svg>
          <span className="sr-only"></span>
          <div>Phiên live podcast đã kết thúc.</div>
        </div>
      )}

      <div className="relative w-full flex justify-center">
        <AudioAnalyzer
          audioStream={audioStream || undefined}
          localStream={localStream || undefined}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <button
            className={`h-24 w-24 rounded-full flex items-center justify-center border-0 focus:outline-none focus:ring-0 hover:bg-none hover:shadow-none hover:outline-none ${isMicOn ? 'bg-red-600' : 'bg-gray-600'}`}
            // onClick={handleRequestMic}
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
              <button
                className="px-2 py-1 text-sm bg-red-600 rounded hover:bg-red-600 w-32"
                onClick={handleEndLive}
              >
                Kết thúc
              </button>
            </>
          ) : (
            <button
              className={`px-2 py-1 text-sm bg-green-600 rounded hover:bg-green-700 w-32 ${isDisabled ? 'disabled:bg-gray-500 disabled:cursor-not-allowed disabled:hover:bg-gray-500' : ''}`}
              onClick={handleStartLive}
              disabled={isDisabled}
            >
              Bắt đầu live
            </button>
          )}
        </div>

        <div className="flex space-x-2 align-center">
          <button className="px-2 py-1 text-sm bg-green-600 rounded hover:bg-green-700">
            <HiPlay />
          </button>
          <button className="px-2 py-1 text-sm bg-green-600 rounded hover:bg-green-700">
            <Volume value={volume} onChange={(v) => setVolume(v)} />
          </button>
          <button
            className={`text-sm bg-red-600 hover:bg-red-700 ${liveData && liveData?.live ? '' : 'disabled:bg-gray-500 disabled:cursor-not-allowed disabled:hover:bg-gray-500'}`}
            disabled={true}
          >
            {liveData && liveData?.live ? (
              <HiStatusOnline />
            ) : (
              <HiStatusOffline />
            )}
          </button>
        </div>
      </div>
      <ConfirmModal />
    </section>
  );
};

export default Index;
