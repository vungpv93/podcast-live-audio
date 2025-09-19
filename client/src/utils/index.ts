import moment from 'moment';

/**
 * @functionName localAudioStreamAndTrack
 * @author vungpv93@gmail.com
 */
export const localAudioStreamAndTrack = async (): Promise<
  MediaStreamTrack | undefined
> => {
  try {
    const localStream: MediaStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: false,
    });
    return localStream.getAudioTracks()[0];
  } catch (e) {
    console.error('DEBUG getLocalAudioStreamAndTrack() : ', e);
  }
};

export const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export function timeAgo(timeAt: string): string {
  const now = moment();
  const created = moment(timeAt);

  const diffMinutes = now.diff(created, 'minutes');
  const diffHours = now.diff(created, 'hours');
  const diffDays = now.diff(created, 'days');
  const diffMonths = now.diff(created, 'months');

  if (diffMinutes < 1) {
    return '1 phút trước';
  } else if (diffMinutes < 60) {
    return `${diffMinutes} phút trước`;
  } else if (diffHours < 24) {
    return `${diffHours} giờ trước`;
  } else if (diffDays <= 30) {
    return `${diffDays} ngày trước`;
  } else if (diffMonths < 12) {
    return `${diffMonths} tháng trước`;
  } else {
    return created.format('DD/MM/YYYY');
  }
}
