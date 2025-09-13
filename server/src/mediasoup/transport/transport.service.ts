import { Inject, Injectable } from '@nestjs/common';
import { ITransportOptions } from './transport.interface';
import { Router, WebRtcTransport } from 'mediasoup/node/lib/types';
import { webRtcTransport_options } from '../media.config';
import { MediasoupResource } from '../mediasoup.type';

@Injectable()
export class TransportService {
  constructor(@Inject('RESOURCE') private resource: MediasoupResource) {}

  /**
   * @functionName createWebRtcTransport
   * @param router
   * @param peerId
   * @param direction
   */
  public async createWebRtcTransport(
    router: Router,
    peerId: string,
    direction: 'send' | 'recv',
  ): Promise<ITransportOptions> {
    console.log(`webRtcTransport_options`, { router, peerId, direction });
    const transport: WebRtcTransport = await router.createWebRtcTransport({
      ...webRtcTransport_options,
      appData: {
        peerId,
        direction: direction,
      },
    });

    this.resource.transports.set(transport.id, transport);

    return {
      id: transport.id,
      iceParameters: transport.iceParameters,
      iceCandidates: transport.iceCandidates,
      dtlsParameters: transport.dtlsParameters,
    };
  }
}
