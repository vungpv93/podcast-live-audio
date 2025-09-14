import React from 'react';

const NotFound: React.FC = () => {
  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      <main className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-red-500">404</h1>
          <h2 className="text-2xl font-semibold mt-2">Trang không tồn tại</h2>
          <p className="text-gray-400 mt-2">Có vẻ như bạn đã đi lạc... 🧐</p>
        </div>
      </main>
    </div>
  );
};

export default NotFound;
