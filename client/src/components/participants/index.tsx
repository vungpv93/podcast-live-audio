import React from 'react';
import { participants } from '../../mock/participants.ts';

const Participants: React.FC = () => {
  return (
    <aside className="flex-[1] bg-gray-800 p-4 flex flex-col">
      <h2 className="font-semibold mb-2">Participants</h2>
      <div className="flex-1 overflow-y-auto mb-2 space-y-2">
        <ul className="space-y-2">
          {participants.map((p, index) => (
            <li
              key={`participants::${index}`}
              className="flex items-center p-2 bg-gray-700 rounded"
            >
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold mr-2">
                {p.name.charAt(0).toUpperCase()}
              </div>
              <span>{p.name}</span>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
};

export default Participants;
