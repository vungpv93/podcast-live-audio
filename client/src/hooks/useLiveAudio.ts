import {
  useRef,
  useState,
  useCallback,
  type RefObject,
  useEffect,
} from 'react';
import * as mediasoupClient from 'mediasoup-client';
import type { Device, types } from 'mediasoup-client';
import type { ConsumerKind, ILiveAudio } from '../dto/live-audio.ts';
import toast from 'react-hot-toast';

interface TransportOptions {
  id: string;
  iceParameters: types.IceParameters;
  iceCandidates: types.IceCandidate[];
  dtlsParameters: types.DtlsParameters;
}

interface ProducerInfo {
  producerId: string;
  peerId: string;
  kind: ConsumerKind;
}

export function useLiveAudio({ roomId, socket, localStream }: ILiveAudio) {
  const consumersRef: RefObject<types.Consumer[]> = useRef<types.Consumer[]>(
    [],
  );
  const mergedStreamRef: RefObject<MediaStream> = useRef<MediaStream>(
    new MediaStream(),
  );
  const [audioStream, setAudioStream] = useState<MediaStream>();
  // const [localStream, setLocalStream] = useState<MediaStream>();

  const deviceRef: RefObject<Device | null> = useRef<Device | null>(null);
  const recvTransportRef: RefObject<types.Transport | null> =
    useRef<types.Transport | null>(null);

  const createDevice: (
    rtpCapabilities: types.RtpCapabilities,
  ) => Promise<Device> = useCallback(
    async (rtpCapabilities: types.RtpCapabilities): Promise<Device> => {
      const newDevice = new mediasoupClient.Device();
      await newDevice.load({ routerRtpCapabilities: rtpCapabilities });
      deviceRef.current = newDevice;
      return newDevice;
    },
    [],
  );

  const createSendTransport: (
    device: Device,
    transportOptions: TransportOptions,
  ) => types.Transport | undefined = useCallback(
    (
      device: Device,
      transportOptions: TransportOptions,
    ): types.Transport | undefined => {
      if (!socket) {
        console.warn('No socket connection');
        return;
      }

      const newSendTransport = device.createSendTransport(transportOptions);

      newSendTransport.on(
        'connect',
        (
          { dtlsParameters }: { dtlsParameters: types.DtlsParameters },
          callback: () => void,
          errback: (error: Error) => void,
        ) => {
          try {
            // connect-transport | CONNECT_TRANSPORT
            socket.emit('CONNECT_TRANSPORT', {
              transportId: newSendTransport.id,
              dtlsParameters,
              roomId,
              peerId: socket.id,
            });
            callback();
          } catch (error) {
            errback(error as Error);
          }
        },
      );

      newSendTransport.on(
        'produce',
        (
          {
            kind,
            rtpParameters,
          }: { kind: types.MediaKind; rtpParameters: types.RtpParameters },
          callback: ({ id }: { id: string }) => void,
          errback: (error: Error) => void,
        ) => {
          try {
            // produce | EVT_PRODUCE
            socket.emit(
              'EVT_PRODUCE',
              {
                transportId: newSendTransport.id,
                kind,
                rtpParameters,
                roomId,
                liveId: roomId,
                peerId: socket.id,
              },
              (producerId: string) => {
                callback({ id: producerId });
              },
            );
          } catch (error) {
            errback(error as Error);
          }
        },
      );

      return newSendTransport;
    },
    [roomId, socket],
  );

  const createRecvTransport: (
    device: Device,
    transportOptions: TransportOptions,
  ) =>
    | mediasoupClient.types.Transport<mediasoupClient.types.AppData>
    | undefined = useCallback(
    (device: Device, transportOptions: TransportOptions) => {
      if (!socket) {
        toast.error('No socket connection');
        console.warn('No socket connection');
        return;
      }

      console.log(`The createRecvTransport is running`);

      const newRecvTransport = device.createRecvTransport(transportOptions);

      newRecvTransport.on(
        'connect',
        ({ dtlsParameters }, callback, errback) => {
          try {
            console.log(`The event emit socket is CONNECT_TRANSPORT`, {
              roomId: roomId,
              liveId: roomId,
              transportId: newRecvTransport.id,
              dtlsParameters,
              peerId: socket.id,
            });
            // connect-transport | CONNECT_TRANSPORT
            socket.emit('CONNECT_TRANSPORT', {
              roomId: roomId,
              liveId: roomId,
              transportId: newRecvTransport.id,
              dtlsParameters,
              peerId: socket.id,
            });
            callback();
          } catch (error) {
            errback(error as Error);
          }
        },
      );

      recvTransportRef.current = newRecvTransport;
      return newRecvTransport;
    },
    [roomId, socket],
  );

  const consume: ({ producerId }: ProducerInfo) => Promise<void> = useCallback(
    async ({ producerId }: ProducerInfo): Promise<void> => {
      const device: types.Device | null = deviceRef.current;
      const recvTransport: types.Transport | null = recvTransportRef.current;
      if (!device || !recvTransport || !socket) return;

      // consume | EVT_CONSUME
      socket.emit(
        'EVT_CONSUME',
        {
          transportId: recvTransport.id,
          producerId,
          roomId,
          liveId: roomId,
          peerId: socket.id,
          rtpCapabilities: device.rtpCapabilities,
        },
        async (response: {
          error?: string;
          consumerData: {
            id: string;
            producerId: string;
            kind: ConsumerKind;
            rtpParameters: types.RtpParameters;
          };
        }): Promise<void> => {
          if (response.error) {
            toast.error('Error consuming');
            console.error('Error consuming:', response.error);
            return;
          }

          const { consumerData } = response;
          const consumer: types.Consumer = await recvTransport.consume({
            id: consumerData.id,
            producerId: consumerData.producerId,
            kind: consumerData.kind,
            rtpParameters: consumerData.rtpParameters,
          });

          consumersRef.current.push(consumer);

          consumer.resume();
          mergedStreamRef.current.addTrack(consumer.track);
          setAudioStream(new MediaStream(mergedStreamRef.current.getTracks()));

          if (consumer.kind === 'audio') {
            const audioElement: HTMLAudioElement =
              document.createElement('audio');
            audioElement.srcObject = mergedStreamRef.current;
            audioElement.autoplay = true;
            audioElement.controls = true;

            try {
              await audioElement.play();
            } catch (err) {
              toast.error('Audio playback failed');
              console.error('Audio playback failed:', err);
            }
          }
        },
      );
    },
    [roomId, socket],
  );

  const handleJoinLive: () => Promise<void> =
    useCallback(async (): Promise<void> => {
      if (!socket || !roomId) {
        console.error(`No socket or liveId`);
        toast.error('No socket or liveId');
        return;
      }
      console.info(`The handleJoinLive function is `, {
        socket_id: socket.id,
        liveId: roomId,
      });

      socket.emit(
        `JOIN_LIVE`,
        { liveId: roomId, roomId, peerId: socket.id },
        async (response: {
          errcd?: string;
          data: {
            rtpCapabilities: types.RtpCapabilities;
            sendTransportOptions?: TransportOptions;
            recvTransportOptions: TransportOptions;
            peerIds: string[];
            producers: ProducerInfo[];
          };
        }): Promise<void> => {
          if (response.errcd) {
            console.error(`No response error`, response.errcd);
            toast.error(`No response errcd is ${response.errcd}`);
            return;
          }
          console.log('handleJoinLive evt successfully :', response);

          const {
            rtpCapabilities,
            sendTransportOptions,
            recvTransportOptions,
            producers,
          } = response.data;

          // TODO 3.1 Tao device
          const newDevice: Device = await createDevice(rtpCapabilities);
          console.log(`The new device is `, newDevice);
          toast.success('Thiết lập device thành công');

          // TODO 3.2. Thiet lap Send Transport de nhan Audio
          createRecvTransport(newDevice, recvTransportOptions);
          toast.success('Thiết lập đường truyền nhan audio thành công');

          // TODO 3.3. Thiet lap Recv Transport de gui Audio
          if (sendTransportOptions) {
            const newSendTransport = createSendTransport(
              newDevice,
              sendTransportOptions,
            );
            toast.success('Thiết lập đường truyền gửi audio thành công');

            // const audioTrack: MediaStreamTrack | undefined = await localAudioStreamAndTrack();
            const audioTrack: MediaStreamTrack | undefined =
              localStream?.getAudioTracks()[0];
            if (audioTrack && newSendTransport) {
              await newSendTransport.produce({ track: audioTrack });
            }
          }

          console.log('Số lượng producer là : ', producers.length);
          for (const producerInfo of producers) {
            await consume(producerInfo);
          }
        },
      );
    }, [
      socket,
      roomId,
      createDevice,
      createRecvTransport,
      createSendTransport,
      localStream,
      consume,
    ]);

  const leaveRoom: () => void = useCallback(() => {
    if (!socket) return;

    socket.emit('leave-room', (response?: { error?: string }) => {
      if (response?.error) {
        toast.error('Error leaving room');
        console.error('Error leaving room:', response.error);
        return;
      }

      // Dừng tất cả consumers
      consumersRef.current.forEach((consumer) => {
        try {
          consumer.close();
        } catch (err) {
          toast.error('Close consumer failed');
          console.error('Close consumer failed:', err);
        }
      });
      consumersRef.current = [];

      // Dừng tất cả track của mergedStreamRef
      mergedStreamRef.current?.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (err) {
          toast.error('Stop track failed');
          console.error('Stop track failed:', err);
        }
      });

      // Reset state và ref
      mergedStreamRef.current = new MediaStream();
      setAudioStream(undefined); // 🔹 reset audio stream state

      // Đóng Recv Transport
      if (recvTransportRef.current) {
        try {
          recvTransportRef.current.close();
        } catch (err) {
          toast.error('Close recvTransport failed');
          console.error('Close recvTransport failed:', err);
        }
        recvTransportRef.current = null;
      }

      // Xóa device
      deviceRef.current = null;
    });
  }, [socket]);

  const handlePause: () => void = useCallback(() => {
    consumersRef.current.forEach((c) => {
      try {
        c.pause();
      } catch (err) {
        toast.error('Pause consumer failed');
        console.error('Pause consumer failed:', err);
      }
    });
  }, []);

  const handleResume: () => void = useCallback(() => {
    consumersRef.current.forEach((c) => {
      try {
        c.resume();
        setAudioStream(undefined);
      } catch (err) {
        toast.error('Resume consumer failed');
        console.error('Resume consumer failed:', err);
      }
    });
  }, []);

  useEffect(() => {
    if (socket && socket.id && roomId) {
      socket.on('NEW_PRODUCER', async (data) => {
        console.log('NEW_PRODUCER', data);
        toast.success('Có thêm một người phát live mới');
        await consume(data);
      });
    }
  }, [consume, roomId, socket]);

  return {
    audioStream,
    // joinRoom: joinRoom,
    joinRoom: handleJoinLive,
    leaveRoom,
    handlePause,
    handleResume,
  };
}
