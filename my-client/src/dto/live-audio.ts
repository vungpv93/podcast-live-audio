import type { Socket } from 'socket.io-client';

export type ConsumerKind = 'audio' | 'video';

export interface ILiveAudio {
  roomId: string;
  socket?: Socket;
  localStream?: MediaStream;
  auth?: IUser;
}

export type UserRole = 'host' | 'guest';

export interface IUser {
  id: number;
  nickname: string;
  role: UserRole;
}

export type IAuth = IUser;
