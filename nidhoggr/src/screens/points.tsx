import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  SafeAreaView,
  Alert,
} from "react-native";
import {
  useNavigation,
  useRoute,
  useFocusEffect,
} from "@react-navigation/native";
import { useSQLiteContext } from "expo-sqlite";

import { Ionicons } from "@expo/vector-icons";
import { EventScreenNavigationProp, Point } from "../../types/types";
import { getAllWhere, update, deleteWhere } from "../../database/queries";
import { Strings } from "../../types/strings";
import { Header } from "../components/header";
import { useTheme } from "../utils/ThemeContext";
import { getStyles } from "../utils/theme";

export default function PointsScreen() {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const navigation = useNavigation<EventScreenNavigationProp>();
  const route = useRoute();
  const { eventUUID } = route.params as { eventUUID: string };
  const db = useSQLiteContext();
  const [points, setPoints] = useState<Point[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      const getPoints = async () => {
        try {
          const data: Point[] = await getAllWhere<Point>(
            db,
            "Point",
            ["Event_ID"],
            [eventUUID],
            "Ordre ASC"
          );
          setPoints(data);
        } catch (err) {
          console.error(err);
          Alert.alert(
            Strings.errors.dbError,
            Strings.errors.fetchPointsMessage
          );
        } finally {
          setLoading(false);
        }
      };

      getPoints();
    }, [db, eventUUID])
  );

  const movePoint = async (index: number, direction: "up" | "down") => {
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === points.length - 1)
    ) {
      return;
    }

    console.log("=== AVANT DÉPLACEMENT ===");
    points.forEach((p, i) =>
      console.log(
        `Point ${i}: UUID=${p.UUID.substring(0, 8)}, Ordre=${
          p.Ordre
        }, Commentaire=${p.Commentaire}`
      )
    );

    const newPoints = [...points];
    const targetIndex = direction === "up" ? index - 1 : index + 1;

    // Échanger les éléments
    [newPoints[index], newPoints[targetIndex]] = [
      newPoints[targetIndex],
      newPoints[index],
    ];

    // Mettre à jour les numéros d'ordre de tous les points
    const updatedPoints: Point[] = newPoints.map((point, idx) => ({
      ...point,
      Ordre: idx + 1,
    }));

    console.log("=== APRÈS DÉPLACEMENT ===");
    updatedPoints.forEach((p, i) =>
      console.log(
        `Point ${i}: UUID=${p.UUID.substring(0, 8)}, Ordre=${
          p.Ordre
        }, Commentaire=${p.Commentaire}`
      )
    );

    setPoints(updatedPoints);

    // Mettre à jour l'ordre dans la base de données
    try {
      console.log("=== MISE À JOUR BDD ===");
      for (let i = 0; i < updatedPoints.length; i++) {
        if (updatedPoints[i].Ordre)
          await update<Point>(
            db,
            "Point",
            { Ordre: updatedPoints[i].Ordre },
            "UUID = ?",
            [updatedPoints[i].UUID]
          );
      }
      console.log("=== MISE À JOUR BDD TERMINÉE ===");
    } catch (err) {
      console.error("Erreur lors de la mise à jour de l'ordre:", err);
      Alert.alert(
        Strings.errors.updateOrderError,
        Strings.errors.updateOrderMessage
      );
    }
  };

  const deletePoint = async (point: Point) => {
    Alert.alert(
      "Supprimer le point",
      `Êtes-vous sûr de vouloir supprimer ${point.Commentaire || `Point ${point.Ordre}`} ?`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteWhere(db, "Point", ["UUID"], [point.UUID]);
              setPoints((prev) => prev.filter((p) => p.UUID !== point.UUID));
            } catch (err) {
              console.error("Erreur lors de la suppression:", err);
              Alert.alert("Erreur", "Impossible de supprimer le point");
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item, index }: { item: Point; index: number }) => (
    <View style={styles.pointItemContainer}>
      {/*Pour l'instant on désactive les boutons de réordonnancement

      <View style={styles.reorderButtons}>
        <TouchableOpacity
          onPress={() => movePoint(index, "up")}
          disabled={index === 0}
          style={styles.reorderButton}
        >
          <Ionicons
            name="chevron-up"
            size={20}
            color={index === 0 ? "#ccc" : "#666"}
          />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => movePoint(index, "down")}
          disabled={index === points.length - 1}
          style={styles.reorderButton}
        >
          <Ionicons
            name="chevron-down"
            size={20}
            color={index === points.length - 1 ? "#ccc" : "#666"}
          />
        </TouchableOpacity>
      </View>*/}
      <TouchableOpacity
        style={styles.pointItem}
        onPress={() =>
          navigation.navigate("AddPoint", {
            eventId: eventUUID,
            pointIdParam: item.UUID,
          })
        }
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{item.Ordre}</Text>
        </View>
        <Text style={[styles.pointName, { flex: 1 }]}>
          {item.Commentaire || Strings.points.pointLabel(item.Ordre ?? 0)}
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <TouchableOpacity
            style={{ padding: 10 }}
            onPress={() => deletePoint(item)}
          >
            <Ionicons name="trash-outline" size={24} color="red" />
          </TouchableOpacity>
          <Ionicons name="chevron-forward-outline" size={20} color="#000" />
        </View>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Header />
      <FlatList
        data={points}
        renderItem={renderItem}
        keyExtractor={(item) => item.UUID}
        contentContainerStyle={styles.listContainer}
      />

      {/* On commente le bouton de simulation pour l'instant
      
      <View style={styles.bottomButtonContainer}>
        <TouchableOpacity
          style={styles.simulateButton}
          onPress={() => navigation.navigate("SimulateScreen", { eventUUID })}
        >
          <Ionicons
            name="navigate"
            size={20}
            color="white"
            style={styles.buttonIcon}
          />
          <Text style={styles.simulateButtonText}>Simuler l'itinéraire</Text>
        </TouchableOpacity>
      </View>*/}
    </SafeAreaView>
  );
}
