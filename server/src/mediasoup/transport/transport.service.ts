import { Inject, Injectable } from '@nestjs/common';
import { ITransportOptions } from './transport.interface';
import { Router, WebRtcTransport } from 'mediasoup/node/lib/types';
import { webRtcTransport_options } from '../media.config';
import { MediasoupResource } from '../mediasoup.type';
import { ResourcesService } from '../../resources/resources.service';

@Injectable()
export class TransportService {
  constructor(
    @Inject('RESOURCE') private resource: MediasoupResource,
    private readonly resourcesService: ResourcesService,
  ) {}

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
    const transport: WebRtcTransport = await router.createWebRtcTransport({
      ...webRtcTransport_options,
      appData: {
        peerId,
        direction: direction,
      },
    });

    this.resource.transports.set(transport.id, transport);

    const socketId = peerId;
    await this.resourcesService.initial(socketId);

    const temp = this.resource.sockets.get(socketId).transports;
    if (!temp.includes(transport.id)) {
      temp.push(transport.id);
    }

    return {
      id: transport.id,
      iceParameters: transport.iceParameters,
      iceCandidates: transport.iceCandidates,
      dtlsParameters: transport.dtlsParameters,
    };
  }
}
