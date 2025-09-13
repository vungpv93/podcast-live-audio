import { Inject, Injectable } from '@nestjs/common';
import { IConsumeParams, IProduceParams } from './producer-consumer.interface';
import { Consumer, Producer } from 'mediasoup/node/lib/types';
import { MediasoupResource } from '../mediasoup.type';

@Injectable()
export class ProducerConsumerService {
  constructor(@Inject('RESOURCE') private resource: MediasoupResource) {}

  /**
   * @functionName createProducer
   * @param params
   */
  public async createProducer(params: IProduceParams): Promise<string> {
    const { kind, rtpParameters, transportId, peerId } = params;
    const transportData = this.resource.transports.get(transportId);
    if (!transportData) {
      throw new Error('Transport not found');
    }

    const producer: Producer = await transportData.produce({
      kind,
      rtpParameters,
      appData: { transportId: transportData.id, peerId: peerId },
    });
    this.resource.producers.set(producer.id, producer);
    return producer.id;
  }

  /**
   * @functionName createConsumer
   * @param params
   */
  public async createConsumer(params: IConsumeParams): Promise<any> {
    const { router, producerId, rtpCapabilities, transportId, peerId } = params;

    if (!router.canConsume({ producerId, rtpCapabilities })) {
      throw new Error(`Cannot consume producer ${producerId}`);
    }

    const transportData = this.resource.transports.get(transportId);
    if (!transportData) {
      throw new Error('Transport not found');
    }

    const consumer: Consumer = await transportData.consume({
      producerId,
      rtpCapabilities,
      paused: false,
      appData: { routerId: router.id, transportId: transportData.id, peerId: peerId },
    });

    this.resource.consumers.set(consumer.id, consumer);

    return {
      id: consumer.id,
      producerId: producerId,
      kind: consumer.kind,
      rtpParameters: consumer.rtpParameters,
    };
  }
}
