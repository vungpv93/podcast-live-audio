import type { Socket } from 'socket.io-client';

export type ConsumerKind = 'audio' | 'video';

export interface ILiveAudio {
  roomId: string;
  socket?: Socket;
  localStream?: MediaStream;
}