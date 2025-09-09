/**
 * @functionName localAudioStreamAndTrack
 * @author vungpv93@gmail.com
 */
export const localAudioStreamAndTrack = async (): Promise<MediaStreamTrack | undefined> => {
	try {
		const localStream: MediaStream = await navigator.mediaDevices.getUserMedia({audio: true, video: false});
		return localStream.getAudioTracks()[0];
	} catch (e) {
		console.error("DEBUG getLocalAudioStreamAndTrack() : ", e);
	}
};