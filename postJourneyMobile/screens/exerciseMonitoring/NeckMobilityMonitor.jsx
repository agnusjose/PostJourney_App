import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { startWebRTCStream } from "../../utils/webrtcClient";

export default function NeckMobilityMonitor() {
  const navigation = useNavigation();

  const [instruction, setInstruction] = useState(
    "Sit straight and look at the camera"
  );
  const [progress, setProgress] = useState(0);
  const [streamReady, setStreamReady] = useState(false);

  const [permission, requestPermission] = useCameraPermissions();

  // 🔒 Backend-owned state only
  const stateRef = useRef({});

  /**
   * 0️⃣ Camera permission
   */
  useEffect(() => {
    if (!permission) return;
    if (!permission.granted) requestPermission();
  }, [permission]);

  /**
   * 1️⃣ Start WebRTC stream (NO UI responsibility)
   */
  useEffect(() => {
    if (!permission?.granted) return;

    let stopStream;

    startWebRTCStream("http://192.168.137.1:8001")
      .then((stop) => {
        stopStream = stop;
        setStreamReady(true);
      })
      .catch((err) => {
        console.error("WebRTC stream failed:", err);
      });

    return () => stopStream && stopStream();
  }, [permission?.granted]);

  /**
   * 2️⃣ Poll backend AI state
   */
  useEffect(() => {
    if (!streamReady) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch("http://192.168.137.1:8000/pose/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            exercise: "neck_mobility",
            state: stateRef.current,
          }),
        });

        const data = await res.json();

        if (data.state) stateRef.current = data.state;
        if (data.instruction) setInstruction(data.instruction);
        if (typeof data.progress === "number") setProgress(data.progress);

        if (data.completed) {
          clearInterval(interval);
          navigation.replace("ExerciseCompleted");
        }
      } catch {
        // silent by design
      }
    }, 500);

    return () => clearInterval(interval);
  }, [streamReady]);

  if (!permission || !permission.granted) {
    return (
      <View style={styles.loadingOverlay}>
        <ActivityIndicator size="large" color="#7CB342" />
        <Text style={styles.loadingText}>
          Waiting for camera permission…
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent />

      {/* 🎥 VISIBLE CAMERA PREVIEW (FIXES BLACK SCREEN) */}
      <CameraView
        facing="front"
        style={StyleSheet.absoluteFillObject}
      />

      {/* 🧠 HUD OVERLAY */}
      <View style={styles.hudContainer}>
        <View style={styles.feedbackCard}>
          <Text style={styles.title}>NECK MOBILITY AI</Text>
          <Text style={styles.feedbackText}>{instruction}</Text>

          <View style={styles.progressBg}>
            <View
              style={[
                styles.progressFill,
                { width: `${progress * 100}%` },
              ]}
            />
          </View>
        </View>
      </View>

      {!streamReady && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#7CB342" />
          <Text style={styles.loadingText}>
            Starting Camera Stream…
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },

  hudContainer: {
    position: "absolute",
    top: 40,
    left: 20,
    right: 20,
  },

  feedbackCard: {
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 20,
    padding: 20,
  },

  title: {
    color: "#1ABC9C",
    fontWeight: "700",
    marginBottom: 8,
  },

  feedbackText: {
    color: "#ECF0F1",
    fontSize: 18,
    fontWeight: "600",
    marginVertical: 12,
  },

  progressBg: {
    height: 8,
    backgroundColor: "#34495E",
    borderRadius: 4,
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
    backgroundColor: "#7CB342",
  },

  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "center",
    alignItems: "center",
  },

  loadingText: {
    color: "#ECF0F1",
    marginTop: 12,
  },
});