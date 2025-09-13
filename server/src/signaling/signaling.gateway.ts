import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JoinChannelDto } from './dto/join-channel.dto';
import { TransportService } from 'src/mediasoup/transport/transport.service';
import { ProducerConsumerService } from 'src/mediasoup/producer-consumer/producer-consumer.service';
import { LiveDto } from './dto/live.dto';
import { RedisService } from '../mediasoup/redis.service';
import { InjectRepository } from '@nestjs/typeorm';
import { LiveProgramEntity } from '../entities';
import { Repository } from 'typeorm';
import { ERRCD } from '../constants/ERRCD.enum';
import { mediaCodecs } from '../mediasoup/media.config';
import { MediasoupService } from '../mediasoup/mediasoup.service';
import { Router, Worker } from 'mediasoup/node/lib/types';
import { Inject, Logger } from '@nestjs/common';
import { MediasoupResource } from '../mediasoup/mediasoup.type';
import * as moment from 'moment';

@WebSocketGateway({
  cors: {
    origin: true, // 'http://localhost:3000'
    credentials: true,
  },
})
export class SignalingGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  private readonly logger = new Logger(SignalingGateway.name);

  constructor(
    private readonly redisService: RedisService,
    private readonly mediasoupService: MediasoupService,
    private readonly transportService: TransportService,
    private readonly producerConsumerService: ProducerConsumerService,
    @InjectRepository(LiveProgramEntity) private readonly liveProgramRepo: Repository<LiveProgramEntity>,
    @Inject('RESOURCE') private resource: MediasoupResource,
  ) {}

  afterInit() {
    console.log(`Server initialized`);
  }

  handleConnection(client: Socket) {
    const token =
      (client.handshake.auth?.token as string) ||
      (client.handshake.query?.token as string) ||
      client.handshake.headers['authorization']?.toString().split(' ')[1];
    console.log(`Client connected: ${client.id} - token: ${token}`);
    // TODO Can 1 buoc thuc hien verify token.
    client.data.auth = { id: 1, nickname: 'VungPV', guard: 'ADM' };
  }

  async handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  /**
   * @param client
   * @param args
   */
  @SubscribeMessage('TEST_EVENT')
  public async handleTestEvent(@ConnectedSocket() client: Socket, @MessageBody() args: any): Promise<any> {
    console.log('TEST_EVENT : ', client.id);
    return {
      timestamp: moment().format('YYYY-MM-DD HH:mm:ss'),
      evt: 'TEST_EVENT',
      status: true,
      errcd: null,
      data: null,
      args,
    };
  }

  /**
   * @param client
   * @param args
   */
  @SubscribeMessage('SUBSCRIBES_LIVE')
  public async handleRoomSubscribes(@ConnectedSocket() client: Socket, @MessageBody() args: LiveDto): Promise<any> {
    this.logger.log('SUBSCRIBES_LIVE : ', client.id);
    client.join(args.roomId);
    return {
      timestamp: moment().format('YYYY-MM-DD HH:mm:ss'),
      evt: 'SUBSCRIBES_LIVE',
      status: true,
      errcd: null,
      data: null,
    };
  }

  /**
   * @param client
   * @param args
   */
  @SubscribeMessage('LIVE_DETAIL')
  public async handleRoomLiveStatus(@ConnectedSocket() client: Socket, @MessageBody() args: LiveDto): Promise<any> {
    console.log('LIVE_DETAIL : ', {
      liveId: args.liveId,
      client: client.id,
    });
    const liveId = args.liveId;
    const entity: LiveProgramEntity = await this.liveProgramRepo.findOne({ where: { code: liveId } });
    // const room = this.roomService.getRoom(liveId);
    const liveRedis = await this.redisService.getLive(liveId);
    let live = false;
    if (liveRedis) {
      if (this.resource.routers.get(liveRedis.routerId)) {
        live = true;
      }
    }

    const dataRes = {
      liveId: liveId,
      roomId: liveId, // TODO Can update lai vi khong can thiet
      live: live,
      entity: entity,
    };

    return {
      timestamp: moment().format('YYYY-MM-DD HH:mm:ss'),
      evt: 'LIVE_DETAIL',
      status: true,
      errcd: null,
      data: dataRes,
    };
  }

  /**
   * @param client
   * @param args
   * 1. Kiểm tra trạng thái live trong Redis trước
   * 2. Tao mediasoup router
   * 3. Cap nhat trang thai live trong db
   * 4. Luu trang thai live trong redis
   * 5. Thong bao cho tat ca client trong phong live biet phien live da bat dau
   * 6. Tra ve ket qua
   */
  @SubscribeMessage('BEGIN_LIVE')
  public async handleRoomBeginLive(@ConnectedSocket() client: Socket, @MessageBody() args: LiveDto): Promise<any> {
    const { liveId } = args;

    // 1. Kiểm tra trạng thái live trong Redis trước
    const liveRedis = await this.redisService.getLive(liveId);
    if (liveRedis) {
      return { evt: 'BEGIN_LIVE', status: false, errcd: ERRCD.E100101, data: null, args: args };
    }
    // 2. Tao mediasoup router
    const worker: Worker = this.mediasoupService.getWorker();
    const router: Router = await worker.createRouter({
      mediaCodecs,
      appData: { workerId: worker.pid, liveId: liveId },
    });

    this.resource.routers.set(router.id, router);

    // 3. Cap nhat trang thai live trong db
    const entity: LiveProgramEntity = await this.liveProgramRepo.findOne({ where: { code: liveId } });
    if (entity) await this.liveProgramRepo.update(entity.id, { status: 'ongoing' });

    // 4. Luu trang thai live trong redis
    await this.redisService.beginLive(liveId, router);

    // 5. Thong bao cho tat ca client trong phong live biet phien live da bat dau
    client.to(liveId).emit('STARTED_LIVE', { liveId: liveId });

    // 6. Tra ve ket qua
    return {
      timestamp: moment().format('YYYY-MM-DD HH:mm:ss'),
      evt: 'BEGIN_LIVE',
      status: true,
      errcd: null,
      data: null,
      args: args,
    };
  }

  @SubscribeMessage('END_LIVE')
  public async handleLiveEnded(@ConnectedSocket() client: Socket, @MessageBody() args: LiveDto): Promise<any> {
    const { liveId } = args;
    const entity: LiveProgramEntity = await this.liveProgramRepo.findOne({ where: { code: liveId } });
    if (entity) await this.liveProgramRepo.update(entity.id, { status: 'finished' });

    const liveRedis = await this.redisService.getLive(liveId);
    const routerId = liveRedis?.routerId;
    if (routerId) {
      const router = this.resource.routers.get(routerId);
      if (router) {
        router.observer.on('close', () => {
          console.log(`Router ${router.id} closed`);
        });
        // Đóng tất cả các transport, producer, consumer trong router
        // const closePromises: Promise<void>[] = [];
        // for (const transport of router.transports) {
        //   closePromises.push(
        //     (async () => {
        //       transport[1].observer.on('close', () => {
        //         console.log(`Transport ${transport[0]} closed`);
        //       });
        //       transport[1].close();
        //     })(),
        //   );
        // }
        // await Promise.all(closePromises);

        // Đóng router
        router.close();
        this.resource.routers.delete(routerId);
        console.log(`Router ${router.id} for live ${liveId} closed and removed from resources`);
      }
    }
    // TODO Can cap nhat lai Redis #liveId::status: 'ended'
    await this.redisService.endLive(liveId);

    // Thong bao cho tat ca client trong phong live biet phien live da ket thuc
    client.to(liveId).emit('ENDED_LIVE', { liveId });
    return {
      timestamp: moment().format('YYYY-MM-DD HH:mm:ss'),
      evt: 'END_LIVE',
      status: true,
      errcd: null,
      data: null,
      args: args,
    };
  }

  @SubscribeMessage('JOIN_LIVE')
  public async handleJoinLive(@MessageBody() args: JoinChannelDto, @ConnectedSocket() client: Socket) {
    console.log(`The handle event JOIN_LIVE : `, client.id);

    const { liveId, peerId } = args;
    const entity: LiveProgramEntity = await this.liveProgramRepo.findOne({ where: { code: liveId } });
    if (entity) await this.liveProgramRepo.update(entity.id, { status: 'finished' });

    const liveRedis = await this.redisService.getLive(liveId);
    const routerId = liveRedis?.routerId;

    let router: Router;
    if (routerId) {
      router = this.resource.routers.get(routerId);
    }

    if (!router) {
      console.error(`Router not found for liveId ${liveId}`);
      return {
        timestamp: moment().format('YYYY-MM-DD HH:mm:ss'),
        evt: 'JOIN_LIVE',
        status: false,
        errcd: ERRCD.E100102,
        data: {
          rtpCapabilities: null,
          sendTransportOptions: null,
          recvTransportOptions: null,
        },
        args: args,
      };
    }

    const sendTransportOptions = await this.transportService.createWebRtcTransport(router, peerId, 'send');
    const recvTransportOptions = await this.transportService.createWebRtcTransport(router, peerId, 'recv');

    const producers = [];
    for (const producer of this.resource.producers.values()) {
      producers.push({
        producerId: producer.id,
        kind: producer.kind,
      });
    }

    return {
      timestamp: moment().format('YYYY-MM-DD HH:mm:ss'),
      evt: 'JOIN_LIVE',
      status: true,
      errcd: null,
      data: {
        rtpCapabilities: router?.rtpCapabilities || null,
        sendTransportOptions: sendTransportOptions || null,
        recvTransportOptions: recvTransportOptions || null,
        producers: producers,
      },
      args: args,
    };
  }

  @SubscribeMessage('leave-room')
  public async handleLeaveRoom(@ConnectedSocket() client: Socket) {
    // for (const roomId of rooms) {
    //   if (roomId !== client.id) {
    //     const room = this.roomService.getRoom(roomId);
    //     if (room) {
    //       const peer = room.peers.get(client.id);
    //       if (peer) {
    //         // Close all producers
    //         for (const producer of peer.producers.values()) {
    //           producer.producer.close();
    //         }
    //         // Close all consumers
    //         for (const consumer of peer.consumers.values()) {
    //           consumer.consumer.close();
    //         }
    //         // Close all transports
    //         for (const transport of peer.transports.values()) {
    //           transport.transport.close();
    //         }
    //         room.peers.delete(client.id);
    //       }
    //       client.leave(roomId);
    //       client.to(roomId).emit('peer-left', { peerId: client.id });
    //       if (room.peers.size === 0) {
    //         this.roomService.removeRoom(roomId);
    //       }
    //     }
    //   }
    // }
    return {
      timestamp: moment().format('YYYY-MM-DD HH:mm:ss'),
      evt: 'LEAVE_LIVE',
      status: true,
      errcd: null,
      data: null,
    };
  }

  // produce | EVT_PRODUCE
  @SubscribeMessage('EVT_PRODUCE')
  public async handleProduce(@MessageBody() data, @ConnectedSocket() client: Socket) {
    const { liveId, roomId, peerId, kind, transportId, rtpParameters } = data;

    try {
      const producerId = await this.producerConsumerService.createProducer({
        liveId,
        roomId,
        peerId,
        transportId,
        kind,
        rtpParameters,
      });

      // Thong bao cho tat ca client trong phong liveId co producer moi
      client.to(liveId).emit('NEW_PRODUCER', { producerId, peerId, kind });

      return { producerId };
    } catch (error) {
      console.error(error);
      client.emit('produce-error', { error: error.message });
    }
  }

  // consume | EVT_CONSUME
  @SubscribeMessage('EVT_CONSUME')
  public async handleConsume(@MessageBody() data, @ConnectedSocket() client: Socket) {
    const { roomId, liveId, peerId, producerId, rtpCapabilities, transportId } = data;
    try {
      const liveRedis = await this.redisService.getLive(liveId);
      const routerId = liveRedis?.routerId;
      const router: Router = this.resource.routers.get(routerId);

      const consumerData = await this.producerConsumerService.createConsumer({
        router,
        liveId,
        roomId,
        peerId,
        transportId,
        producerId,
        rtpCapabilities,
      });

      return {
        consumerData,
      };
    } catch (error) {
      console.error(error);
      client.emit('consume-error', { error: error.message });
    }
  }

  @SubscribeMessage('RESOURCES')
  public async resources(@ConnectedSocket() client: Socket) {
    console.log('>> RESOURCES >> ', client.id);
    const workers = Array.from(this.resource?.workers?.entries() ?? []).map(([id, worker]) => {
      return { id, pid: worker.pid, closed: worker.closed };
    });

    const routers = Array.from(this.resource?.routers?.entries() ?? []).map(([id, router]) => {
      return { id: id, closed: router.closed, appData: router.appData };
    });

    const transports = Array.from(this.resource?.transports?.entries() ?? []).map(([id, transport]) => {
      return { id: id, closed: transport.closed, appData: transport.appData };
    });

    const producers = Array.from(this.resource?.producers?.entries() ?? []).map(([id, producer]) => {
      return { id: id, closed: producer.closed, appData: producer.appData };
    });

    const consumers = Array.from(this.resource?.consumers?.entries() ?? []).map(([id, consumer]) => {
      return { id: id, closed: consumer.closed, appData: consumer.appData };
    });

    return {
      evt: 'RESOURCES',
      status: true,
      errcd: null,
      data: { workers, routers, transports, producers, consumers },
    };
  }

  @SubscribeMessage('CONNECT_TRANSPORT')
  public async handleConnectTransportLive(@MessageBody() data: any, @ConnectedSocket() client: Socket) {
    console.log('The data is CONNECT_TRANSPORT ', { ...data, client: client.id });
    // TODO Xu ly connect transport

    const transport = this.resource.transports.get(data.transportId);
    console.log('The transport found is: ', transport);
    if (!transport) {
      return {
        timestamp: moment().format('YYYY-MM-DD HH:mm:ss'),
        evt: 'CONNECT_TRANSPORT',
        status: false,
        errcd: ERRCD.E100103,
        data: { connected: false },
        args: data,
      };
    }
    await transport.connect({ dtlsParameters: data.dtlsParameters });
    console.log('>> transport connected', transport.id);

    return {
      timestamp: moment().format('YYYY-MM-DD HH:mm:ss'),
      evt: 'CONNECT_TRANSPORT',
      status: true,
      errcd: null,
      data: { connected: true },
      args: data,
    };
  }

  public async emitLiveRestored(liveId: string): Promise<void> {
    this.server.to(liveId).emit('LIVE_RESTORED', liveId);
  }
}
