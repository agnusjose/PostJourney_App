import React, { useEffect } from "react";
import {
  View,
  StyleSheet,
  Platform,
  ActivityIndicator,
} from "react-native";
import { WebView } from "react-native-webview";

export default function VideoPlayer({ route, navigation }) {
  const { type, url, videoId } = route.params || {};

  let embedUrl = null;
  let youtubeWatchUrl = null;

  if (type === "youtube" && videoId) {
    embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1`;
    youtubeWatchUrl = `https://www.youtube.com/watch?v=${videoId}`;
  } else if (type === "direct" && url) {
    embedUrl = url;
  }

  // 🌐 WEB: YouTube iframe is blocked → open externally
  useEffect(() => {
    if (Platform.OS === "web" && type === "youtube" && youtubeWatchUrl) {
      window.open(youtubeWatchUrl, "_blank");
      navigation.goBack();
    }
  }, []);

  // 🌐 WEB: show loader briefly while redirect happens
  if (Platform.OS === "web") {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // 📱 MOBILE: embedded playback
  if (!embedUrl) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <WebView
        source={{ uri: embedUrl }}
        allowsFullscreenVideo
        javaScriptEnabled
        domStorageEnabled
        startInLoadingState
        renderLoading={() => (
          <View style={styles.center}>
            <ActivityIndicator size="large" />
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
});