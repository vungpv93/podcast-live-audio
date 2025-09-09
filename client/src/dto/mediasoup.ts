export interface IRtcpFeedback {
  type: string;
  parameter: string;
}

export interface IRtpCodec {
  kind: 'audio' | 'video';
  mimeType: string;
  clockRate: number;
  channels?: number;
  rtcpFeedback: IRtcpFeedback[];
  parameters: Record<string, string | number>;
  preferredPayloadType: number;
}

export interface IRtpHeaderExtension {
  kind: 'audio' | 'video';
  uri: string;
  preferredId: number;
  preferredEncrypt: boolean;
  direction: 'sendrecv' | 'recvonly' | 'sendonly' | 'inactive';
}

export interface IRtpCapabilities {
  codecs: IRtpCodec[];
  headerExtensions: IRtpHeaderExtension[];
}
