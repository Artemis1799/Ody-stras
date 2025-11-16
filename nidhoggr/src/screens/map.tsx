import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useSQLiteContext } from "expo-sqlite";

interface pointType {
  UUID: string;
  Nom: string;
  Date_debut: Date;
  Status: string;
  Responsable: string;
}

export function MapScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const db = useSQLiteContext(); // <<< OK
  const { eventId, eventName } = route.params;

  const [points, setPoints] = useState([]);

  const loadPoints = async () => {
    try {
      const res = await db.getAllAsync(
        "SELECT * FROM Point WHERE Event_ID = ?",
        [eventId]
      );
      console.log("==============RES===============");
      console.log(res);
      setPoints(res);
    } catch (e) {
      console.log("Erreur chargement points :", e);
    }
  };

  useEffect(() => {
    loadPoints();
  }, [db]);

  const handleMarkerPress = (point) => {
    navigation.navigate("AddPoint", {
      eventId,
      pointId: point.UUID,
    });
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
            pinColor="orange"
            onPress={() => handleMarkerPress(point)}
          />
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
  eventTitle: {
    color: "white",
    fontSize: 22,
    fontWeight: "600",
  },
  map: {
    flex: 1,
  },
  addButton: {
    backgroundColor: "#9EC54D",
    padding: 15,
    margin: 20,
    borderRadius: 10,
    alignItems: "center",
  },
  addButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "500",
  },
});
