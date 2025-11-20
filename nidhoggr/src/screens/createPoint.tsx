import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Image,
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";
import MapView, { Marker, Region } from "react-native-maps";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import uuid from "react-native-uuid";
import * as Location from "expo-location";
import { Float } from "react-native/Libraries/Types/CodegenTypes";
import { useSQLiteContext } from "expo-sqlite";
import DropDownPicker from "react-native-dropdown-picker";
import {
  Equipement,
  EquipementList,
  EventScreenNavigationProp,
  Point,
  UserLocation,
  createPointParams,
} from "../../types/types";
import { getAll, getAllWhere, insert, update } from "../../database/queries";

export function CreatePointScreen() {
  const db = useSQLiteContext();

  const [open, setOpen] = useState(false);
  const navigation = useNavigation<EventScreenNavigationProp>();
  const [comment, setComment] = useState("");
  const [qty, setQty] = useState("");
  const [equipmentList, setEquipmentList] = useState<EquipementList[]>([]);
  const [equipment, setEquipment] = useState<string | null>(null);
  const [pointId, setPointId] = useState("");
  const mapRef = useRef<MapView>(null);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [markerPosition, setMarkerPosition] = useState<UserLocation | null>(null);
  const route = useRoute();
  const { eventId, pointIdParam } = route.params as createPointParams;

  const handleGoBack = async () => {
    if (!pointIdParam) {
      try {
        await db.runAsync("DELETE FROM Point WHERE UUID = ?", [pointId]);
        console.log("Point supprimé (non validé)");
      } catch (error) {
        console.log("Erreur lors de la suppression du point:", error);
      }
    }
    navigation.goBack();
  };

  const toggleEditLocation = async () => {
    if (isEditingLocation) {
      // Mode validation : on sauvegarde la position
      if (markerPosition) {
        try {
          await update<Point>(
            db,
            "Point",
            { Latitude: markerPosition.latitude, Longitude: markerPosition.longitude },
            "UUID = ?",
            [pointId]
          );
          console.log("Position mise à jour");
        } catch (error) {
          console.log("Erreur lors de la mise à jour de la position:", error);
        }
      }
    }
    setIsEditingLocation(!isEditingLocation);
  };

  const handleRegionChange = (region: Region) => {
    if (isEditingLocation) {
      setMarkerPosition({
        latitude: region.latitude,
        longitude: region.longitude,
      });
    }
  };

  const validate = async () => {
    try {
      if (!comment) {
        alert("Veuillez ajouter un commentaire");
        return;
      }
      if (!equipment) {
        alert("Veuillez sélectionner un type d'équipement");
        return;
      }
      if (!qty || Number(qty) < 1) {
        alert("Veuillez entrer une quantité supérieure à 0");
        return;
      }

      await update<Point>(db, "Point", { Commentaire: comment }, "UUID = ?", [
        pointId,
      ]);
      await update<Point>(
        db,
        "Point",
        { Equipement_quantite: Number(qty), Equipement_ID: equipment },
        "UUID = ?",
        [pointId]
      );

      navigation.goBack();
    } catch (e) {
      console.log(e);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        console.log("pointIdParam : " + pointIdParam);
        let newId = pointIdParam ?? uuid.v4();
        setPointId(newId);
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
        setMarkerPosition(coords);

        mapRef.current?.animateToRegion(
          {
            ...coords,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          },
          1000
        );
        if (!pointIdParam) {
          // Récupérer le nombre de points existants pour définir l'ordre
          const existingPoints = await getAllWhere<Point>(
            db,
            "Point",
            ["Event_ID"],
            [eventId]
          );
          const nextOrdre = existingPoints.length + 1;

          await insert<Point>(db, "Point", {
            UUID: newId,
            Event_ID: eventId,
            Latitude: coords.latitude,
            Longitude: coords.longitude,
            Equipement_ID: "f50252ce-31bb-4c8b-a70c-51b7bb630bc3",
            Equipement_quantite: 0,
            Ordre: nextOrdre,
          });
        } else {
          const res = await getAllWhere<Point>(db, "Point", ["UUID"], [newId]);
          if (res[0]) {
            setComment(res[0].Commentaire);
            if (res[0]?.Equipement_ID) setEquipment(res[0].Equipement_ID);
            if (res[0]?.Equipement_quantite)
              setQty(res[0].Equipement_quantite.toString());
            // Charger la position du point existant
            if (res[0].Latitude && res[0].Longitude) {
              const existingCoords = {
                latitude: res[0].Latitude,
                longitude: res[0].Longitude,
              };
              setMarkerPosition(existingCoords);
              mapRef.current?.animateToRegion(
                {
                  ...existingCoords,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                },
                1000
              );
            }
          }
        }

        const equipments = await getAll<Equipement>(db, "Equipement");
        setEquipmentList(
          equipments.map((e) => ({
            label: e.Type,
            value: e.UUID,
          }))
        );
      } catch (e) {
        console.log(e);
      }
    })();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleGoBack}>
          <Ionicons name="arrow-back" size={28} color="white" />
        </TouchableOpacity>
        <Image
          source={require("../../ressources/header.png")}
          style={styles.headerImage}
        />
        <Ionicons name="person-circle-outline" size={28} color="white" />
      </View>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={{ flex: 1 }}>
          <View style={styles.mapContainer}>
            <MapView
              ref={mapRef}
              style={styles.map}
              initialRegion={{
                latitude: userLocation?.latitude || 48.5839,
                longitude: userLocation?.longitude || 7.7455,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }}
              showsUserLocation={true}
              showsMyLocationButton={!isEditingLocation}
              followsUserLocation={false}
              showsCompass={true}
              rotateEnabled={!isEditingLocation}
              pitchEnabled={!isEditingLocation}
              scrollEnabled={isEditingLocation}
              zoomEnabled={isEditingLocation}
              onRegionChangeComplete={handleRegionChange}
            >
              {!isEditingLocation && markerPosition && (
                <Marker
                  coordinate={{
                    latitude: markerPosition.latitude,
                    longitude: markerPosition.longitude,
                  }}
                />
              )}
            </MapView>
            {isEditingLocation && (
              <View style={styles.centerMarker}>
                <Ionicons name="location-sharp" size={48} color="#8DC63F" />
              </View>
            )}
          </View>

          <TouchableOpacity
            style={styles.editLocationButton}
            onPress={toggleEditLocation}
          >
            <Ionicons
              name={isEditingLocation ? "checkmark-circle" : "location"}
              size={20}
              color="#8DC63F"
              style={{ marginRight: 8 }}
            />
            <Text style={styles.editLocationButtonText}>
              {isEditingLocation ? "Valider la position" : "Modifier le repère"}
            </Text>
          </TouchableOpacity>

          <TextInput
            placeholder="Commentaire"
            style={styles.inputComment}
            multiline
            value={comment}
            onChangeText={setComment}
          />

          <TouchableOpacity
            style={styles.inputFake}
            onPress={() =>
              navigation.navigate("AddPhoto", { pointId: pointId })
            }
          >
            <Text>Photos</Text>
            <Text>→</Text>
          </TouchableOpacity>
          <DropDownPicker
            open={open}
            value={equipment}
            items={equipmentList}
            setOpen={setOpen}
            setValue={setEquipment}
            setItems={setEquipmentList}
            placeholder="Sélectionnez un équipement"
            listMode="SCROLLVIEW"
            style={styles.dropdown}
          />
          <TextInput
            placeholder="Quantité"
            style={styles.input}
            keyboardType="numeric"
            value={qty}
            onChangeText={setQty}
          />

          <TouchableOpacity style={styles.validateButton} onPress={validate}>
            <Text style={styles.validateButtonText}>Valider</Text>
          </TouchableOpacity>
        </View>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  dropdown: {
    margin: 15,
    backgroundColor: "#fff",
    borderRadius: 12,
    marginTop: 4,
    borderWidth: 1,
    borderColor: "#fff",
    overflow: "hidden",
    width: "92%",
    alignSelf: "center",
  },

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
  mapContainer: {
    height: 250,
    width: "100%",
    position: "relative",
  },
  map: {
    height: "100%",
    width: "100%"
  },
  centerMarker: {
    position: "absolute",
    top: "50%",
    left: "50%",
    marginLeft: -24,
    marginTop: -48,
    zIndex: 1000,
  },
  editLocationButton: {
    backgroundColor: "#fff",
    marginHorizontal: 15,
    marginTop: 10,
    marginBottom: 10,
    padding: 12,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#8DC63F",
  },
  editLocationButtonText: {
    color: "#8DC63F",
    fontSize: 16,
    fontWeight: "600",
  },
  inputComment: {
    backgroundColor: "#fff",
    margin: 15,
    padding: 15,
    height: 120,
    textAlignVertical: "top",
    borderRadius: 12,
  },
  inputFake: {
    backgroundColor: "#fff",
    marginHorizontal: 15,
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  input: {
    backgroundColor: "#fff",
    marginHorizontal: 15,
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
  },
  validateButton: {
    backgroundColor: "#8DC63F",
    margin: 15,
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
  },
  validateButtonText: { color: "#fff", fontSize: 18 },
});
