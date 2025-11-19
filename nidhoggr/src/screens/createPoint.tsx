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
import MapView, { Marker } from "react-native-maps";
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
  const [isNewPoint, setIsNewPoint] = useState(false);
  const mapRef = useRef<MapView>(null);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const route = useRoute();
  const { eventId, pointIdParam } = route.params as createPointParams;
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

      setIsNewPoint(false);
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

        mapRef.current?.animateToRegion(
          {
            ...coords,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          },
          1000
        );
        if (!pointIdParam) {
          await insert<Point>(db, "Point", {
            UUID: newId,
            Event_ID: eventId,
            Latitude: coords.latitude,
            Longitude: coords.longitude,
            Equipement_ID: "f50252ce-31bb-4c8b-a70c-51b7bb630bc3",
            Equipement_quantite: 0,
          });
          setIsNewPoint(true);
        } else {
          const res = await getAllWhere<Point>(db, "Point", ["UUID"], [newId]);
          if (res[0]) {
            setComment(res[0].Commentaire);
            if (res[0]?.Equipement_ID) setEquipment(res[0].Equipement_ID);
            if (res[0]?.Equipement_quantite)
              setQty(res[0].Equipement_quantite.toString());
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

  useEffect(() => {
    const unsubscribe = navigation.addListener("beforeRemove", async (e) => {
      if (isNewPoint && (!comment || !equipment || !qty || Number(qty) < 1)) {
        try {
          await db.runAsync("DELETE FROM Point WHERE UUID = ?", [pointId]);
          console.log("Point supprimé (non validé)");
        } catch (error) {
          console.log("Erreur lors de la suppression du point:", error);
        }
      }
    });

    return unsubscribe;
  }, [navigation, isNewPoint, comment, equipment, qty, pointId, db]);
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
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={{ flex: 1 }}>
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: userLocation?.latitude || 48.5839,
              longitude: userLocation?.longitude || 7.7455,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
            showsUserLocation={true}
            showsMyLocationButton={true}
            followsUserLocation={true}
            showsCompass={true}
            rotateEnabled={true}
            pitchEnabled={true}
          >
            <Marker
              coordinate={{
                latitude: userLocation?.latitude || 48.5839,
                longitude: userLocation?.longitude || 7.7455,
              }}
            />
          </MapView>

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
  map: { height: 250, width: "100%" },
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
