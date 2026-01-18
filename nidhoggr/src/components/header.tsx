import { View, Image, TouchableOpacity, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../utils/ThemeContext";
import { getStyles } from "../utils/theme";
import { useState } from "react";
import { SettingsModal } from "./SettingsModal";

type HeaderProps = {
  onBack?: () => void; // optionnel : fonction perso
  showBack?: boolean; // optionnel : pour cacher le bouton
  rightIcon?: React.ReactNode; // optionnel : icône custom à droite
};

export function Header({ onBack, showBack = true, rightIcon }: HeaderProps) {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const [settingsVisible, setSettingsVisible] = useState(false);

  const handleBack = () => {
    if (onBack) return onBack(); // si custom → utiliser la fonction fournie
    navigation.goBack(); // sinon → goBack par défaut
  };

  return (
    <View style={styles.header}>
      {showBack ? (
        <TouchableOpacity onPress={handleBack}>
          <Ionicons name="arrow-back" size={28} color="white" />
        </TouchableOpacity>
      ) : (
        // Rien sur le côté gauche quand showBack est false
        <View style={{ width: 28 }} /> // Placeholder pour maintenir l'alignement
      )}

      <Image
        source={
          theme === "light"
            ? require("../../ressources/headerLight.png")
            : require("../../ressources/headerBlack.png")
        }
        style={styles.headerImage}
      />

      {/* Always show settings icon on the right, or the custom rightIcon if provided */}
      {rightIcon ?? (
        <TouchableOpacity onPress={() => setSettingsVisible(true)}>
          <Ionicons name="settings-outline" size={28} color="white" />
        </TouchableOpacity>
      )}

      <SettingsModal
        visible={settingsVisible}
        onClose={() => setSettingsVisible(false)}
      />
    </View>
  );
}
