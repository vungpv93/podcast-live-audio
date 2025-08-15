import { useState, useCallback } from 'react';

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
          const newState: boolean = !audioTracks[0].enabled;
          audioTracks.forEach((track: MediaStreamTrack) => ( track.enabled = newState ));
          setIsMicOn(newState);
        }
        return;
      }
      
      const mediaStream: MediaStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      setLocalStream(mediaStream);
      setIsMicOn(true);
    } catch (e) {
    }
  }, [localStream]);
  
  return { localStream, isMicOn, handleMic };
}