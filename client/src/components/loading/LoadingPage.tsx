import React from 'react';

const LoadingPage: React.FC = () => {
  return (
    <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
      <div className="flex flex-col items-center space-y-4">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-lg font-medium">Đang tải dữ liệu...</p>
      </div>
    </div>
  );
};

export default LoadingPage;
