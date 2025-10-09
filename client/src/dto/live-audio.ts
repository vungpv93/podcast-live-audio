import type { Socket } from 'socket.io-client';

export type ConsumerKind = 'audio' | 'video';

export interface ILiveAudio {
  liveId: string;
  socket?: Socket;
  localStream?: MediaStream;
  auth?: IUser;
  entity?: ILiveEntity;
  volume?: number;
  isMicEnabled?: boolean;
}

export type UserGuard = 'ADMIN' | 'USER';
export type UserRole = 'host' | 'guest';

export interface IUser {
  id: number;
  nickname: string;
  guard: UserGuard;
  role?: UserRole;
}

export type IAuth = IUser;

export interface ILiveEntity {
  id: number;
  code: string;
  name: string;
  image: string;
  status: string;
  scheduled_at: string;
  live_at: string;
  recorder_flag: number;
  deleted_at: string;
}
