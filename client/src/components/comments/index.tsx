import React, { useEffect, useState, useRef } from 'react';
import type { ILiveAudio } from '../../dto/live-audio.ts';
import { type IComment, useComment } from '../../hooks/useComment.ts';
import { timeAgo } from '../../utils';

const Comments: React.FC<ILiveAudio> = ({ liveId, socket, auth }) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [openActionId, setOpenActionId] = useState<IComment | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<IComment | null>(null);

  const { isReady, comments, pagination, handleLoadMore, handleDel } =
    useComment({
      liveId,
      socket,
    });

  const toggleActionMenu = (comment: IComment) => {
    setOpenActionId((prev) => (prev?.id === comment.id ? null : comment));
  };
  console.log('isReady ', isReady, auth);

  useEffect(() => {
    console.log(`The comment is `, comments);
  }, [comments]);

  console.log('delete ', confirmDelete);

  return (
    <aside className="flex-[2] bg-gray-800 p-4 flex flex-col">
      <h2 className="font-semibold mb-2">Comments</h2>
      {comments.length ? (
        <div className="flex-1 overflow-y-auto mb-2 space-y-2">
          {/* Example Comment */}
          {comments.map((comment) => (
            <div
              key={`CommentKey::${comment.id}`}
              className="flex items-start p-2 bg-gray-700 rounded space-x-2"
              data-cid={comment.id}
              data-cursor={comment.score}
            >
              <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                {comment.user?.nickname?.charAt(0) ?? 'N'}
              </div>

              <div className="flex-1 flex flex-col">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white">
                    {comment.user?.nickname || 'NA'}
                  </span>
                  <span className="text-gray-400 text-xs ml-2">
                    {timeAgo(comment.createdAt)}
                  </span>
                  {/*<span className="text-gray-400 text-xs ml-2">2h ago</span>*/}
                </div>
                <p className="text-gray-200 text-sm mt-1">{comment.content}</p>
              </div>

              <div
                className="flex-shrink-0 flex items-center relative"
                ref={menuRef}
              >
                <span
                  className={'cursor-pointer'}
                  onClick={() => toggleActionMenu(comment)}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-gray-300 hover:text-white"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M10 6a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4z" />
                  </svg>
                </span>

                {openActionId?.id === comment.id && (
                  <div className="absolute right-0 top-full mt-1 w-40 bg-gray-800 rounded shadow-lg z-10">
                    <ul>
                      <li
                        className="px-3 py-2 cursor-pointer text-red-700 font-bold"
                        onClick={() => {
                          console.log('blloo ', openActionId);
                          setConfirmDelete(openActionId);
                          setOpenActionId(null);
                        }}
                      >
                        Xóa
                      </li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ))}
          {pagination?.hasMore ? (
            <div className="flex justify-center pb-4" onClick={handleLoadMore}>
              <button className="px-2 py-1 text-sm w-48 mt-2 bg-green-800 hover:bg-green-800 text-white rounded-lg">
                Xem thêm
              </button>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-full text-gray-400 text-sm">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-10 w-10 mb-2 text-gray-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8 10h.01M12 10h.01M16 10h.01M21 16.5V6a2 2 0 00-2-2H5a2 2 0 00-2 2v10.5a2 2 0 002 2h14a2 2 0 002-2z"
            />
          </svg>
          Chưa có bình luận nào.
        </div>
      )}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20">
          <div className="bg-gray-800 p-6 rounded-lg w-80">
            <h2 className="text-red-500 font-bold mb-4 ">Xác nhận</h2>
            <p className="text-red-500 mb-6 text-sm">
              Bạn có chắc chắn muốn xoá bình luận này không?
            </p>
            <div className="flex justify-end space-x-2">
              <button
                className="px-3 py-1 bg-gray-600 rounded text-white  text-sm"
                onClick={() => setConfirmDelete(null)}
              >
                Huỷ
              </button>
              <button
                className="px-3 py-1 bg-red-600 rounded text-white text-sm"
                onClick={async (): Promise<void> => {
                  await handleDel(confirmDelete);
                  setConfirmDelete(null);
                }}
              >
                Xoá
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};

export default Comments;
