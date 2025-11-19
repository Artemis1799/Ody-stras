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

interface PointType {
  UUID: string;
  Event_ID: string;
  Latitude: number;
  Longitude: number;
  Commentaire: string;
  Image_ID: string;
  Ordre: number;
  Valide: boolean;
  Created: string;
  Modified: string;
}

export default function PointsScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { eventUUID } = route.params as { eventUUID: string };
  const db = useSQLiteContext();
  const [points, setPoints] = useState<PointType[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      const getPoints = async () => {
        try {
          const data: PointType[] = await db.getAllAsync(
            "SELECT * FROM Point WHERE Event_ID = ? ORDER BY Ordre ASC",
            [eventUUID]
          );
          console.log(data);
          setPoints(data);
        } catch (err) {
          console.error(err);
          Alert.alert("Erreur DB", "Impossible de récupérer les points.");
        } finally {
          setLoading(false);
        }
      };

      getPoints();
    }, [db, eventUUID])
  );

  const movePoint = async (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === points.length - 1)
    ) {
      return;
    }

    console.log('=== AVANT DÉPLACEMENT ===');
    points.forEach((p, i) => console.log(`Point ${i}: UUID=${p.UUID.substring(0, 8)}, Ordre=${p.Ordre}, Commentaire=${p.Commentaire}`));

    const newPoints = [...points];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    // Échanger les éléments
    [newPoints[index], newPoints[targetIndex]] = [newPoints[targetIndex], newPoints[index]];
    
    // Mettre à jour les numéros d'ordre de tous les points
    const updatedPoints = newPoints.map((point, idx) => ({
      ...point,
      Ordre: idx + 1
    }));
    
    console.log('=== APRÈS DÉPLACEMENT ===');
    updatedPoints.forEach((p, i) => console.log(`Point ${i}: UUID=${p.UUID.substring(0, 8)}, Ordre=${p.Ordre}, Commentaire=${p.Commentaire}`));
    
    setPoints(updatedPoints);

    // Mettre à jour l'ordre dans la base de données
    try {
      console.log('=== MISE À JOUR BDD ===');
      for (let i = 0; i < updatedPoints.length; i++) {
        console.log(`UPDATE Point SET Ordre=${updatedPoints[i].Ordre} WHERE UUID=${updatedPoints[i].UUID.substring(0, 8)}`);
        await db.runAsync(
          "UPDATE Point SET Ordre = ? WHERE UUID = ?",
          [updatedPoints[i].Ordre, updatedPoints[i].UUID]
        );
      }
      console.log('=== MISE À JOUR BDD TERMINÉE ===');
    } catch (err) {
      console.error("Erreur lors de la mise à jour de l'ordre:", err);
      Alert.alert("Erreur", "Impossible de mettre à jour l'ordre des points.");
    }
  };

  const renderItem = ({ item, index }: { item: PointType; index: number }) => (
    <View style={styles.pointItemContainer}>
      <View style={styles.reorderButtons}>
        <TouchableOpacity
          onPress={() => movePoint(index, 'up')}
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
          onPress={() => movePoint(index, 'down')}
          disabled={index === points.length - 1}
          style={styles.reorderButton}
        >
          <Ionicons
            name="chevron-down"
            size={20}
            color={index === points.length - 1 ? "#ccc" : "#666"}
          />
        </TouchableOpacity>
      </View>
      <TouchableOpacity
        style={styles.pointItem}
        onPress={() =>
          navigation.navigate("AddPoint", {
            eventId: eventUUID,
            pointId: item.UUID,
          })
        }
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{item.Ordre}</Text>
        </View>
        <Text style={styles.pointName}>
          {item.Commentaire || `Point ${item.Ordre}`}
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

      <TouchableOpacity
        style={styles.fab}
        onPress={() => console.log("Add point")}
      >
        <Ionicons name="add" size={30} color="white" />
      </TouchableOpacity>
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
  fab: {
    position: "absolute",
    bottom: 25,
    right: 25,
    backgroundColor: "#A6CE39",
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
});
