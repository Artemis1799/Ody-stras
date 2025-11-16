import React, { useEffect, useState, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import MapView, { Marker } from "react-native-maps";
import {
  useNavigation,
  useRoute,
  useFocusEffect,
} from "@react-navigation/native";
import { useSQLiteContext } from "expo-sqlite";

export function MapScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const db = useSQLiteContext();

  const { eventId, eventName } = route.params;

  const [points, setPoints] = useState([]);

  const loadPoints = async () => {
    try {
      console.log("calling loadPoints");
      const sql = await db.getAllAsync(
        `SELECT Point.*, Equipement.Type AS EquipType
         FROM Point
         LEFT JOIN Equipement ON Equipement.UUID = Point.Equipement_ID
         WHERE Point.Event_ID = ?`,
        [eventId]
      );

      const pts = sql.map((row) => ({
        UUID: row.UUID,
        Latitude: row.Latitude,
        Longitude: row.Longitude,
        equipement_type: row.EquipType,
        quantite: row.Equipement_quantite,
      }));
      console.log("sql===");
      console.log(sql);
      console.log("pts===");
      console.log(pts);
      setPoints(pts);
    } catch (e) {
      console.log("Erreur chargement points :", e);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadPoints();
    }, [db])
  );

  const handleMarkerPress = (point) => {
    try {
      console.log(point);
      navigation.navigate("AddPoint", {
        eventId,
        pointId: point.UUID,
      });
    } catch (e) {
      console.log(e);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.eventTitle}>{eventName}</Text>
      </View>

      <MapView
        style={styles.map}
        initialRegion={{
          latitude: 48.5846,
          longitude: 7.7507,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
      >
        {points.map((point) => (
          <Marker
            key={point.UUID}
            coordinate={{
              latitude: point.Latitude,
              longitude: point.Longitude,
            }}
            onPress={() => handleMarkerPress(point)}
            anchor={{ x: 0.5, y: 1 }}
          >
            <View style={styles.markerContainer}>
              <Text style={styles.markerQty}>{point.quantite ?? 0}</Text>
              <Text style={styles.markerType}>
                {point.equipement_type ?? "Aucun équipement"}
              </Text>
            </View>
          </Marker>
        ))}
      </MapView>

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate("AddPoint", { eventId })}
      >
        <Text style={styles.addButtonText}>Placer un point</Text>
      </TouchableOpacity>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    backgroundColor: "#9EC54D",
    height: 80,
    alignItems: "center",
    justifyContent: "center",
  },
  eventTitle: { color: "white", fontSize: 22, fontWeight: "600" },
  map: { flex: 1 },
  Marker: { width: 200, height: 200 },
  markerContainer: {
    width: 50,
    height: 50,
    paddingVertical: 6,
    backgroundColor: "white",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#9EC54D",
    alignItems: "center",
    justifyContent: "center",
  },
  markerQty: { fontSize: 10, fontWeight: "700", color: "#333" },
  markerType: { fontSize: 8, color: "#555", textAlign: "center" },
  addButton: {
    backgroundColor: "#9EC54D",
    padding: 15,
    margin: 20,
    borderRadius: 10,
    alignItems: "center",
  },
  addButtonText: { color: "#fff", fontSize: 18, fontWeight: "500" },
});
