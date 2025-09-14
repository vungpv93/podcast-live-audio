import { useState, useCallback, useEffect } from 'react';
import toast from 'react-hot-toast';

interface IMic {
  isMicOn: boolean;
  localStream?: MediaStream;
  handleMic: () => Promise<void>;
}

export function useMic(): IMic {
  const [isMicOn, setIsMicOn] = useState<boolean>(false);
  const [localStream, setLocalStream] = useState<MediaStream>();

  const initMic: () => Promise<void> = useCallback(async () => {
    try {
      const mediaStream: MediaStream =
        await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: false,
        });
      setLocalStream(mediaStream);
      setIsMicOn(true);
    } catch (e) {
      setIsMicOn(false);
      let msg = 'Không thể truy cập MICRO.';
      if (e instanceof DOMException) {
        switch (e.name) {
          case 'NotAllowedError':
            msg = 'Thiết bị của bạn đã từ chối cấp quyền MICRO.';
            break;
          case 'NotFoundError':
            msg = 'Không tìm thấy thiết bị MICRO.';
            break;
          case 'NotReadableError':
            msg =
              'Không thể sử dụng MICRO (có thể đang bị ứng dụng khác chiếm).';
            break;
          case 'SecurityError':
          case 'AbortError':
            msg = 'Truy cập micro bị chặn do lý do bảo mật.';
            break;
          default:
            msg = `Lỗi không xác định: ${e.message}`;
        }
      } else if (e instanceof Error) {
        msg = e.message;
      }
      toast.error(msg);
    }
  }, []);

  const handleMic: () => Promise<void> = useCallback(async () => {
    if (!localStream) {
      await initMic();
      return;
    }

    const audioTracks: MediaStreamTrack[] = localStream.getAudioTracks();
    if (audioTracks.length > 0) {
      const newState: boolean = !audioTracks[0].enabled;
      audioTracks.forEach((track) => (track.enabled = newState));
      setIsMicOn(newState);
    }
  }, [localStream, initMic]);

  useEffect(() => {
    initMic()
      .then((r) => console.log(r))
      .catch((e) => console.error(e));
  }, [initMic]);

  return { localStream, isMicOn, handleMic };
}
