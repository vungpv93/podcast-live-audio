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
import {
  AuthVerifiedDto,
  BeginLiveDto,
  EndLiveDto,
  ILiveBaseDto,
  LeaveDto,
  LiveDetailDto,
  LiveDto,
  LivePingDto,
  SubscribesDto,
} from './dto/live.dto';
import { RedisService } from '../mediasoup/redis.service';
import { InjectRepository } from '@nestjs/typeorm';
import { LiveProgramEntity, PersonalAccessTokensEntity } from '../entities';
import { Repository } from 'typeorm';
import { ERRCD } from '../constants/ERRCD.enum';
import { mediaCodecs } from '../mediasoup/media.config';
import { MediasoupService } from '../mediasoup/mediasoup.service';
import { Router, Worker } from 'mediasoup/node/lib/types';
import { Inject, Logger } from '@nestjs/common';
import { MediasoupResource } from '../mediasoup/mediasoup.type';
import * as moment from 'moment';
import { v4 as uuidv4 } from 'uuid';
import { CommentDelDto, CommentDto, CreateCommentDto, FakerCommentDto } from './dto/comment.dto';
import { MockComments } from '../mock/comments';
import { ResourcesService } from '../resources/resources.service';
import { SanctumService } from '../mediasoup/sanctum/sanctum.service';
import { CleanupService } from '../cleanup/cleanup.service';
import { LiveProgramStatus } from '../enums/live-program-status';
import { RecorderService } from '../mediasoup/recorder/recorder.service';
import { ClientService } from './client.service';

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
    private readonly sanctumService: SanctumService,
    private readonly mediasoupService: MediasoupService,
    private readonly transportService: TransportService,
    private readonly producerConsumerService: ProducerConsumerService,
    @InjectRepository(LiveProgramEntity) private readonly liveProgramRepo: Repository<LiveProgramEntity>,
    @InjectRepository(PersonalAccessTokensEntity) private readonly tokenRepo: Repository<PersonalAccessTokensEntity>,
    @Inject('RESOURCE') private resource: MediasoupResource,
    private readonly resourcesService: ResourcesService,
    private readonly cleanupService: CleanupService,
    private readonly recorderService: RecorderService,
    private readonly clientService: ClientService,
  ) {}

  afterInit() {
    this.logger.log(`Server initialized`);
    this.cleanupService.setServer(this.server);
  }

  public async handleConnection(client: Socket) {
    try {
      const token =
        (client.handshake.auth?.token as string) ||
        (client.handshake.query?.token as string) ||
        client.handshake.headers['authorization']?.toString().split(' ')[1];
      this.logger.log(`Client connected: ${client.id} - token: ${token}`);
      // TODO Can 1 buoc thuc hien verify token.
      const auth = await this.sanctumService.verify(token);
      this.logger.log(JSON.stringify(auth, null, 4), 'handleConnection -> auth');
      if (auth) {
        client.data.isAuthenticated = true;
        client.data.auth = { id: auth.authId, nickname: auth.nickname, guard: auth.type };
        await this.redisService.initial(client.id);
      } else {
        client.data.isAuthenticated = false;
        client.data.auth = null;
      }
    } catch (e) {
      client.data.isAuthenticated = false;
      client.data.auth = null;
    }
  }

  public async handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    const liveIds: string[] = await this.redisService.getAlive(client.id);
    await this.resourcesService.socketDisconnect(client.id);
    await this.redisService.destroy(client.id);
    for (const liveId of liveIds) {
      const count = await this.redisService.countSockets(liveId);
      this.server.to(liveId).emit('PARTICIPANTS_LEAVE', { liveId: liveId, socketId: client.id, count: count });
    }
  }

  /**
   * @param client
   * @param args
   */
  @SubscribeMessage('TEST_EVENT')
  public async handleTestEvent(@ConnectedSocket() client: Socket, @MessageBody() args: any): Promise<any> {
    this.logger.log(JSON.stringify({ clientId: client.id, ...args }), 'TEST_EVENT');
    const errcd: number | void = await this.clientService.validated(client);
    if (errcd) {
      return {
        timestamp: moment().format('YYYY-MM-DD HH:mm:ss'),
        evt: 'TEST_EVENT',
        status: false,
        errcd: errcd,
        data: null,
        args: args,
      };
    }
    return {
      timestamp: moment().format('YYYY-MM-DD HH:mm:ss'),
      evt: 'TEST_EVENT',
      status: true,
      errcd: null,
      data: null,
      args: args,
    };
  }

  /**
   * @param client
   * @param args
   */
  @SubscribeMessage('EVT_SUBMIT')
  public async handleTestEventSubmit(
    @ConnectedSocket() client: Socket,
    @MessageBody() args: ILiveBaseDto,
  ): Promise<any> {
    this.logger.log(JSON.stringify({ clientId: client.id, ...args }), 'EVT_SUBMIT');
    const { liveId } = args;
    client.to(liveId).emit('EVT_SUBMITTED', { key: 'test', value: 'demo' });
    return {
      timestamp: moment().format('YYYY-MM-DD HH:mm:ss'),
      evt: 'EVT_SUBMIT',
      status: true,
      errcd: null,
      data: null,
      args: args,
    };
  }

  /**
   * @param client
   * @param args
   */
  @SubscribeMessage('PING')
  public async handlePing(@ConnectedSocket() client: Socket, @MessageBody() args: LivePingDto): Promise<any> {
    this.logger.log(JSON.stringify({ clientId: client.id, ...args }), 'PING');
    if (client.id && client.data.auth.id && client.data.auth.guard === 'USER') {
      await this.redisService.refreshTtl(args.liveId, client.id, client.data.auth.id);
    }
    return {
      timestamp: moment().format('YYYY-MM-DD HH:mm:ss'),
      evt: 'PING',
      status: true,
      errcd: null,
      data: null,
      args: args,
    };
  }

  /**
   * @param client
   * @param args
   */
  @SubscribeMessage('SUBSCRIBES_LIVE')
  public async handleRoomSubscribes(
    @ConnectedSocket() client: Socket,
    @MessageBody() args: SubscribesDto,
  ): Promise<any> {
    this.logger.log(JSON.stringify({ clientId: client.id }, null, 2), 'SUBSCRIBES_LIVE');
    const errcd: number | void = await this.clientService.validated(client);
    if (errcd) {
      return {
        timestamp: moment().format('YYYY-MM-DD HH:mm:ss'),
        evt: 'SUBSCRIBES_LIVE',
        status: false,
        errcd: errcd,
        data: null,
        args: args,
      };
    }

    const { liveId } = args;
    await this.redisService.sockets(args.liveId, client.id);
    client.join(liveId);
    return {
      timestamp: moment().format('YYYY-MM-DD HH:mm:ss'),
      evt: 'SUBSCRIBES_LIVE',
      status: true,
      errcd: null,
      data: null,
    };
  }

  @SubscribeMessage('AUTH_VERIFIED')
  public async handleAuthVerified(
    @ConnectedSocket() client: Socket,
    @MessageBody() args: AuthVerifiedDto,
  ): Promise<any> {
    this.logger.log(JSON.stringify({ socketId: client.id }, null, 2), 'AUTH_VERIFIED');
    const errcd: number | void = await this.clientService.validated(client);
    if (errcd) {
      return {
        timestamp: moment().format('YYYY-MM-DD HH:mm:ss'),
        evt: 'AUTH_VERIFIED',
        status: false,
        errcd: errcd,
        data: null,
        args: args,
      };
    }

    const { liveId } = args;
    const entity: LiveProgramEntity = await this.liveProgramRepo.findOne({ where: { code: liveId } });
    if (!entity) {
      return {
        timestamp: moment().format('YYYY-MM-DD HH:mm:ss'),
        evt: 'AUTH_VERIFIED',
        status: false,
        errcd: ERRCD.E100102,
        data: {
          auth: null, // This is current user entity from mysql database
          entity: null, // This is live_programs entity from mysql database
        },
      };
    }

    this.logger.log(
      JSON.stringify(
        {
          socketId: client.id,
          auth: client.data.isAuthenticated ? client.data.auth : null,
          entity: entity,
        },
        null,
        2,
      ),
      'AUTH_VERIFIED',
    );
    return {
      timestamp: moment().format('YYYY-MM-DD HH:mm:ss'),
      evt: 'AUTH_VERIFIED',
      status: true,
      errcd: null,
      data: {
        auth: client.data.isAuthenticated ? client.data.auth : null, // This is current user entity from mysql database
        entity: entity, // This is live_programs entity from mysql database
      },
    };
  }

  /**
   * @param client
   * @param args
   */
  @SubscribeMessage('LIVE_DETAIL')
  public async handleRoomLiveStatus(
    @ConnectedSocket() client: Socket,
    @MessageBody() args: LiveDetailDto,
  ): Promise<any> {
    this.logger.log(JSON.stringify({ client: client.id, ...args, auth: client.data?.auth }, null, 2), 'LIVE_DETAIL');
    const errcd: number | void = await this.clientService.validated(client);
    if (errcd) {
      return {
        timestamp: moment().format('YYYY-MM-DD HH:mm:ss'),
        evt: 'LIVE_DETAIL',
        status: false,
        errcd: errcd,
        data: null,
        args: args,
      };
    }

    const { liveId } = args;
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
  public async handleRoomBeginLive(@ConnectedSocket() client: Socket, @MessageBody() args: BeginLiveDto): Promise<any> {
    this.logger.log(JSON.stringify({ client: client.id, ...args }, null, 2), 'BEGIN_LIVE');
    const errcd: number | void = await this.clientService.validated(client);
    if (errcd) {
      return {
        timestamp: moment().format('YYYY-MM-DD HH:mm:ss'),
        evt: 'BEGIN_LIVE',
        status: false,
        errcd: errcd,
        data: null,
        args: args,
      };
    }

    const { liveId } = args;

    // 1. Kiểm tra trạng thái live trong Redis trước
    const entity: LiveProgramEntity = await this.liveProgramRepo.findOne({ where: { code: liveId } });
    if (!entity) {
      return {
        timestamp: moment().format('YYYY-MM-DD HH:mm:ss'),
        evt: 'BEGIN_LIVE',
        status: false,
        errcd: ERRCD.E100102,
        data: null,
        args: args,
      };
    }

    if (entity.status === LiveProgramStatus.Finished) {
      return {
        timestamp: moment().format('YYYY-MM-DD HH:mm:ss'),
        evt: 'BEGIN_LIVE',
        status: false,
        errcd: ERRCD.E100105,
        data: null,
        args: args,
      };
    }

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
    if (entity) {
      const liveAt = moment().format('YYYY-MM-DD HH:mm:ss');
      await this.liveProgramRepo.update(entity.id, { status: LiveProgramStatus.Ongoing, live_at: liveAt });
    }

    // 4. Luu trang thai live trong redis
    await this.redisService.beginLive(liveId, router);

    // 5. Thong bao cho tat ca client trong phong live biet phien live da bat dau
    this.server.to(liveId).emit('STARTED_LIVE', { liveId: liveId });

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
  public async handleLiveEnded(@ConnectedSocket() client: Socket, @MessageBody() args: EndLiveDto): Promise<any> {
    this.logger.log(JSON.stringify({ client: client.id, ...args }, null, 2), 'END_LIVE');
    const errcd: number | void = await this.clientService.validated(client);
    if (errcd) {
      return {
        timestamp: moment().format('YYYY-MM-DD HH:mm:ss'),
        evt: 'END_LIVE',
        status: false,
        errcd: errcd,
        data: null,
        args: args,
      };
    }

    const { liveId } = args;
    const realtime_total_comments: number = await this.redisService.countComment(liveId);
    const realtime_total_participants: number = await this.redisService.countParticipants(liveId);

    const count = {
      realtime_total_comments: realtime_total_comments,
      realtime_total_participants: realtime_total_participants,
    };
    this.logger.log(JSON.stringify({ count: count }, null, 2), 'END_LIVE');

    const entity: LiveProgramEntity = await this.liveProgramRepo.findOne({ where: { code: liveId } });
    if (entity)
      await this.liveProgramRepo.update(entity.id, {
        status: LiveProgramStatus.Finished,
        realtime_total_participants: realtime_total_participants ?? 0,
        realtime_total_comments: realtime_total_comments ?? 0,
      });

    const liveRedis = await this.redisService.getLive(liveId);
    const routerId = liveRedis?.routerId;
    if (routerId) {
      const router: Router = this.resource.routers.get(routerId);
      if (router) {
        router.observer.on('close', () => {
          this.logger.log(`Router ${router.id} closed`);
        });
        router.close();
        this.resource.routers.delete(routerId);
        this.logger.log(`Router ${router.id} for live ${liveId} closed and removed from resources`);
      }
    }
    // TODO Can cap nhat lai Redis #liveId::status: 'ended'
    await this.redisService.endLive(liveId);

    // Thong bao cho tat ca client trong phong live biet phien live da ket thuc
    this.server.to(liveId).emit('ENDED_LIVE', { liveId });
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
    this.logger.log(JSON.stringify({ clientId: client.id }, null, 2), `JOIN_LIVE`);
    const errcd: number | void = await this.clientService.validated(client);
    if (errcd) {
      return {
        timestamp: moment().format('YYYY-MM-DD HH:mm:ss'),
        evt: 'JOIN_LIVE',
        status: false,
        errcd: errcd,
        data: null,
        args: args,
      };
    }

    const { liveId, peerId } = args;

    const liveRedis = await this.redisService.getLive(liveId);
    const routerId = liveRedis?.routerId;

    let router: Router;
    if (routerId) {
      router = this.resource.routers.get(routerId);
    }

    if (!router) {
      this.logger.error(`Router not found for liveId ${liveId}`);
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

    const sendTransportOptions = await this.transportService.createWebRtcTransport(router, liveId, peerId, 'send');
    const recvTransportOptions = await this.transportService.createWebRtcTransport(router, liveId, peerId, 'recv');

    const producers = [];
    for (const producer of this.resource.producers.values()) {
      producers.push({
        producerId: producer.id,
        kind: producer.kind,
      });
    }

    this.logger.log('========================================================================================');
    if (client.data.auth.guard === 'USER' && client.data.auth.id) {
      await this.redisService.join(liveId, client.id, client.data.auth.id);
      // Thông báo trong liveId có thêm 1 người tham gia mới.
      const count: number = await this.redisService.countSockets(liveId);
      const participant = {
        socketId: client.id,
        authId: client.data.auth.id,
        nickname: client.data.auth.nickname,
      };
      this.server.to(liveId).emit('PARTICIPANTS_UPDATED', { liveId: liveId, participants: { count, participant } });
    }
    this.logger.log('========================================================================================');

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

  @SubscribeMessage('LEAVE')
  public async handleLeaveRoom(@ConnectedSocket() client: Socket, @MessageBody() args: LeaveDto) {
    this.logger.log(JSON.stringify({ clientId: client.id, ...args }, null, 2), `LEAVE`);
    const liveIds: string[] = await this.redisService.getAlive(client.id);
    await this.resourcesService.socketDisconnect(client.id);
    await this.redisService.destroy(client.id);
    for (const liveId of liveIds) {
      const count = await this.redisService.countSockets(liveId);
      this.server.to(liveId).emit('PARTICIPANTS_LEAVE', { liveId: liveId, socketId: client.id, count: count });
    }
    return {
      timestamp: moment().format('YYYY-MM-DD HH:mm:ss'),
      evt: 'LEAVE',
      status: true,
      errcd: null,
      data: null,
    };
  }

  // produce | EVT_PRODUCE
  @SubscribeMessage('EVT_PRODUCE')
  public async handleProduce(@MessageBody() data, @ConnectedSocket() client: Socket) {
    this.logger.log(JSON.stringify({ clientId: client.id, ...data }, null, 2), `EVT_PRODUCE`);
    const errcd: number | void = await this.clientService.validated(client);
    if (errcd) {
      return {
        timestamp: moment().format('YYYY-MM-DD HH:mm:ss'),
        evt: 'EVT_PRODUCE',
        status: false,
        errcd: errcd,
        data: null,
        args: data,
      };
    }

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
      this.logger.log(JSON.stringify({ liveId: liveId }, null, 2), 'EVENT -> NEW_PRODUCER');

      return { producerId };
    } catch (error) {
      this.logger.error(error);
      client.emit('produce-error', { error: error.message });
    }
  }

  // consume | EVT_CONSUME
  @SubscribeMessage('EVT_CONSUME')
  public async handleConsume(@MessageBody() data, @ConnectedSocket() client: Socket) {
    this.logger.log(JSON.stringify({ clientId: client.id, ...data }, null, 2), `EVT_CONSUME`);

    const errcd: number | void = await this.clientService.validated(client);
    if (errcd) {
      return {
        timestamp: moment().format('YYYY-MM-DD HH:mm:ss'),
        evt: 'EVT_PRODUCE',
        status: false,
        errcd: errcd,
        data: null,
        args: data,
      };
    }

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
    this.logger.log(JSON.stringify({ clientId: client }, null, 2), 'RESOURCES');
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

    const sockets = Array.from(this.resource?.sockets?.entries() ?? []).map(([key, data]) => {
      return { socketId: key, data: data };
    });

    return {
      evt: 'RESOURCES',
      status: true,
      errcd: null,
      data: { workers, routers, transports, producers, consumers, sockets },
    };
  }

  @SubscribeMessage('CONNECT_TRANSPORT')
  public async handleConnectTransportLive(@MessageBody() data: any, @ConnectedSocket() client: Socket) {
    this.logger.log(JSON.stringify({ ...data, client: client.id }, null, 2), 'CONNECT_TRANSPORT');

    const errcd: number | void = await this.clientService.validated(client);
    if (errcd) {
      return {
        timestamp: moment().format('YYYY-MM-DD HH:mm:ss'),
        evt: 'CONNECT_TRANSPORT',
        status: false,
        errcd: errcd,
        data: null,
        args: data,
      };
    }

    // TODO Xu ly connect transport

    const transport = this.resource.transports.get(data.transportId);
    this.logger.log(
      JSON.stringify(
        {
          id: transport.id,
          appData: transport.appData,
        },
        null,
        2,
      ),
      'The transport found is',
    );
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
    this.logger.log(JSON.stringify({ id: transport.id }, null, 2), 'transport connected');

    return {
      timestamp: moment().format('YYYY-MM-DD HH:mm:ss'),
      evt: 'CONNECT_TRANSPORT',
      status: true,
      errcd: null,
      data: { connected: true },
      args: data,
    };
  }

  /**
   * @functionName emitLiveRestored
   * @param liveId
   * @description Thong bao cho tat ca client trong phong liveId biet phien live da duoc khoi phuc
   * @event RESTORED_LIVE
   */
  public async emitLiveRestored(liveId: string): Promise<void> {
    this.server.to(liveId).emit('RESTORED_LIVE', liveId);
  }

  /**
   * =========================================================================
   * Comments feature
   * =========================================================================
   */
  /**
   * @param client
   * @param args
   * @functionName handleComments
   * @description Lay danh sach comment trong live
   */
  @SubscribeMessage('EVT_COMMENTS')
  public async handleComments(@ConnectedSocket() client: Socket, @MessageBody() args: CommentDto): Promise<any> {
    this.logger.log(JSON.stringify({ client: client.id, ...args }, null, 2), 'EVT_COMMENTS');

    const errcd: number | void = await this.clientService.validated(client);
    if (errcd) {
      return {
        timestamp: moment().format('YYYY-MM-DD HH:mm:ss'),
        evt: 'EVT_COMMENTS',
        status: false,
        errcd: errcd,
        data: null,
        args: args,
      };
    }

    const comments = await this.redisService.getComments(args.liveId || null, args.cursor ?? undefined);

    return {
      timestamp: moment().format('YYYY-MM-DD HH:mm:ss'),
      evt: 'EVT_COMMENTS',
      status: true,
      errcd: null,
      data: { comments },
      args: args,
    };
  }

  @SubscribeMessage('EVT_COMMENTS_CREATE')
  public async handleCreateComments(
    @ConnectedSocket() client: Socket,
    @MessageBody() args: CreateCommentDto,
  ): Promise<any> {
    this.logger.log(JSON.stringify({ clientId: client.id, ...args }, null, 2), 'EVT_COMMENTS_CREATE');

    const errcd: number | void = await this.clientService.validated(client);
    if (errcd) {
      return {
        timestamp: moment().format('YYYY-MM-DD HH:mm:ss'),
        evt: 'EVT_COMMENTS_CREATE',
        status: false,
        errcd: errcd,
        data: null,
        args: args,
      };
    }

    const score: number = Date.now() * 1000 + Math.floor(Math.random() * 1000);

    if (client.data.isAuthenticated !== true || !client.data.auth) {
      return {
        timestamp: moment().format('YYYY-MM-DD HH:mm:ss'),
        evt: 'EVT_COMMENTS_CREATE',
        status: false,
        errcd: ERRCD.E900401,
        data: null,
        args: args,
      };
    }

    if (client.data.auth.guard === 'USER' && client.data.auth.id) {
      return {
        timestamp: moment().format('YYYY-MM-DD HH:mm:ss'),
        evt: 'EVT_COMMENTS_CREATE',
        status: false,
        errcd: ERRCD.E900403,
        data: null,
        args: args,
      };
    }

    const object = {
      id: uuidv4(),
      content: args.content,
      userId: client.data.auth.id,
      user: {
        id: client.data.auth.id,
        nickname: client.data.auth.nickname || 'NA',
      },
      status: 1, // 1 | 0
      createdAt: moment().format('YYYY-MM-DD HH:mm:ss'),
      score: score,
    };

    await this.redisService.storeComment(args.liveId, score, object);

    this.server.to(args.liveId).emit('EVT_COMMENTS_CREATED', object);
    return {
      timestamp: moment().format('YYYY-MM-DD HH:mm:ss'),
      evt: 'EVT_COMMENTS_CREATE',
      status: true,
      errcd: null,
      data: null,
      args: args,
    };
  }

  @SubscribeMessage('EVT_COMMENTS_UPDATE')
  public async handleUpdateComments(@ConnectedSocket() client: Socket, @MessageBody() args: LiveDto): Promise<any> {
    this.logger.log(JSON.stringify({ clientId: client.id, ...args }, null, 2), 'EVT_COMMENTS_UPDATE');

    const errcd: number | void = await this.clientService.validated(client);
    if (errcd) {
      return {
        timestamp: moment().format('YYYY-MM-DD HH:mm:ss'),
        evt: 'EVT_COMMENTS_UPDATE',
        status: false,
        errcd: errcd,
        data: null,
        args: args,
      };
    }

    this.server.to(args.liveId).emit('EVT_COMMENTS_UPDATED', args);
    return {
      timestamp: moment().format('YYYY-MM-DD HH:mm:ss'),
      evt: 'EVT_COMMENTS_UPDATE',
      status: true,
      errcd: null,
      data: null,
      args: args,
    };
  }

  @SubscribeMessage('EVT_COMMENTS_DELETE')
  public async handleDeleteComments(
    @ConnectedSocket() client: Socket,
    @MessageBody() args: CommentDelDto,
  ): Promise<any> {
    this.logger.log(JSON.stringify({ clientId: client.id, ...args }, null, 2), 'EVT_COMMENTS_DELETED');

    const errcd: number | void = await this.clientService.validated(client);
    if (errcd) {
      return {
        timestamp: moment().format('YYYY-MM-DD HH:mm:ss'),
        evt: 'EVT_COMMENTS_DELETE',
        status: false,
        errcd: errcd,
        data: null,
        args: args,
      };
    }

    await this.redisService.deleteComment(args.liveId, args.score);

    this.server.to(args.liveId).emit('EVT_COMMENTS_DELETED', args);
    return {
      timestamp: moment().format('YYYY-MM-DD HH:mm:ss'),
      evt: 'EVT_COMMENTS_DELETE',
      status: true,
      errcd: null,
      data: null,
      args: args,
    };
  }

  @SubscribeMessage('EVT_FAKER_COMMENTS')
  public async handleFakerComments(
    @ConnectedSocket() client: Socket,
    @MessageBody() args: FakerCommentDto,
  ): Promise<any> {
    this.logger.log(JSON.stringify({ clientId: client.id, ...args }, null, 2), 'EVT_FAKER_COMMENTS');
    if (args.liveId) {
      const start = new Date();
      start.setHours(start.getHours() - 2);
      const currentTime = new Date(start.getTime());

      for (const comment of MockComments) {
        const step = Math.floor(Math.random() * (10 - 5 + 1)) + 5;
        currentTime.setSeconds(currentTime.getSeconds() + step);
        const createdAtDate = new Date(currentTime.getTime());
        const score: number = currentTime.getTime() * 1000 + Math.floor(Math.random() * 1000);

        const object = {
          id: uuidv4(),
          content: comment,
          userId: 187,
          user: { id: 187, nickname: 'VungPV' },
          status: 1, // 1 | 0
          createdAt: moment(createdAtDate).format('YYYY-MM-DD HH:mm:ss'),
          score: score,
        };

        await this.redisService.storeComment(args.liveId, score, object);
      }
    }

    return {
      timestamp: moment().format('YYYY-MM-DD HH:mm:ss'),
      evt: 'EVT_FAKER_COMMENTS',
      status: true,
      errcd: null,
      data: null,
      args: args,
    };
  }

  /**
   * =========================================================================
   *              SocketId, UserId , AdminId trong 1 liveId
   * =========================================================================
   */
  @SubscribeMessage('EVT_GET_SOCKETS')
  public async handleGetSocketIds(@ConnectedSocket() client: Socket, @MessageBody() args: ILiveBaseDto): Promise<any> {
    this.logger.log(JSON.stringify({ clientId: client.id, ...args }, null, 2), 'EVT_GET_SOCKETS');

    const errcd: number | void = await this.clientService.validated(client);
    if (errcd) {
      return {
        timestamp: moment().format('YYYY-MM-DD HH:mm:ss'),
        evt: 'EVT_GET_SOCKETS',
        status: false,
        errcd: errcd,
        data: null,
        args: args,
      };
    }

    const sockets: { socketId: string; userId: number }[] = await this.redisService.getSockets(args.liveId);

    return {
      timestamp: moment().format('YYYY-MM-DD HH:mm:ss'),
      evt: 'EVT_GET_SOCKETS',
      status: true,
      errcd: null,
      data: { sockets },
      args: args,
    };
  }

  @SubscribeMessage('EVT_COUNT_SOCKETS')
  public async handleCountSocket(@ConnectedSocket() client: Socket, @MessageBody() args: ILiveBaseDto): Promise<any> {
    this.logger.log(JSON.stringify({ clientId: client.id, ...args }, null, 2), 'EVT_COUNT_SOCKETS');

    const errcd: number | void = await this.clientService.validated(client);
    if (errcd) {
      return {
        timestamp: moment().format('YYYY-MM-DD HH:mm:ss'),
        evt: 'EVT_COUNT_SOCKETS',
        status: false,
        errcd: errcd,
        data: null,
        args: args,
      };
    }

    const count: number = await this.redisService.countSockets(args.liveId);

    return {
      timestamp: moment().format('YYYY-MM-DD HH:mm:ss'),
      evt: 'EVT_COUNT_SOCKETS',
      status: true,
      errcd: null,
      data: { count },
      args: args,
    };
  }

  @SubscribeMessage('MIX_TRACK')
  public async handleMixTrack(@ConnectedSocket() client: Socket, @MessageBody() args: ILiveBaseDto): Promise<any> {
    this.logger.log(JSON.stringify({ clientId: client.id, ...args }, null, 2), 'MIX_TRACK');

    const errcd: number | void = await this.clientService.validated(client);
    if (errcd) {
      return {
        timestamp: moment().format('YYYY-MM-DD HH:mm:ss'),
        evt: 'MIX_TRACK',
        status: false,
        errcd: errcd,
        data: null,
        args: args,
      };
    }

    await this.recorderService.mixTracks(args.liveId);
    return {
      timestamp: moment().format('YYYY-MM-DD HH:mm:ss'),
      evt: 'MIX_TRACK',
      status: true,
      errcd: null,
      data: null,
      args: args,
    };
  }

  @SubscribeMessage('SFTP_UPLOAD')
  public async handleSftpUpload(@ConnectedSocket() client: Socket, @MessageBody() args: ILiveBaseDto): Promise<any> {
    this.logger.log(JSON.stringify({ clientId: client.id, ...args }, null, 2), 'SFTP_UPLOAD');

    const errcd: number | void = await this.clientService.validated(client);
    if (errcd) {
      return {
        timestamp: moment().format('YYYY-MM-DD HH:mm:ss'),
        evt: 'SFTP_UPLOAD',
        status: false,
        errcd: errcd,
        data: null,
        args: args,
      };
    }

    await this.recorderService.uploadSftp(args.liveId);
    return {
      timestamp: moment().format('YYYY-MM-DD HH:mm:ss'),
      evt: 'SFTP_UPLOAD',
      status: true,
      errcd: null,
      data: null,
      args: args,
    };
  }

  @SubscribeMessage('CALL_WEBHOOK')
  public async handleCallWebhook(@ConnectedSocket() client: Socket, @MessageBody() args: ILiveBaseDto): Promise<any> {
    this.logger.log(JSON.stringify({ clientId: client.id, ...args }, null, 2), 'CALL_WEBHOOK');

    const errcd: number | void = await this.clientService.validated(client);
    if (errcd) {
      return {
        timestamp: moment().format('YYYY-MM-DD HH:mm:ss'),
        evt: 'CALL_WEBHOOK',
        status: false,
        errcd: errcd,
        data: null,
        args: args,
      };
    }

    await this.recorderService.webhook(args.liveId);
    return {
      timestamp: moment().format('YYYY-MM-DD HH:mm:ss'),
      evt: 'CALL_WEBHOOK',
      status: true,
      errcd: null,
      data: null,
      args: args,
    };
  }
}
