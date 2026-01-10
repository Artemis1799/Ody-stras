import { useEffect, useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Image,
  Platform,
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
  Area,
  EventScreenNavigationProp,
  Path,
  Point,
  PointOnMap,
  mapParams,
} from "../../types/types";
import { getAllWhere, getPointsForEvent } from "../../database/queries";
import { Strings } from "../../types/strings";
import { Header } from "../components/header";
import { useTheme } from "../utils/ThemeContext";
import { getStyles } from "../utils/theme";
import RenderAreas from "../utils/RenderAreas";
import RenderPaths from "../utils/RenderPaths";

export function MapScreen() {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const navigation = useNavigation<EventScreenNavigationProp>();
  const route = useRoute();
  const db = useSQLiteContext();
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const mapRef = useRef<MapView>(null);
  const [areas, setAreas] = useState<Area[]>([]);
  const [paths, setPaths] = useState<Path[]>([]);

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
      console.log(eventId);
      const areasDB = await getAllWhere<Area>(
        db,
        "Area",
        ["EventID"],
        [eventId]
      );
      const pathsDB = await getAllWhere<Path>(
        db,
        "Path",
        ["EventID"],
        [eventId]
      );
      setAreas(areasDB);
      setPaths(pathsDB);
      const sql: PointOnMap[] = await getPointsForEvent(db, eventId);

      const pts: PointOnMap[] = sql.map((row: PointOnMap) => ({
        UUID: row.UUID,
        Latitude: row.Latitude,
        Longitude: row.Longitude,
        EquipType: row.EquipmentType,
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
          console.log(Strings.map.locationPermissionDenied);
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
        pointIdParam: point.UUID,
      });
    } catch (e) {
      console.log(e);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header />

      <MapView
        key={points.length}
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
        <RenderAreas areas={areas} />
        <RenderPaths paths={paths} />

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
              <Text style={styles.markerType}>
                {point.EquipmentType ?? Strings.map.noEquipment}
              </Text>
            </View>
          </Marker>
        ))}
        {Platform.OS === "ios" && (
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
        )}
      </MapView>

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate("AddPoint", { eventId })}
      >
        <Text style={styles.addButtonText}>{Strings.map.placePoint}</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}
