import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import { useNavigation, useRoute } from "@react-navigation/native";
import uuid from "react-native-uuid";
import * as Location from "expo-location";
import { Float } from "react-native/Libraries/Types/CodegenTypes";
import { useSQLiteContext } from "expo-sqlite";

interface equipementType {
  UUID: string;
  Type: string;
  Description?: string;
  Unite?: string;
  Stock_total: Float;
  Stock_restant: Float;
}
interface pointType {
  UUID: string;
  Latitude: Float;
  Longitude: Float;
  Commentaire: string;
}
export function CreatePointScreen() {
  const navigation = useNavigation();
  const [comment, setComment] = useState("");
  const [type, setType] = useState("");
  const [qty, setQty] = useState("");
  const [equipmentList, setEquipmentList] = useState<equipementType[]>([]);
  const [equipment, setEquipment] = useState<equipementType>();
  const [showDropdown, setShowDropdown] = useState(false);
  const [pointId, setPointId] = useState("");
  const mapRef = useRef<MapView>(null);
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const db = useSQLiteContext();
  const route = useRoute();
  const eventId = route.params?.eventId;
  const validate = async () => {
    try {
      console.log("validate called");
      const insert = await db.runAsync(
        "UPDATE Point SET Commentaire = ? WHERE UUID = ?",
        [comment, pointId]
      );
      navigation.goBack();
    } catch (e) {
      console.log(e);
    }
  };
  useEffect(() => {
    (async () => {
      try {
        let newId = route.params?.pointId ?? uuid.v4();
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
        if (!route.params?.pointId) {
          await db.runAsync(
            "INSERT INTO Point (UUID, Event_ID, Latitude, Longitude) VALUES (?, ?, ?, ?)",
            [newId, eventId, coords.latitude, coords.longitude]
          );
        } else {
          const res: pointType[] = await db.getAllAsync(
            "SELECT * FROM Point WHERE UUID = ?",
            [newId]
          );
          console.log(res);
          setComment(res[0].Commentaire);
        }

        const equipments: equipementType[] = await db.getAllAsync(
          "SELECT * FROM Equipement"
        );
        console.log("equipments =");
        console.log(equipments);
        setEquipmentList(equipments);
      } catch (e) {
        console.log(e);
      }
    })();
  }, []);
  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: userLocation?.latitude || 48.5839,
          longitude: userLocation?.longitude || 7.7455,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
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
        onPress={() => navigation.navigate("AddPhoto", { pointId: pointId })}
      >
        <Text>Photos</Text>
        <Text>→</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.inputFake}>
        <Text>Type d’équipement</Text>
        <Text>⌄</Text>
      </TouchableOpacity>
      <View style={styles.dropdown}>
        {equipmentList.map((item) => (
          <TouchableOpacity
            key={item.UUID}
            style={styles.dropdownItem}
            onPress={() => {
              setEquipment(item);
              setShowDropdown(false);
            }}
          >
            <Text>{item.Type}</Text>
          </TouchableOpacity>
        ))}
      </View>
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
  );
}

const styles = StyleSheet.create({
  dropdown: {
    backgroundColor: "#fff",
    borderRadius: 10,
    marginTop: 4,
    borderWidth: 1,
    borderColor: "#ccc",
    overflow: "hidden",
  },

  dropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  container: { flex: 1 },
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
