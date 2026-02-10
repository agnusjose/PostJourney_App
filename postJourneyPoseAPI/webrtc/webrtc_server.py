import asyncio
import cv2
import time
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from aiortc import RTCPeerConnection, RTCSessionDescription
from aiortc.mediastreams import MediaStreamError

# ✅ EXISTING ANALYZER (UNCHANGED INTERFACE)
from exercises.neck_mobility import analyze_neck_mobility

app = FastAPI()
pcs = set()

# 🔒 Persistent backend-owned state
POSE_STATE = {}

# ⏱️ Clinical frame throttling
TARGET_FPS = 10
FRAME_INTERVAL = 1.0 / TARGET_FPS


@app.post("/offer")
async def offer(request: Request):
    params = await request.json()

    offer = RTCSessionDescription(
        sdp=params["sdp"],
        type=params["type"]
    )

    pc = RTCPeerConnection()
    pcs.add(pc)

    @pc.on("track")
    def on_track(track):
        if track.kind != "video":
            return

        async def recv():
            global POSE_STATE
            last_frame_time = 0.0

            while True:
                try:
                    frame = await track.recv()
                    now = time.time()

                    # ⏱️ FPS control (IMPORTANT)
                    if now - last_frame_time < FRAME_INTERVAL:
                        continue
                    last_frame_time = now

                    img_bgr = frame.to_ndarray(format="bgr24")

                    # ✅ PASS RAW FRAME (NO BASE64 LOSS)
                    result = analyze_neck_mobility(
                        frame_bgr=img_bgr,
                        state=POSE_STATE
                    )

                    if isinstance(result, dict) and "state" in result:
                        POSE_STATE = result["state"]

                except MediaStreamError:
                    print("🔌 WebRTC stream ended")
                    break
                except Exception as e:
                    print("❌ Frame processing error:", e)
                    break

        asyncio.create_task(recv())

    @pc.on("connectionstatechange")
    async def on_connectionstatechange():
        if pc.connectionState in ("failed", "closed", "disconnected"):
            await pc.close()
            pcs.discard(pc)
            print("❌ Peer disconnected")

    await pc.setRemoteDescription(offer)
    answer = await pc.createAnswer()
    await pc.setLocalDescription(answer)

    return JSONResponse({
        "sdp": pc.localDescription.sdp,
        "type": pc.localDescription.type
    })
