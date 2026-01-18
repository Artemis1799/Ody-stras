import { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const lightColors = {
  background: "#f8f8fc",
  card: "#ffffff",
  text: "#000000",
  header: "#9EC54D",
  avatarBg: "#E5E0FF",
  avatarText: "#6B5EFF",
  fab: "#A6CE39",
};

const darkColors = {
  background: "#1c1c1e",
  card: "#2c2c2e",
  text: "#ffffff",
  header: "#3c3c3e",
  avatarBg: "#555",
  avatarText: "#fff",
  fab: "#4b8b2c",
};

type ThemeContextType = {
  theme: "light" | "dark";
  toggleTheme: () => void;
  colors: typeof lightColors;
  skipVideo: boolean;
  toggleSkipVideo: () => void;
  showMiniMaps: boolean;
  toggleShowMiniMaps: () => void;
  isLoading: boolean;
};

const ThemeContext = createContext<ThemeContextType>(null!);

export function ThemeProvider({ children }: any) {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [skipVideo, setSkipVideo] = useState<boolean>(false);
  const [showMiniMaps, setShowMiniMaps] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const storedTheme = await AsyncStorage.getItem("theme");
      const storedSkipVideo = await AsyncStorage.getItem("skipVideo");
      const storedShowMiniMaps = await AsyncStorage.getItem("showMiniMaps");

      if (storedTheme === "dark" || storedTheme === "light") {
        setTheme(storedTheme);
      }
      if (storedSkipVideo !== null) {
        setSkipVideo(JSON.parse(storedSkipVideo));
      }
      if (storedShowMiniMaps !== null) {
        setShowMiniMaps(JSON.parse(storedShowMiniMaps));
      }
    } catch (e) {
      console.error("Failed to load settings", e);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTheme = async () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    await AsyncStorage.setItem("theme", newTheme);
  };

  const toggleSkipVideo = async () => {
    const newValue = !skipVideo;
    setSkipVideo(newValue);
    await AsyncStorage.setItem("skipVideo", JSON.stringify(newValue));
  };

  const toggleShowMiniMaps = async () => {
    const newValue = !showMiniMaps;
    setShowMiniMaps(newValue);
    await AsyncStorage.setItem("showMiniMaps", JSON.stringify(newValue));
  };

  const colors = theme === "light" ? lightColors : darkColors;

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, colors, skipVideo, toggleSkipVideo, showMiniMaps, toggleShowMiniMaps, isLoading }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
