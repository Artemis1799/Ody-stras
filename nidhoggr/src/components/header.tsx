import { View, Image, TouchableOpacity, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../utils/ThemeContext";
import { getStyles } from "../utils/theme";
import { useSQLiteContext } from "expo-sqlite";
import { deleteDatabase } from "../../database/database";

type HeaderProps = {
  onBack?: () => void; // optionnel : fonction perso
  showBack?: boolean; // optionnel : pour cacher le bouton
  rightIcon?: React.ReactNode; // optionnel : icône custom à droite
};

export function Header({ onBack, showBack = true, rightIcon }: HeaderProps) {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const db = useSQLiteContext();

  const handleBack = () => {
    if (onBack) return onBack(); // si custom → utiliser la fonction fournie
    navigation.goBack(); // sinon → goBack par défaut
  };

  const handleResetDatabase = () => {
    Alert.alert(
      "Réinitialiser la base",
      "Êtes-vous sûr de vouloir supprimer toutes les données ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDatabase(db, "base.db");
              Alert.alert("Succès", "Base de données supprimée. Redémarrez l'application.");
            } catch (e) {
              console.error(e);
              Alert.alert("Erreur", "Impossible de supprimer la base de données.");
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.header}>
      {showBack ? (
        <TouchableOpacity onPress={handleBack}>
          <Ionicons name="arrow-back" size={28} color="white" />
        </TouchableOpacity>
      ) : (
        <TouchableOpacity onPress={handleResetDatabase}>
          <Ionicons name="trash-outline" size={28} color="white" />
        </TouchableOpacity>
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
