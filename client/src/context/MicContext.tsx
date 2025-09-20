import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type Context,
} from 'react';

type MicContextType = {
  isMicOn: boolean;
  localStream?: MediaStream;
  handleRequestMic: () => Promise<void>;
  showMicPermissionModal: boolean;
  showMicErrorModal: boolean;
};

const MicContext: Context<MicContextType | undefined> = createContext<
  MicContextType | undefined
>(undefined);

export const MicProvider = ({ children }: { children: React.ReactNode }) => {
  const [isMicOn, setIsMicOn] = useState<boolean>(false);
  const [localStream, setLocalStream] = useState<MediaStream>();
  const [showMicPermissionModal, setShowMicPermissionModal] =
    useState<boolean>(false);
  const [showMicErrorModal, setShowMicErrorModal] = useState<boolean>(false);

  const handleRequestMic: () => Promise<void> =
    useCallback(async (): Promise<void> => {
      if (localStream) return;
      try {
        const mediaStream: MediaStream =
          await navigator.mediaDevices.getUserMedia({
            audio: true,
          });
        if (mediaStream) {
          setIsMicOn(true);
          setLocalStream(mediaStream);
          setIsMicOn(true);
          localStorage.setItem('micGranted', 'true');
          setShowMicPermissionModal(false);
          setShowMicErrorModal(false);
        } else {
          setShowMicErrorModal(true);
        }
      } catch (err) {
        console.error('Không lấy được micro:', err);
        setShowMicErrorModal(true);
        localStorage.removeItem('micGranted');
      }
    }, [localStream]);

  useEffect(() => {
    const micGranted = localStorage.getItem('micGranted');
    if (!micGranted) {
      setShowMicPermissionModal(true);
    } else {
      (async (): Promise<void> => {
        try {
          await handleRequestMic();
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (e) {
          setShowMicErrorModal(true);
        }
      })();
    }
  }, [handleRequestMic]);

  return (
    <MicContext.Provider
      value={{
        isMicOn,
        localStream: localStream,
        showMicPermissionModal,
        showMicErrorModal,
        handleRequestMic,
      }}
    >
      {children}

      {/* Modal hỏi quyền micro */}
      {showMicPermissionModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-50 transition-opacity duration-300">
          <div className="bg-gray-800 text-white rounded-2xl shadow-xl p-6 max-w-lg w-full">
            <h2 className="text-lg font-semibold mb-4">
              Yêu cầu quyền truy cập Micro trên thiết bị này
            </h2>
            <p className="text-sm mb-4">
              🎙 Ứng dụng cần quyền truy cập micro để bạn có thể tham gia và trò
              chuyện trong phòng live podcast.
            </p>
            <p className="text-sm mb-4">
              Vui lòng cho phép quyền micro để tiếp tục.
            </p>
            <div className="mt-6 flex justify-end space-x-2">
              <button
                onClick={handleRequestMic}
                className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 transition w-32 text-xs"
              >
                Đồng ý
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal lỗi micro */}
      {showMicErrorModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="bg-gray-800 rounded-xl p-6 shadow-lg w-80">
            <h2 className="text-lg font-semibold mb-4 text-red-700">
              Lỗi xin quyền truy cập micro
            </h2>
            <p className="text-red-700 text-sm">Không thể truy cập micro.</p>
            <p className="text-red-700 text-sm">Vui lòng kiểm tra thiết bị.</p>
            <div className="flex justify-end mt-4">
              <button
                onClick={() => setShowMicErrorModal(false)}
                className="px-4 py-2 rounded-lg bg-red-600 text-white transition w-32 text-xs"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </MicContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useMic: () => MicContextType = (): MicContextType => {
  const context: MicContextType | undefined = useContext(MicContext);
  if (!context) {
    throw new Error('useMic phải được dùng trong <MicProvider>');
  }
  return context;
};
