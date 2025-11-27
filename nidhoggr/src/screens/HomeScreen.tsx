import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Animated } from "react-native";
import { VideoView, useVideoPlayer } from "expo-video";
import { useNavigation } from "@react-navigation/native";
import { EventScreenNavigationProp } from "../../types/types";
import { Strings } from "../../types/strings";

export default function WelcomeScreen() {
  const navigation = useNavigation<EventScreenNavigationProp>();
  const [animationFinished, setAnimationFinished] = useState(false);
  const player = useVideoPlayer(require("../../assets/Strasbourg.mp4"), (p) => {
    p.loop = true;
    p.play();
  });

  const blackScreenOpacity = React.useRef(new Animated.Value(1)).current;
  const titleOpacity = React.useRef(new Animated.Value(0)).current;
  const titleTranslateY = React.useRef(new Animated.Value(0)).current;
  const titleScale = React.useRef(new Animated.Value(1)).current;
  const subtitleOpacity = React.useRef(new Animated.Value(0)).current;
  const buttonOpacity = React.useRef(new Animated.Value(0)).current;

  const animationSequence = React.useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (typeof player.play === "function") {
      try {
        player.play();
      } catch (e) {
        console.warn("Failed to start video player:", e);
      }
    }

    animationSequence.current = Animated.sequence([
      // 1. Fade out black screen (reveal background)
      Animated.timing(blackScreenOpacity, {
        toValue: 0.3,
        duration: 3500,
        useNativeDriver: true,
      }),
      // 2. Fade in Title
      Animated.timing(titleOpacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      // 3. Move Title Up and Scale Down
      Animated.parallel([
        Animated.timing(titleTranslateY, {
          toValue: -50,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(titleScale, {
          toValue: 0.8,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
      // 4. Fade in Subtitle
      Animated.timing(subtitleOpacity, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      // 5. Fade in Button
      Animated.timing(buttonOpacity, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]);

    animationSequence.current.start(() => setAnimationFinished(true));

    return () => {
      animationSequence.current?.stop();
    };
  }, []);

  const skipAnimation = () => {
    animationSequence.current?.stop();
    blackScreenOpacity.setValue(0.3);
    titleOpacity.setValue(1);
    titleTranslateY.setValue(-50);
    titleScale.setValue(0.8);
    subtitleOpacity.setValue(1);
    buttonOpacity.setValue(1);
    setAnimationFinished(true);
  };

  const handleEnter = () => {
    Animated.parallel([
      Animated.timing(titleOpacity, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(subtitleOpacity, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(buttonOpacity, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start(() => {
      navigation.reset({
        index: 0,
        routes: [{ name: "Events" }],
      });
      player.pause();
    });
  };

  return (
    <View style={styles.container}>
      <VideoView
        style={StyleSheet.absoluteFill}
        player={player}
        contentFit="cover"
      />

      <View style={styles.overlay} />

      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: "black", opacity: blackScreenOpacity },
        ]}
        pointerEvents="none"
      />

      {!animationFinished && (
        <TouchableOpacity style={styles.skipButton} onPress={skipAnimation}>
          <Text style={styles.skipText}>Passer l'intro</Text>
        </TouchableOpacity>
      )}

      <View style={styles.content}>
        <Animated.View
          style={{
            opacity: titleOpacity,
            transform: [{ translateY: titleTranslateY }, { scale: titleScale }],
            alignItems: "center",
          }}
        >
          <Text style={styles.title}>{Strings.homeScreen.welcomeTitle}</Text>
          <Animated.Text style={[styles.subtitle, { opacity: subtitleOpacity }]}>
            {Strings.homeScreen.welcomeSubtitle}
          </Animated.Text>
        </Animated.View>

        <Animated.View style={{ opacity: buttonOpacity }}>
          <TouchableOpacity
            style={styles.button}
            onPress={handleEnter}
          >
            <Text style={styles.buttonText}>{Strings.homeScreen.accessApplication}</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
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
  title: { color: "#fff", fontSize: 60, fontWeight: "bold", marginBottom: 10 },
  subtitle: { color: "#fff", fontSize: 24, fontWeight: "300", marginBottom: 30 },
  button: { backgroundColor: "#8FB34Ebb", paddingVertical: 12, paddingHorizontal: 25, borderRadius: 25 },
  buttonText: { fontWeight: "bold", fontSize: 18, color: "#FFFFFFbb" },
  skipButton: { position: "absolute", top: 60, right: 20, zIndex: 10, padding: 10 },
  skipText: { color: "white", fontSize: 16, opacity: 0.8 },
});
