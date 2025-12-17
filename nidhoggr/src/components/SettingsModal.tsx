import React from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Checkbox from "expo-checkbox";
import { useTheme } from "../utils/ThemeContext";
import { useSQLiteContext } from "expo-sqlite";
import { deleteDatabase } from "../../database/database";

type SettingsModalProps = {
  visible: boolean;
  onClose: () => void;
};

export function SettingsModal({ visible, onClose }: SettingsModalProps) {
  const { theme, toggleTheme, skipVideo, toggleSkipVideo, colors } = useTheme();
  const db = useSQLiteContext();

  const handleResetDatabase = () => {
    Alert.alert(
      "Réinitialiser la base",
      "Êtes-vous sûr de vouloir supprimer toutes les données ? L'application devra redémarrer.",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDatabase(db, "base.db");
              Alert.alert(
                "Succès",
                "Base de données supprimée. Redémarrez l'application."
              );
              // Optionnel : Forcer la fermeture ou recharger les données si possible
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
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <View style={[styles.modalView, { backgroundColor: colors.card }]}>
          <View style={styles.headerRow}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Paramètres
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Theme Toggle */}
          <View style={styles.settingRow}>
            <Text style={[styles.settingText, { color: colors.text }]}>
              Mode Sombre
            </Text>
            <Switch
              trackColor={{ false: "#767577", true: "#A6CE39" }}
              thumbColor={theme === "dark" ? "#f4f3f4" : "#f4f3f4"}
              ios_backgroundColor="#3e3e3e"
              onValueChange={toggleTheme}
              value={theme === "dark"}
            />
          </View>

          {/* Skip Video Checkbox */}
          <View style={styles.settingRow}>
            <Text style={[styles.settingText, { color: colors.text }]}>
              Passer l'intro vidéo
            </Text>
            <Checkbox
              value={skipVideo}
              onValueChange={toggleSkipVideo}
              color={skipVideo ? colors.fab : undefined}
            />
          </View>

          {/* Reset DB */}
          <View style={styles.divider} />
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleResetDatabase}
          >
            <Ionicons name="trash-outline" size={20} color="white" />
            <Text style={styles.deleteButtonText}>Réinitialiser la base</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalView: {
    width: "80%",
    borderRadius: 20,
    padding: 25,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  settingText: {
    fontSize: 16,
  },
  divider: {
    height: 1,
    backgroundColor: "#ccc",
    marginVertical: 15,
  },
  deleteButton: {
    backgroundColor: "#ff4444",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
    borderRadius: 10,
  },
  deleteButtonText: {
    color: "white",
    fontWeight: "bold",
    marginLeft: 10,
  },
});
