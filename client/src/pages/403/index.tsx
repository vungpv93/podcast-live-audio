import React from 'react';
import { useParams } from 'react-router-dom';

const Forbidden: React.FC = () => {
  useParams<{ id: string }>();
  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      <main className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-red-500">403 - Forbidden</h1>
          <h2 className="text-2xl font-semibold mt-2">
            Bạn không có quyền truy cập hệ thống
          </h2>
          <p className="text-gray-400 mt-2">
            Vui lòng liên hệ với chúng ADMIN để được hỗ trợ. 🧐
          </p>
        </div>
      </main>
    </div>
  );
};

export default Forbidden;
