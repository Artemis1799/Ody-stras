import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Animated } from "react-native";
import { VideoView, useVideoPlayer } from "expo-video";
import { useNavigation } from "@react-navigation/native";
import { EventScreenNavigationProp } from "../../types/types";

export default function WelcomeScreen() {
  const navigation = useNavigation<EventScreenNavigationProp>();
  const player = useVideoPlayer(require("../../assets/Strasbourg.mp4"), (p) => {
    p.loop = true;
    p.play();
  });

  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const translateY = React.useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 1800, useNativeDriver: true }).start();
    Animated.timing(translateY, { toValue: 0, duration: 1800, useNativeDriver: true }).start();

    // Start the video player directly (VideoPlayer doesn't have loadAsync)
    if (typeof player.play === "function") {
      try {
        player.play();
      } catch (e) {
        console.warn("Failed to start video player:", e);
      }
    }
  }, []);

  return (
    <View style={styles.container}>
      {/* Vidéo de fond */}
      <VideoView
        style={StyleSheet.absoluteFill}
        player={player}
        contentFit="cover"
      />

      {/* Overlay */}
      <View style={styles.overlay} />

      {/* Contenu animé */}
      <Animated.View
        style={[
          styles.content,
          { opacity: fadeAnim, transform: [{ translateY }] },
        ]}
      >
        <Text style={styles.title}>Bienvenue</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate("Events")}
        >
          <Text style={styles.buttonText}>Entrer dans l’application</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  content: { flex: 1, alignItems: "center", justifyContent: "center" },
  title: { color: "#fff", fontSize: 34, fontWeight: "bold", marginBottom: 30 },
  button: { backgroundColor: "#ffffffbb", paddingVertical: 12, paddingHorizontal: 25, borderRadius: 25 },
  buttonText: { fontWeight: "bold", fontSize: 18, color: "#000" },
});
