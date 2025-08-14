import React from 'react';
import { comments } from '../../mock/comments.ts';

const Comments: React.FC = () => {
  return (
    <aside className="flex-[2] bg-gray-800 p-4 flex flex-col">
      <h2 className="font-semibold mb-2">Comments</h2>
      <div className="flex-1 overflow-y-auto mb-2 space-y-2">
        {/* Example Comment */}
        {comments.map((comment) => (
          <div
            key={`CommentKey::${comment.id}`}
            className="flex items-start p-2 bg-gray-700 rounded space-x-2"
          >
            {/* Cột 1: Avatar */}
            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold flex-shrink-0">
              U
            </div>

            {/* Cột 2: Nội dung comment */}
            <div className="flex-1 flex flex-col">
              {/* Username + thời gian */}
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white">
                  {comment.user.name}
                </span>
                <span className="text-gray-400 text-xs ml-2">2h ago</span>
              </div>
              {/* Nội dung comment */}
              <p className="text-gray-200 text-sm mt-1">{comment.message}</p>
            </div>

            {/* Cột 3: Action icon */}
            <div className="flex-shrink-0 flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4z" />
              </svg>
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
};

export default Comments;
