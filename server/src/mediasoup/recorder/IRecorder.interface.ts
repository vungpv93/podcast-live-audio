export interface IRecorder {
  producerId: string;
  joinedAt: number;
  delay?: number;
}

export type IRecorders = IRecorder[];

export interface ILiveRecorder {
  liveId: string;
  recoders: IRecorders | null;
}
