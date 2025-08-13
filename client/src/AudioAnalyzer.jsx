import React, { useState, useEffect, useRef } from 'react';
import AudioVisualizer from './AudioVisualizer';

function AudioAnalyzer({ audio }) {
  const [audioData, setAudioData] = useState(new Uint8Array(0));

  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const dataArrayRef = useRef(null);
  const sourceRef = useRef(null);
  const rafIdRef = useRef(null);

  const tick = () => {
    analyserRef.current.getByteTimeDomainData(dataArrayRef.current);
    setAudioData(new Uint8Array(dataArrayRef.current));
    rafIdRef.current = requestAnimationFrame(tick);
  };

  useEffect(() => {
    audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    analyserRef.current = audioContextRef.current.createAnalyser();
    dataArrayRef.current = new Uint8Array(analyserRef.current.frequencyBinCount);

    sourceRef.current = audioContextRef.current.createMediaStreamSource(audio);
    sourceRef.current.connect(analyserRef.current);

    rafIdRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafIdRef.current);
      analyserRef.current.disconnect();
      sourceRef.current.disconnect();
    };
  }, [audio]);

  return <AudioVisualizer audioData={audioData} />;
}

export default AudioAnalyzer;
