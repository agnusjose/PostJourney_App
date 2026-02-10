import cv2
import mediapipe as mp
import time
import base64
import numpy as np
from collections import deque

# ---------- MediaPipe ----------
mp_face = mp.solutions.face_mesh
face_mesh = mp_face.FaceMesh(
    static_image_mode=False,
    refine_landmarks=True,
    min_detection_confidence=0.5,
    min_tracking_confidence=0.5
)

# ---------- Constants ----------
HOLD_TIME = 3.0
YAW_THRESHOLD = 0.05
PITCH_THRESHOLD = 0.05
NEUTRAL_EPS = 0.02
SMOOTH_WINDOW = 5
VISIBILITY_FRAMES = 10

SEQUENCE = [
    ("left", "Turn your head LEFT and hold"),
    ("neutral", "Return to center and hold"),
    ("right", "Turn your head RIGHT and hold"),
    ("neutral", "Return to center and hold"),
    ("up", "Look UP and hold"),
    ("neutral", "Return to center and hold"),
    ("down", "Lower your chin to your chest and hold"),
]

# ---------- Helpers ----------
def detect_direction(yaw, pitch, baseline):
    dy = yaw - baseline["yaw"]
    dp = pitch - baseline["pitch"]

    if dy < -YAW_THRESHOLD:
        return "left"
    if dy > YAW_THRESHOLD:
        return "right"
    if dp < -PITCH_THRESHOLD:
        return "up"
    if dp > PITCH_THRESHOLD:
        return "down"
    if abs(dy) < NEUTRAL_EPS and abs(dp) < NEUTRAL_EPS:
        return "neutral"

    return "invalid"


def decode_base64_image(image_b64):
    data = base64.b64decode(image_b64)
    arr = np.frombuffer(data, np.uint8)
    return cv2.imdecode(arr, cv2.IMREAD_COLOR)


# ---------- Main Analyzer ----------
def analyze_neck_mobility(image_b64=None, frame_bgr=None, state=None, expected=None):
    now = time.time()

    # ----- Decode input -----
    if frame_bgr is None and image_b64 is not None:
        frame_bgr = decode_base64_image(image_b64)

    if frame_bgr is None:
        return {
            "instruction": "Camera input not available",
            "progress": 0,
            "state": state or {},
        }

    # ----- Initialize state -----
    state = state or {}
    state.setdefault("phase", "visibility")
    state.setdefault("baseline", None)
    state.setdefault("step", 0)
    state.setdefault("hold_start", None)
    state.setdefault("reps", 0)
    state.setdefault("history", deque(maxlen=SMOOTH_WINDOW))
    state.setdefault("visible_frames", 0)

    # ----- Face detection -----
    rgb = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB)
    res = face_mesh.process(rgb)

    if not res.multi_face_landmarks:
        state["visible_frames"] = 0
        state["hold_start"] = None
        return {
            "instruction": "Sit straight. Ensure face and neck are visible",
            "progress": 0,
            "state": state,
        }

    state["visible_frames"] += 1
    if state["visible_frames"] < VISIBILITY_FRAMES:
        return {
            "instruction": "Hold steady. Calibrating posture…",
            "progress": 0,
            "state": state,
        }

    lm = res.multi_face_landmarks[0].landmark
    nose = lm[1]
    chin = lm[152]
    left_eye = lm[33]
    right_eye = lm[263]

    yaw = right_eye.x - left_eye.x
    pitch = chin.y - nose.y

    state["history"].append((yaw, pitch))
    yaw = sum(v[0] for v in state["history"]) / len(state["history"])
    pitch = sum(v[1] for v in state["history"]) / len(state["history"])

    # ----- Calibration -----
    if state["baseline"] is None:
        detected = detect_direction(yaw, pitch, {"yaw": yaw, "pitch": pitch})

        if detected != "neutral":
            state["hold_start"] = None
            return {
                "instruction": "Sit straight and hold head steady",
                "progress": 0,
                "state": state,
            }

        if state["hold_start"] is None:
            state["hold_start"] = now

        if now - state["hold_start"] < HOLD_TIME:
            return {
                "instruction": f"Hold steady ({int(HOLD_TIME - (now - state['hold_start']))}s)",
                "progress": 0,
                "state": state,
            }

        state["baseline"] = {"yaw": yaw, "pitch": pitch}
        state["hold_start"] = None
        state["phase"] = "active"

        return {
            "instruction": SEQUENCE[0][1],
            "progress": 0,
            "state": state,
        }

    # ----- Active Exercise -----
    expected_dir, text = SEQUENCE[state["step"]]
    detected = detect_direction(yaw, pitch, state["baseline"])

    if detected == expected_dir:
        if state["hold_start"] is None:
            state["hold_start"] = now

        elapsed = now - state["hold_start"]

        if elapsed >= HOLD_TIME:
            state["hold_start"] = None
            state["step"] += 1

            if state["step"] >= len(SEQUENCE):
                state["step"] = 0
                state["reps"] += 1
                return {
                    "instruction": f"Good. Repetition {state['reps']} completed",
                    "progress": 1.0,
                    "completed": True,
                    "state": state,
                }

            return {
                "instruction": SEQUENCE[state["step"]][1],
                "progress": state["step"] / len(SEQUENCE),
                "state": state,
            }

        return {
            "instruction": f"{text} ({int(HOLD_TIME - elapsed)}s)",
            "progress": (state["step"] + elapsed / HOLD_TIME) / len(SEQUENCE),
            "state": state,
        }

    # ----- Incorrect Position -----
    state["hold_start"] = None
    return {
        "instruction": f"Adjust posture. {text}",
        "progress": state["step"] / len(SEQUENCE),
        "state": state,
    }
