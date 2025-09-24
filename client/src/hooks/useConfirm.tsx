import React, { useState, useCallback } from 'react';
import { HiCheckCircle } from 'react-icons/hi2';

interface IStep {
  number: number;
  name: string;
  status: number;
}

type ISteps = IStep[];

export function useConfirm() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState<React.ReactNode>(null);
  const [title, setTitle] = useState<string>('Xác nhận');
  const [steps, setSteps] = useState<ISteps>([]);
  const [resolver, setResolver] = useState<((v?: boolean) => void) | null>(
    null,
  );

  const confirm = useCallback(
    (msg: React.ReactNode, options?: { title?: string; steps?: ISteps }) => {
      setIsOpen(true);
      setTitle(options?.title || 'Xác nhận');
      setMessage(msg);
      if (options?.steps) setSteps(options?.steps);
      return new Promise<boolean>((resolve) => {
        setResolver(() => resolve);
      });
    },
    [],
  );

  const updateStepStatus = useCallback(
    (stepNumber: number, newStatus: number) => {
      setSteps((prev) =>
        prev.map((s) =>
          s.number === stepNumber ? { ...s, status: newStatus } : s,
        ),
      );
    },
    [],
  );

  const handleNo = useCallback(() => {
    setIsOpen(false);
    setResolver(null);
  }, []);

  const handleYes: () => void = useCallback((): void => {
    if (resolver) resolver(true);
    setResolver(null);
  }, [resolver]);

  const ConfirmModal = () =>
    isOpen ? (
      <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-50 transition-opacity duration-300">
        <div className="bg-gray-800 text-white rounded-2xl shadow-xl p-6 max-w-lg w-full">
          <h2 className="text-xl font-semibold mb-3">{title}</h2>
          <div className="text-gray-300 text-sm">{message}</div>

          <div className="text-gray-300 text-xs py-3">
            <ul>
              {steps &&
                steps.map((obj, index) => {
                  let cls = `text-gray-500`;
                  switch (obj.status) {
                    case 1:
                      cls = `text-blue-500`;
                      break;
                    case 2:
                      cls = `text-green-500`;
                      break;
                    default:
                      cls = `text-gray-500`;
                      break;
                  }
                  return (
                    <li
                      key={`key::${obj.number}-${index}`}
                      className="flex items-center space-x-2 py-[2px]"
                    >
                      <HiCheckCircle size={24} className={cls} />
                      <span>{obj.name}</span>
                    </li>
                  );
                })}
            </ul>
          </div>
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

  return { confirm, ConfirmModal, setIsOpen, setSteps, updateStepStatus };
}
