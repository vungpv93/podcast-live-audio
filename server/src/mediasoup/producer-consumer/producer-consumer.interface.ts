import { RtpParameters, RtpCapabilities, Router } from 'mediasoup/node/lib/types';

export interface IProduceParams {
  liveId: string;
  roomId: string;
  peerId: string;
  kind: 'audio' | 'video';
  rtpParameters: RtpParameters;
  transportId: string;
}

export interface IConsumeParams {
  router: Router;
  liveId: string;
  roomId: string;
  peerId: string;
  producerId: string;
  rtpCapabilities: RtpCapabilities;
  transportId: string;
}
