import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Image,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";
import {
  useNavigation,
  useRoute,
  useFocusEffect,
} from "@react-navigation/native";
import { useSQLiteContext } from "expo-sqlite";
import * as Location from "expo-location";
import {
  EventScreenNavigationProp,
  Point,
  PointOnMap,
  mapParams,
} from "../../types/types";
import { getPointsForEvent } from "../../database/queries";

export function MapScreen() {
  const navigation = useNavigation<EventScreenNavigationProp>();
  const route = useRoute();
  const db = useSQLiteContext();
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const mapRef = useRef<MapView>(null);

  const { eventId, eventName } = route.params as mapParams;

  const [points, setPoints] = useState<PointOnMap[]>([]);

  const recenterOnMap = () => {
    if (latitude && longitude && mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: latitude,
          longitude: longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        },
        1000
      );
    }
  };

  const loadPoints = async () => {
    try {
      console.log("calling loadPoints");
      const sql: PointOnMap[] = await getPointsForEvent(db, eventId);

      const pts: PointOnMap[] = sql.map((row: PointOnMap) => ({
        UUID: row.UUID,
        Latitude: row.Latitude,
        Longitude: row.Longitude,
        EquipType: row.EquipType,
        Equipement_quantite: row.Equipement_quantite,
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

  useEffect(() => {
    const getLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          console.log("Permission de localisation refusée");
          return;
        }

        const location = await Location.getCurrentPositionAsync({});
        setLatitude(location.coords.latitude);
        setLongitude(location.coords.longitude);

        // Centrer la carte sur la position de l'utilisateur
        if (mapRef.current) {
          mapRef.current.animateToRegion(
            {
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            },
            1000
          );
        }
      } catch (error) {
        console.log(
          "Erreur lors de la récupération de la localisation:",
          error
        );
      }
    };

    getLocation();
  }, []);

  const handleMarkerPress = (point: PointOnMap) => {
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
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={28} color="white" />
        </TouchableOpacity>
        <Image
          source={require("../../ressources/header.png")}
          style={styles.headerImage}
        />
        <Ionicons name="person-circle-outline" size={28} color="white" />
      </View>

      <MapView
        ref={mapRef}
        style={styles.map}
        showsUserLocation={true}
        showsMyLocationButton={true}
        showsCompass={true}
        rotateEnabled={true}
        pitchEnabled={true}
        initialRegion={{
          latitude: latitude ?? 48.5839,
          longitude: longitude ?? 7.7507,
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
              <Text style={styles.markerQty}>
                {point.Equipement_quantite ?? 0}
              </Text>
              <Text style={styles.markerType}>
                {point.EquipType ?? "Aucun équipement"}
              </Text>
            </View>
          </Marker>
        ))}
        <TouchableOpacity
          style={{
            position: "absolute",
            bottom: 10,
            right: 10,
            backgroundColor: "#9EC54D",
            borderRadius: 25,
            width: 50,
            height: 50,
            alignItems: "center",
            justifyContent: "center",
            filter: "invert(1)",
          }}
          onPress={recenterOnMap}
        >
          <Image
            source={require("../../ressources/recentrer.png")}
            style={{ width: 30, height: 30 }}
          />
        </TouchableOpacity>
      </MapView>

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate("AddPoint", { eventId })}
      >
        <Text style={styles.addButtonText}>Placer un point</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#8FB34E",
  },
  headerImage: {
    width: 120,
    height: 30,
    resizeMode: "contain",
  },
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
