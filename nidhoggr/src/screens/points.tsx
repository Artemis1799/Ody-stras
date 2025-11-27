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
import { getAllWhere, update } from "../../database/queries";
import { Strings } from "../../types/strings";

export default function PointsScreen() {
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
          Alert.alert(Strings.errors.dbError, Strings.errors.fetchPointsMessage);
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
        `Point ${i}: UUID=${p.UUID.substring(0, 8)}, Ordre=${p.Ordre
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
        `Point ${i}: UUID=${p.UUID.substring(0, 8)}, Ordre=${p.Ordre
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
      Alert.alert(Strings.errors.updateOrderError, Strings.errors.updateOrderMessage);
    }
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
        <Text style={styles.pointName}>
          {item.Commentaire || Strings.points.pointLabel(item.Ordre ?? 0)}
        </Text>
        <Ionicons name="chevron-forward-outline" size={20} color="#000" />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back-outline" size={28} color="white" />
        </TouchableOpacity>
        <Image
          source={require("../../ressources/header.png")}
          style={styles.headerImage}
        />
        <Ionicons name="person-circle-outline" size={28} color="white" />
      </View>

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

const styles = StyleSheet.create({
  headerImage: {
    width: "40%",
    height: 30,
    alignSelf: "center",
  },
  container: {
    flex: 1,
    backgroundColor: "#f8f8fc",
  },
  header: {
    backgroundColor: "#9EC54D",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 30,
    paddingBottom: 10,
    paddingLeft: 14,
    paddingRight: 14,
  },
  headerText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 18,
  },
  listContainer: {
    padding: 20,
  },
  pointItemContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  reorderButtons: {
    marginRight: 8,
    justifyContent: "center",
  },
  reorderButton: {
    padding: 4,
  },
  pointItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#E5E0FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  avatarText: {
    fontWeight: "bold",
    color: "#6B5EFF",
  },
  pointName: {
    flex: 1,
    fontSize: 16,
  },
  bottomButtonContainer: {
    padding: 20,
    paddingBottom: 25,
    backgroundColor: "#f8f8fc",
  },
  simulateButton: {
    backgroundColor: "#A6CE39",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  buttonIcon: {
    marginRight: 8,
  },
  simulateButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});
