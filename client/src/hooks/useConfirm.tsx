import React, { useState, useCallback } from 'react';

export function useConfirm() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState<React.ReactNode>(null);
  const [title, setTitle] = useState<string>('Xác nhận');
  const [resolver, setResolver] = useState<((v?: boolean) => void) | null>(
    null,
  );

  const confirm = useCallback(
    (msg: React.ReactNode, options?: { title?: string }) => {
      setMessage(msg);
      setTitle(options?.title || 'Xác nhận');
      setIsOpen(true);

      return new Promise<boolean>((resolve) => {
        setResolver(() => resolve);
      });
    },
    [],
  );

  const handleNo = useCallback(() => {
    setIsOpen(false);
    setResolver(null);
  }, []);

  const handleYes = useCallback(() => {
    setIsOpen(false);
    if (resolver) resolver(true);
    setResolver(null);
  }, [resolver]);

  const ConfirmModal = () =>
    isOpen ? (
      <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-50 transition-opacity duration-300">
        <div className="bg-gray-800 text-white rounded-2xl shadow-xl p-6 max-w-lg w-full">
          <h2 className="text-xl font-semibold mb-3">{title}</h2>
          <div className="text-gray-300">{message}</div>
          <div className="mt-6 flex justify-end space-x-2">
            <button
              onClick={handleNo}
              className="px-4 py-2 rounded-lg bg-gray-600 hover:bg-gray-700 transition w-32 text-xs"
            >
              No
            </button>
            <button
              onClick={handleYes}
              className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 transition w-32 text-xs"
            >
              Yes
            </button>
          </div>
        </div>
      </div>
    ) : null;

  return { confirm, ConfirmModal };
}
