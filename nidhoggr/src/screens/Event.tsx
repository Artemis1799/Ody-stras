import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Image,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import {
  useNavigation,
  useRoute,
  useFocusEffect,
} from "@react-navigation/native";
import { useSQLiteContext } from "expo-sqlite";
import {
  Area,
  Evenement,
  EventScreenNavigationProp,
  Path,
  PointOnMap,
} from "../../types/types";
import { getAllWhere, getPointsForEvent } from "../../database/queries";
import { Strings } from "../../types/strings";
import { Header } from "../components/header";
import { useTheme } from "../utils/ThemeContext";
import { getStyles } from "../utils/theme";
import RenderAreas from "../utils/RenderAreas";
import RenderPaths from "../utils/RenderPaths";

export default function EventScreen() {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const route = useRoute();
  const db = useSQLiteContext();
  const params = route.params as Evenement;
  const eventUUID = params.UUID;
  const [areas, setAreas] = useState<Area[]>([]);
  const [paths, setPaths] = useState<Path[]>([]);
  const [eventData, setEventData] = useState<Evenement>(params);
  const [points, setPoints] = useState<PointOnMap[]>([]);

  const mapRef = useRef<MapView>(null);
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  useEffect(() => {
    (async () => {
      console.log(route.params);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        console.log("Permission de localisation refusée");
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const coords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
      setUserLocation(coords);

      mapRef.current?.animateToRegion(
        {
          ...coords,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        },
        1000
      );
    })();
  }, []);

  useFocusEffect(
    useCallback(() => {
      const loadEvent = async () => {
        try {
          const events = await getAllWhere<Evenement>(
            db,
            "Evenement",
            ["UUID"],
            [eventUUID]
          );
          if (events.length > 0) {
            setEventData(events[0]);
          }
          //Récupération des géométries
          const areasDB = await getAllWhere<Area>(
            db,
            "Area",
            ["EventID"],
            [eventUUID]
          );
          const pathsDB = await getAllWhere<Path>(
            db,
            "Path",
            ["EventID"],
            [eventUUID]
          );
          //const areasGeoJsonList = areasDB.map((g) => g.GeoJson);
          //const pathsGeoJsonList = pathsDB.map((g) => g.GeoJson);
          setAreas(areasDB);
          setPaths(pathsDB);
          const sql: PointOnMap[] = await getPointsForEvent(db, eventUUID);

          const pts: PointOnMap[] = sql.map((row: PointOnMap) => ({
            UUID: row.UUID,
            Latitude: row.Latitude,
            Longitude: row.Longitude,
            EquipType: row.EquipmentType,
            Name: row.Name,
          }));
          console.log("sql===");
          console.log(sql);
          console.log("pts===");
          console.log(pts);
          setPoints(pts);
        } catch (err) {
          console.error("Erreur lors du chargement de l'événement:", err);
        }
      };
      loadEvent();
    }, [db, eventUUID])
  );

  const navigation = useNavigation<EventScreenNavigationProp>();

  return (
    <SafeAreaView style={styles.container}>
      <Header />
      <ScrollView style={styles.content}>
        {/* Event Title */}
        <View style={styles.titleContainer}>
          <Text style={styles.eventTitle}>{eventData.Title}</Text>
        </View>

        {/* Map Container */}
        <View style={styles.mapContainer}>
          <MapView
            ref={mapRef}
            style={styles.mapImage}
            initialRegion={{
              latitude: 48.8566,
              longitude: 2.3522,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
            showsUserLocation={true}
            showsMyLocationButton={true}
          >
            {points.map((point) => (
              <Marker
                key={point.UUID}
                coordinate={{
                  latitude: point.Latitude,
                  longitude: point.Longitude,
                }}
                anchor={{ x: 0.5, y: 1 }}
              >
                <View style={styles.markerContainer}>
                  <Text style={styles.markerType}>
                    {point.EquipmentType ?? Strings.map.noEquipment}
                  </Text>
                </View>
              </Marker>
            ))}
            <RenderAreas areas={areas} />
            <RenderPaths paths={paths} />
          </MapView>
        </View>

        {/* Action Buttons - juste après la map */}
        {eventData.Mode === "planning" ? (
          // Mode Planning : Boutons Planning/Pose/Dépose
          <View>
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.pointsButton, { backgroundColor: "#0E47A1" }]}
                onPress={() => navigation.navigate("PlanningTimeline", { eventId: eventUUID })}
              >
                <Text style={styles.buttonText}>📋 Planning</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.pointsButton, { backgroundColor: "#43A047", flex: 1, flexDirection: "column", paddingVertical: 12 }]}
                onPress={() => navigation.navigate("PlanningNavigation", { eventId: eventUUID, taskType: "installation" })}
              >
                <Text style={{ fontSize: 24 }}>🔧</Text>
                <Text style={styles.buttonText}>Pose</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.pointsButton, { backgroundColor: "#FF9800", flex: 1, flexDirection: "column", paddingVertical: 12 }]}
                onPress={() => navigation.navigate("PlanningNavigation", { eventId: eventUUID, taskType: "mixed" })}
              >
                <Text style={{ fontSize: 24 }}>▶️</Text>
                <Text style={styles.buttonText}>Tout</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.pointsButton, { backgroundColor: "#E53935", flex: 1, flexDirection: "column", paddingVertical: 12 }]}
                onPress={() => navigation.navigate("PlanningNavigation", { eventId: eventUUID, taskType: "removal" })}
              >
                <Text style={{ fontSize: 24 }}>📦</Text>
                <Text style={styles.buttonText}>Dépose</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          // Mode Création : Boutons classiques
          <View>
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.pointsButton}
                onPress={() => navigation.navigate("Map", { eventId: eventUUID })}
              >
                <Text style={styles.buttonText}>{Strings.event.addPoints}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.pointsButton}
                onPress={() => navigation.navigate("Points", { eventUUID })}
              >
                <Text style={styles.buttonText}>{Strings.event.managePoints}</Text>
              </TouchableOpacity>
            </View>
            <View>
              <TouchableOpacity
                style={styles.exportButton}
                onPress={() => navigation.navigate("ExportEvent", { eventUUID })}
              >
                <Text style={styles.buttonText}>{Strings.event.exportEvent}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Event Details - après les boutons */}
        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>
              {Strings.event.descriptionLabel}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{Strings.event.dateLabel}</Text>
            <Text style={styles.detailValue}>
              {new Date(eventData.StartDate).toLocaleDateString("fr-FR")} -
              {new Date(eventData.EndDate).toLocaleDateString("fr-FR")}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{Strings.event.statusLabel}</Text>
            <Text style={styles.detailValue}>{eventData.Status}</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
