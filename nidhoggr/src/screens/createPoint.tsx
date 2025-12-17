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
import {
  getAll,
  getAllWhere,
  insert,
  update,
  deleteWhere,
} from "../../database/queries";
import { Strings } from "../../types/strings";
import { Header } from "../components/header";
import { useTheme } from "../utils/ThemeContext";
import { getStyles } from "../utils/theme";
import { NO_EQUIPMENT_ID } from "../constants/constants";

export function CreatePointScreen() {
  const db = useSQLiteContext();
  const { theme } = useTheme();
  const styles = getStyles(theme);
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
  const [markerPosition, setMarkerPosition] = useState<UserLocation | null>(
    null
  );
  const route = useRoute();
  const { eventId, pointIdParam } = route.params as createPointParams;

  const handleGoBack = async () => {
    if (!pointIdParam) {
      try {
        await deleteWhere(db, "Point", ["UUID"], [pointId]);
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
            {
              Latitude: markerPosition.latitude,
              Longitude: markerPosition.longitude,
            },
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
        alert(Strings.createPoint.addComment);
        return;
      }
      if (!equipment) {
        alert(Strings.createPoint.selectEquipment);
        return;
      }
      if (!qty || Number(qty) < 1) {
        alert(Strings.createPoint.enterQuantity);
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
            Equipement_ID: NO_EQUIPMENT_ID,
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
        setEquipmentList([
            { label: "Aucun équipement", value: NO_EQUIPMENT_ID },
            ...equipments.map((e) => ({
              label: e.Type,
              value: e.UUID,
            })),
          ]);
      } catch (e) {
        console.log(e);
      }
    })();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <Header onBack={handleGoBack} />

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
              color={theme === "light" ? "#8DC63F" : "#2ad783"}
              style={{ marginRight: 8 }}
            />
            <Text style={styles.editLocationButtonText}>
              {isEditingLocation
                ? Strings.createPoint.validatePosition
                : Strings.createPoint.editMarker}
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
            placeholder={Strings.createPoint.selectEquipmentPlaceholder}
            listMode="SCROLLVIEW"
            style={styles.dropdown}
          />
          <TextInput
            placeholder="Quantité"
            style={styles.inputCreatePoint}
            keyboardType="numeric"
            value={qty}
            onChangeText={setQty}
          />

          <TouchableOpacity style={styles.validateButton} onPress={validate}>
            <Text style={styles.validateButtonText}>
              {Strings.createPoint.validate}
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}
