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

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    // Tạo analyser cho mỗi track
    const analysers: AnalyserNode[] = [];
    const sources: MediaStreamAudioSourceNode[] = [];
    audioStream.getTracks().forEach((track) => {
      const trackStream = new MediaStream([track]);
      const source = audioCtx.createMediaStreamSource(trackStream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);
      analysers.push(analyser);
      sources.push(source);
    });

    const bufferLength = analysers[0]?.frequencyBinCount || 1024;
    const dataArrays: Uint8Array[] = analysers.map(
      () => new Uint8Array(bufferLength),
    );

    const draw = () => {
      requestAnimationFrame(draw);
      ctx.fillStyle = '#1f2937'; // bg-gray-800
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      let silentFlg: boolean = true;
      analysers.forEach((analyser, idx) => {
        let x = 0;
        const dataArray = dataArrays[idx];
        analyser.getByteTimeDomainData(dataArrays[idx]);
        const avg: number =
          dataArray.reduce((sum, v): number => sum + Math.abs(v - 128), 0) /
          dataArray.length;
        if (avg >= 2) {
          silentFlg = false;
          ctx.lineWidth = 2;
          ctx.strokeStyle = '#3b82f6';
          ctx.beginPath();

          const sliceWidth = canvas.width / bufferLength;
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
        }
      });

      if (silentFlg) drawSilentLine();
    };

    draw();

    return () => {
      sources.forEach((s) => s.disconnect());
      analysers.forEach((a) => a.disconnect());
      audioCtx.close();
    };
  }, [audioStream]);

  return (
    <canvas
      ref={canvasRef}
      width={512}
      height={256}
      className="rounded bg-gray-700 w-full"
    />
  );
};

export default Index;
