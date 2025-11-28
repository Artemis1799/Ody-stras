import { View, Image, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../utils/ThemeContext";
import { getStyles } from "../utils/theme";

type HeaderProps = {
  onBack?: () => void; // optionnel : fonction perso
  showBack?: boolean; // optionnel : pour cacher le bouton
  rightIcon?: React.ReactNode; // optionnel : icône custom à droite
};

export function Header({ onBack, showBack = true, rightIcon }: HeaderProps) {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const styles = getStyles(theme);

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
        <View style={{ width: 28 }} /> // pour garder la mise en page
      )}

      <Image
        source={
          theme === "light"
            ? require("../../ressources/headerLight.png")
            : require("../../ressources/headerBlack.png")
        }
        style={styles.headerImage}
      />

      {rightIcon ?? ( // si tu passes rien → icône default
        <Ionicons name="person-circle-outline" size={28} color="white" />
      )}
    </View>
  );
}
