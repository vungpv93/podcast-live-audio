import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';

interface IMic {
  isMicOn: boolean,
  localStream?: MediaStream,
  handleMic: () => Promise<void>
}

export function useMic(): IMic {
  const [isMicOn, setIsMicOn] = useState<boolean>(false);
  const [localStream, setLocalStream] = useState<MediaStream>();
  
  const handleMic = useCallback(async (): Promise<void> => {
    if (isMicOn) {
      setIsMicOn(false);
      setLocalStream(undefined);
      return;
    }
    
    try {
      if (localStream) {
        const audioTracks: MediaStreamTrack[] = localStream.getAudioTracks();
        if (audioTracks.length > 0) {
          const newState: boolean = !audioTracks[ 0 ].enabled;
          audioTracks.forEach((track: MediaStreamTrack) => ( track.enabled = newState ));
          setIsMicOn(newState);
        }
        return;
      }
      
      const mediaStream: MediaStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      setLocalStream(mediaStream);
      setIsMicOn(true);
    } catch (e) {
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
            msg = 'Không thể sử dụng MICRO (có thể đang bị ứng dụng khác chiếm).';
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
  }, [localStream]);
  
  return { localStream, isMicOn, handleMic };
}