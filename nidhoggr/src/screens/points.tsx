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
import { useNavigation, useRoute, useFocusEffect } from "@react-navigation/native";
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

  const renderItem = ({ item }: { item: PointType }) => (
    <TouchableOpacity style={styles.pointItem}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{item.Ordre}</Text>
      </View>
      <Text style={styles.pointName}>{item.Commentaire || `Point ${item.Ordre}`}</Text>
      <Ionicons name="chevron-forward-outline" size={20} color="#000" />
    </TouchableOpacity>
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
  pointItem: {
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