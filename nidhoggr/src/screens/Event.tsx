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
import { useNavigation, useRoute, useFocusEffect } from "@react-navigation/native";
import { useSQLiteContext } from "expo-sqlite";
import { Evenement, EventScreenNavigationProp } from "../../types/types";
import { getAllWhere } from "../../database/queries";
import { Strings } from "../../types/strings";

export default function EventScreen() {
  const route = useRoute();
  const db = useSQLiteContext();
  const params = route.params as Evenement;
  const eventUUID = params.UUID;

  const [eventData, setEventData] = useState<Evenement>(params);

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

      <ScrollView style={styles.content}>
        {/* Event Title */}
        <View style={styles.titleContainer}>
          <Text style={styles.eventTitle}>{eventData.Nom}</Text>
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
          ></MapView>
        </View>

        {/* Event Details */}
        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{Strings.event.descriptionLabel}</Text>
            <Text style={styles.detailValue}>{eventData.Description}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{Strings.event.dateLabel}</Text>
            <Text style={styles.detailValue}>
              {new Date(eventData.Date_debut).toLocaleDateString("fr-FR")}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{Strings.event.statusLabel}</Text>
            <Text style={styles.detailValue}>{eventData.Status}</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.pointsButton}
            onPress={() => {
              navigation.navigate("Map", { eventId: eventUUID });
            }}
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
          <TouchableOpacity style={styles.exportButton} onPress={() => navigation.navigate("ExportEvent", { eventUUID })}>
            <Text style={styles.buttonText}>{Strings.event.exportEvent}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
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
  content: {
    flex: 1,
  },
  titleContainer: {
    backgroundColor: "#F0F0F0",
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  mapContainer: {
    height: 250,
    backgroundColor: "#E8F5E9",
    position: "relative",
  },
  mapImage: {
    width: "100%",
    height: "100%",
  },
  detailsContainer: {
    backgroundColor: "white",
    paddingHorizontal: 20,
    paddingVertical: 20,
    marginTop: 10,
  },
  detailRow: {
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    color: "#666",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 12,
  },
  pointsButton: {
    flex: 1,
    backgroundColor: "#8FB34E",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  exportButton: {
    backgroundColor: "#8FB34E",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    marginLeft: 20,
    marginRight: 20,
  },
  buttonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
});
