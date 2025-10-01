import { Injectable, Logger } from '@nestjs/common';
import { MediasoupService } from '../mediasoup.service';
import { Consumer, PlainTransport, Producer, Router } from 'mediasoup/node/lib/types';
import { spawn, ChildProcessWithoutNullStreams, exec } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as dgram from 'dgram';
import { RedisService } from '../redis.service';
import { IRecorders } from './IRecorder.interface';
import { ConfigService } from '@nestjs/config';
import * as SftpClient from 'ssh2-sftp-client';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class RecorderService {
  private readonly logger = new Logger(RecorderService.name);
  private sftp = new SftpClient();
  private recorders: Map<
    string,
    {
      ffmpeg: any;
      plainTransport: PlainTransport;
      consumer: Consumer;
      fileName: string;
    }
  > = new Map();

  constructor(
    private configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly mediasoupService: MediasoupService,
    private readonly redisService: RedisService,
  ) {}

  /**
   * @functionName getFreePort
   */
  public async getFreePort(): Promise<number> {
    return new Promise((resolve, reject) => {
      const socket = dgram.createSocket('udp4');
      socket.bind(0, () => {
        const address = socket.address();
        const port = (address as any).port;
        socket.close(() => resolve(port));
      });
      socket.on('error', (err) => reject(err));
    });
  }

  /**
   * @functionName generateSdp
   * @param consumer
   * @param rtpPort
   */
  public generateSdp(consumer: Consumer, rtpPort: number): string {
    const { rtpParameters } = consumer;
    const codec = rtpParameters.codecs[0];
    const payloadType = codec.payloadType;
    const clockRate = codec.clockRate;
    const channels = codec.channels || 2;

    const fmtpLine = Object.entries(codec.parameters || {})
      .map(([key, value]) => `${key}=${value}`)
      .join(';');

    return [
      'v=0',
      'o=- 0 0 IN IP4 127.0.0.1',
      's=MediasoupRecord',
      'c=IN IP4 127.0.0.1',
      't=0 0',
      `m=audio ${rtpPort} RTP/AVP ${payloadType}`,
      `a=rtpmap:${payloadType} ${codec.mimeType.split('/')[1]}/${clockRate}/${channels}`,
      fmtpLine ? `a=fmtp:${payloadType} ${fmtpLine}` : '',
      'a=sendonly',
    ]
      .filter(Boolean)
      .join('\n');
  }

  /**
   * @param liveId
   * @param router
   * @param producer
   * 1. Chọn port FFmpeg sẽ listen
   * 2. Tạo PlainTransport
   * 3. Consume producer
   * 4. Kết nối transport tới FFmpeg
   * 5. Tạo SDP file dựa trên consumer params
   * 6. File output
   * 7. Spawn FFmpeg
   * 8. Lưu vào recorders map
   */
  public async startRecording(liveId: string, router: Router, producer: Producer): Promise<void> {
    const logObject = {
      router: { id: router.id, closed: router.closed },
      producer: { id: producer.id, closed: producer.closed },
    };
    this.logger.log(JSON.stringify(logObject, null, 2), 'RecorderService -> startRecording');

    // Nếu thư mục chưa tồn tại thì tạo mới
    if (!fs.existsSync(path.resolve(`storage/${liveId}`))) {
      fs.mkdirSync(path.resolve(`storage/${liveId}`), { recursive: true });
      console.log('Thư mục mới đã được tạo:', path.resolve(`storage/${liveId}`));
    } else {
      console.log('Thư mục đã tồn tại:', path.resolve(`storage/${liveId}`));
    }

    // 1. Chọn port FFmpeg sẽ listen
    const rtpPort = await this.getFreePort();

    // 2. Tạo PlainTransport
    const plainTransport: PlainTransport = await router.createPlainTransport({
      listenIp: { ip: '0.0.0.0' },
      rtcpMux: true,
      comedia: false,
      appData: { liveId: liveId },
    });

    // 3. Consume producer
    const consumer: Consumer = await plainTransport.consume({
      producerId: producer.id,
      rtpCapabilities: router.rtpCapabilities,
      paused: false,
      appData: { liveId: liveId },
    });

    // 4. Kết nối transport tới FFmpeg
    await plainTransport.connect({ ip: '127.0.0.1', port: rtpPort });

    // 5. Tạo SDP file dựa trên consumer params
    const sdpContent = this.generateSdp(consumer, rtpPort);
    const sdpFile = path.resolve(`storage/${liveId}/${producer.id}.sdp`);
    fs.writeFileSync(sdpFile, sdpContent);

    // 6. File output
    const fName = path.resolve(`storage/${liveId}/${producer.id}.mp3`);

    // 7. Ghi vao Redis database
    await this.redisService.recorder(liveId, producer.id);

    // 8. Spawn FFmpeg
    const ffmpeg: ChildProcessWithoutNullStreams = spawn('ffmpeg', [
      '-protocol_whitelist',
      'file,udp,rtp',
      '-i',
      sdpFile,
      '-acodec',
      'libmp3lame',
      '-y',
      fName,
    ]);

    // 8.1 Lưu vào recorders map
    this.recorders.set(producer.id, { ffmpeg, plainTransport, consumer, fileName: fName });
    console.log(`Started recording producer ${producer.id} → ${fName}`);

    ffmpeg.stderr.on('data', (data) => {
      console.info(`DEBUG.FFmpeg.on(data) [${producer.id}]: ${data.toString()}`);
    });

    ffmpeg.on('exit', (code, signal) => {
      console.error(`DEBUG.FFmpeg.on(exit) [${producer.id}] exited with code=${code}, signal=${signal}`);
      this.recorders.delete(producer.id);
    });
  }

  /**
   * @functionName mixTracks
   * @param liveId
   */
  public async mixTracks(liveId: string): Promise<void> {
    this.logger.log(JSON.stringify({ liveId: liveId }, null, 2), 'RecorderService -> mixTracks');
    const producers: IRecorders = await this.redisService.recorders(liveId);
    this.logger.log(JSON.stringify(producers, null, 2), 'RecorderService -> mixTracks');

    // Tạo input arguments cho ffmpeg
    const inputs: string = producers
      .map((f) => `-i "${path.resolve(`storage/${liveId}/${f.producerId}.mp3`)}"`)
      .join(' ');

    const delays: string = producers
      .map((f, idx) => {
        const delayMs = 0; // giây -> mili giây
        // const delayMs = f.delay * 1000; // giây -> mili giây
        return `[${idx}]adelay=${delayMs}|${delayMs}[a${idx}]`;
      })
      .join('; ');

    const streams: string = producers.map((_, idx: number) => `[a${idx}]`).join('');

    const filterComplex = `"${delays}; ${streams}amix=inputs=${producers.length}:dropout_transition=2"`;

    const finalFileName: string = path.resolve(`storage/${liveId}/final.mp3`);
    const cmd = `ffmpeg ${inputs} -filter_complex ${filterComplex} -c:a libmp3lame -q:a 2 "${finalFileName}" -y`;

    this.logger.log(
      JSON.stringify(
        {
          inputs,
          delays,
          streams,
          filterComplex,
          cmd,
        },
        null,
        2,
      ),
      'RecorderService -> mixTracks',
    );

    exec(cmd, (error, stdout, stderr): void => {
      if (error) {
        console.error('FFmpeg error:', stderr);
      } else {
        console.log('Successfully');
      }
    });
  }

  /**
   * @functionName uploadSftp
   * @param liveId
   */
  public async uploadSftp(liveId: string) {
    try {
      await this.sftp.connect({
        host: this.configService.get('SSH_SERVER_HOST'),
        port: Number(this.configService.get('SSH_SERVER_PORT')),
        username: this.configService.get('SSH_SERVER_USERNAME'),
        password: this.configService.get('SSH_SERVER_PASSWORD'),
      });

      const localPath = path.resolve(`storage/${liveId}/final.mp3`);
      const remotePath = `${this.configService.get('SSH_SERVER_STORAGE')}/${liveId}.mp3`;
      await this.sftp.put(localPath, remotePath);
    } catch (e) {
      this.logger.log('RecorderService -> uploadSftp');
      this.logger.log(e);
    } finally {
      await this.sftp.end();
    }
  }

  /**
   * @functionName webhook
   * @param liveId
   */
  public async webhook(liveId: string) {
    const url = `${this.configService.get('WEBHOOK_DOMAIN_URL')}/webhook`;
    const data = { event: 'live.ended', live_id: liveId };
    const config = {
      headers: { 'X-Signature': '970d360cfadc448b2ecaa50907ff1ea0', 'Content-Type': 'application/json' },
    };
    await lastValueFrom(this.httpService.post(url, data, config));
  }
}
