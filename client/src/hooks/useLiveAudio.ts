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

export function useLiveAudio({
  liveId,
  socket,
  localStream,
  volume,
  isMicEnabled,
}: ILiveAudio) {
  const pingInterval = useRef<NodeJS.Timeout | null>(null);
  const consumersRef: RefObject<types.Consumer[]> = useRef<types.Consumer[]>(
    [],
  );
  const mergedStreamRef: RefObject<MediaStream> = useRef<MediaStream>(
    new MediaStream(),
  );
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
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
              liveId,
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
                roomId: liveId,
                liveId: liveId,
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
    [liveId, socket],
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
          const body = {
            roomId: liveId,
            liveId: liveId,
            transportId: newRecvTransport.id,
            dtlsParameters,
            peerId: socket.id,
          };
          try {
            console.log(`The event emit socket is CONNECT_TRANSPORT`, body);
            // connect-transport | CONNECT_TRANSPORT
            socket.emit('CONNECT_TRANSPORT', { ...body });
            callback();
          } catch (error) {
            errback(error as Error);
          }
        },
      );

      recvTransportRef.current = newRecvTransport;
      return newRecvTransport;
    },
    [liveId, socket],
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
          roomId: liveId,
          liveId: liveId,
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
            // Kiểm tra xem đã có audio element chưa
            if (!audioElementRef.current) {
              const audioElement: HTMLAudioElement =
                document.createElement('audio');
              audioElement.srcObject = mergedStreamRef.current;
              audioElement.autoplay = true;
              audioElement.controls = true;
              audioElementRef.current = audioElement;

              // Áp dụng volume ngay sau khi tạo audio element
              if (volume === undefined || volume === 0) {
                audioElement.muted = true;
                console.log('New audio element created and muted');
              } else {
                audioElement.muted = false;
                audioElement.volume = volume / 100;
                console.log(
                  'New audio element created with volume:',
                  volume / 100,
                );
              }

              try {
                await audioElement.play();
                console.log('Audio element playing');
              } catch (err) {
                toast.error('Audio playback failed');
                console.error('Audio playback failed:', err);
              }
            } else {
              console.log('Audio element already exists, updating srcObject');
              audioElementRef.current.srcObject = mergedStreamRef.current;
            }
          }
        },
      );
    },
    [liveId, socket],
  );

  // Điều khiển volume của audio element
  const updateVolume = useCallback(() => {
    console.log(`The updateVolume function is running`, {
      volume,
      audioElement: audioElementRef.current,
    });

    // Kiểm tra audio element từ ref trước
    if (audioElementRef.current) {
      if (volume === undefined || volume === 0) {
        audioElementRef.current.muted = true;
        audioElementRef.current.pause();
        console.log(
          'Audio muted and paused (ref):',
          audioElementRef.current.muted,
          audioElementRef.current.paused,
        );
      } else {
        audioElementRef.current.muted = false;
        audioElementRef.current.volume = volume / 100;
        if (audioElementRef.current.paused) {
          audioElementRef.current.play().catch(console.error);
        }
        console.log(
          'Audio volume set (ref):',
          audioElementRef.current.volume,
          'muted:',
          audioElementRef.current.muted,
          'paused:',
          audioElementRef.current.paused,
        );
      }
    } else {
      console.log('No audio element found in ref');
    }

    // Tìm tất cả audio elements trên trang và điều chỉnh volume
    const allAudioElements = document.querySelectorAll('audio');
    console.log('Found audio elements:', allAudioElements.length);
    allAudioElements.forEach((audio, index) => {
      if (volume === undefined || volume === 0) {
        audio.muted = true;
        audio.pause(); // Thêm pause để đảm bảo tắt hoàn toàn
        console.log(
          `Audio ${index} muted and paused:`,
          audio.muted,
          audio.paused,
        );
      } else {
        audio.muted = false;
        audio.volume = volume / 100;
        // Chỉ play nếu chưa đang play
        if (audio.paused) {
          audio.play().catch(console.error);
        }
        console.log(
          `Audio ${index} volume set:`,
          audio.volume,
          'muted:',
          audio.muted,
          'paused:',
          audio.paused,
        );
      }
    });
  }, [volume]);

  // Theo dõi thay đổi volume và cập nhật audio element
  useEffect(() => {
    updateVolume();
  }, [updateVolume]);

  useEffect(() => {
    if (localStream) {
      const audioTracks = localStream.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = isMicEnabled || false;
      });
      console.log(`Audio tracks ${isMicEnabled ? 'enabled' : 'disabled'} for sending`);
    }
  }, [localStream, isMicEnabled]);

  const handleJoinLive: () => Promise<void> =
    useCallback(async (): Promise<void> => {
      if (!socket || !liveId) {
        console.error(`No socket or liveId`);
        toast.error('No socket or liveId');
        return;
      }
      console.info(`The handleJoinLive function is `, {
        socket_id: socket.id,
        liveId: liveId,
      });

      socket.emit(
        `JOIN_LIVE`,
        { liveId: liveId, peerId: socket.id },
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
          toast.success('Thiết lập đường truyền nhận audio');

          // TODO 3.3. Thiet lap Recv Transport de gui Audio
          if (sendTransportOptions) {
            const newSendTransport = createSendTransport(
              newDevice,
              sendTransportOptions,
            );
            toast.success('Thiết lập đường truyền gửi audio');

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
          if (!pingInterval.current) {
            pingInterval.current = setInterval(() => {
              socket.emit('PING', { liveId: liveId });
            }, 30 * 1000);
          }
        },
      );
    }, [
      socket,
      liveId,
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
    if (socket && socket.id && liveId) {
      socket.on('NEW_PRODUCER', async (data) => {
        console.log('NEW_PRODUCER', data);
        toast.success('Có thêm một người phát live mới');
        await consume(data);
      });
    }
  }, [consume, liveId, socket]);

  useEffect(() => {
    return () => {
      if (pingInterval.current) clearInterval(pingInterval.current);
    };
  }, []);

  return {
    audioStream,
    // joinRoom: joinRoom,
    joinRoom: handleJoinLive,
    leaveRoom,
    handlePause,
    handleResume,
  };
}
