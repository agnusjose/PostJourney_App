import {
  RTCPeerConnection,
  RTCSessionDescription,
  mediaDevices,
} from "react-native-webrtc";

let pc = null;

export async function startWebRTCStream(signalingUrl) {
  const stream = await mediaDevices.getUserMedia({
    video: {
      facingMode: "user",
      frameRate: 15,
    },
    audio: false,
  });

  pc = new RTCPeerConnection({
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
  });

  stream.getTracks().forEach((track) => pc.addTrack(track, stream));

  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);

  const res = await fetch(`${signalingUrl}/offer`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(pc.localDescription),
  });

  const answer = await res.json();
  await pc.setRemoteDescription(new RTCSessionDescription(answer));

  return () => {
    pc.close();
    pc = null;
    stream.getTracks().forEach((t) => t.stop());
  };
}
