import React, { useEffect } from 'react';
import type { ILiveAudio } from '../../dto/live-audio.ts';
import { useParticipants } from '../../hooks/useParticipants.ts';
import { HiUserGroup } from 'react-icons/hi';
import Skeleton from '../../components/skeleton';

const Participants: React.FC<ILiveAudio> = ({ liveId, socket }) => {
  const { isReady, sockets, count } = useParticipants({
    liveId,
    socket,
  });

  useEffect(() => {
    console.log({ isReady, sockets });
  }, [isReady, sockets]);

  if (!isReady) {
    return (
      <aside className="flex-[1] bg-gray-800 p-4 flex flex-col">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold mb-2">Participants</h2>
        </div>
        <div className="flex-1 overflow-y-auto mb-2 space-y-2">
          <Skeleton lines={5} />
        </div>
      </aside>
    );
  }

  return (
    <aside className="flex-[1] bg-gray-800 p-4 flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <h2 className="font-semibold mb-2">Participants</h2>
        <span className="text-sm text-red-500 font-bold">
          {count ?? 0} Online
        </span>
      </div>
      <div className="flex-1 overflow-y-auto mb-2 space-y-2">
        {sockets?.length > 0 ? (
          <ul className="space-y-2">
            {sockets?.map((p, index) => (
              <li
                key={`participants::${p.socketId}-${index}`}
                className="flex items-center p-2 bg-gray-700 rounded"
              >
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold mr-2">
                  {String(p.nickname ?? p.userId)
                    .charAt(0)
                    .toUpperCase()}
                </div>
                <span>{p.nickname ?? p.userId}</span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-red-500">
            <HiUserGroup size={64} className="m-4" />
            <span className="text-sm">Chưa có ai tham gia</span>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Participants;
