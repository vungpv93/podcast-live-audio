import { Inject, Injectable, Logger } from '@nestjs/common';
import { MediasoupResource } from '../mediasoup/mediasoup.type';

@Injectable()
export class ResourcesService {
  private readonly logger = new Logger(ResourcesService.name);

  constructor(@Inject('RESOURCE') private resource: MediasoupResource) {}

  public async testing(): Promise<void> {
    console.log('testing');
  }

  /**
   * @functionName initial
   * @param socketId
   */
  public async initial(socketId: string): Promise<void> {
    if (!this.resource.sockets.has(socketId)) {
      this.resource.sockets.set(socketId, { transports: [], producers: [], consumers: [] });
    }
  }

  public async socketDisconnect(socketId: string): Promise<void> {
    this.logger.log(`ResourcesService@socketDisconnect: ${socketId}`);

    if (this.resource.sockets.has(socketId)) {
      const sockets = this.resource.sockets.get(socketId);
      this.logger.log(`ResourcesService@socketDisconnect: `, sockets);
      const { transports, producers, consumers } = sockets;

      for (const id of consumers) {
        console.log(`ConsumerId is `, id);
        if (this.resource.consumers.has(id)) {
          this.resource.consumers.get(id)?.close();
          this.resource.consumers.delete(id);
        }
      }

      for (const id of producers) {
        console.log(`ProducerId is `, id);
        if (this.resource.producers.has(id)) {
          this.resource.producers.get(id)?.close();
          this.resource.producers.delete(id);
        }
      }

      for (const id of transports) {
        console.log(`TransportId is `, id);
        if (this.resource.transports.has(id)) {
          this.resource.transports.get(id)?.close();
          this.resource.transports.delete(id);
        }
      }

      this.resource.sockets.delete(socketId);
    }
  }
}
