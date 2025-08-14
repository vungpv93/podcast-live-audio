import React, { type RefObject, useEffect, useRef } from 'react';

interface Props {
  audioStream?: MediaStream;
}

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}

const Index: React.FC<Props> = ({ audioStream }: Props) => {
  const canvasRef: RefObject<HTMLCanvasElement | null> =
    useRef<HTMLCanvasElement | null>(null);

  const drawSilentLine: () => void = (): void => {
    const canvas: HTMLCanvasElement | null = canvasRef.current;
    if (!canvas) return;
    const ctx: CanvasRenderingContext2D | null = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#1f2937'; // bg-gray-800
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.lineWidth = 2;
    ctx.strokeStyle = '#3b82f6'; // blue-500
    ctx.beginPath();
    ctx.moveTo(0, canvas.height / 2);
    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();
  };

  useEffect((): (() => void) | undefined => {
    if (!audioStream || !canvasRef.current) {
      drawSilentLine();
      return;
    }

    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const analyser: AnalyserNode = audioCtx.createAnalyser();
    const source: MediaStreamAudioSourceNode =
      audioCtx.createMediaStreamSource(audioStream);
    source.connect(analyser);

    analyser.fftSize = 2048;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      requestAnimationFrame(draw);
      analyser.getByteTimeDomainData(dataArray);

      ctx.fillStyle = '#1f2937'; // bg-gray-800
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.lineWidth = 2;
      ctx.strokeStyle = '#3b82f6'; // blue-500
      ctx.beginPath();

      const sliceWidth = canvas.width / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * canvas.height) / 2;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
        x += sliceWidth;
      }

      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();
    };

    draw();

    return () => {
      source.disconnect();
      analyser.disconnect();
      audioCtx.close();
    };
  }, [audioStream]);

  return (
    <canvas
      ref={canvasRef}
      width={512}
      height={128}
      className="rounded mb-4 bg-gray-700"
    />
  );
};

export default Index;
