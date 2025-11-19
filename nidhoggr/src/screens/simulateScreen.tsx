import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Image,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useSQLiteContext } from "expo-sqlite";
import { Ionicons } from "@expo/vector-icons";
import MapView, { Marker, Polyline } from "react-native-maps";

interface PointType {
  UUID: string;
  Event_ID: string;
  Latitude: number;
  Longitude: number;
  Commentaire: string;
  Image_ID: string;
  Ordre: number;
  Valide: boolean;
  Created: string;
  Modified: string;
}

export default function SimulateScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { eventUUID } = route.params as { eventUUID: string };
  const db = useSQLiteContext();

  const [points, setPoints] = useState<PointType[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentPosition, setCurrentPosition] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [distance, setDistance] = useState(0);
  const [completedPoints, setCompletedPoints] = useState<number[]>([]);

  const simulationInterval = useRef<NodeJS.Timeout | null>(null);
  const mapRef = useRef<MapView>(null);

  // Seuil de détection d'arrivée (en mètres)
  const ARRIVAL_THRESHOLD = 10;
  const SIMULATION_SPEED = 0.0001; // Vitesse de déplacement simulé

  useEffect(() => {
    loadPoints();
    return () => {
      if (simulationInterval.current) {
        clearInterval(simulationInterval.current);
      }
    };
  }, []);

  const loadPoints = async () => {
    try {
      const data: PointType[] = await db.getAllAsync(
        "SELECT * FROM Point WHERE Event_ID = ? ORDER BY Ordre ASC",
        [eventUUID]
      );
      setPoints(data);
      if (data.length > 0) {
        // Initialiser la position au premier point
        setCurrentPosition({
          latitude: data[0].Latitude,
          longitude: data[0].Longitude,
        });
      }
    } catch (err) {
      console.error(err);
      Alert.alert("Erreur", "Impossible de charger les points.");
    }
  };

  // Calcul de la distance entre deux coordonnées (formule Haversine)
  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number => {
    const R = 6371e3; // Rayon de la Terre en mètres
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance en mètres
  };

  // Effet pour gérer l'intervalle de simulation
  useEffect(() => {
    if (!isSimulating || currentIndex >= points.length) {
      if (simulationInterval.current) {
        clearInterval(simulationInterval.current);
        simulationInterval.current = null;
      }
      return;
    }

    simulationInterval.current = setInterval(() => {
      setCurrentPosition((prevPos) => {
        if (!prevPos || currentIndex >= points.length) return prevPos;

        const targetPoint = points[currentIndex];
        const dist = calculateDistance(
          prevPos.latitude,
          prevPos.longitude,
          targetPoint.Latitude,
          targetPoint.Longitude
        );

        setDistance(dist);

        // Vérifier si on est arrivé au point
        if (dist < ARRIVAL_THRESHOLD) {
          handleArrival();
          return prevPos;
        }

        // Déplacer vers le point cible
        const latDiff = targetPoint.Latitude - prevPos.latitude;
        const lonDiff = targetPoint.Longitude - prevPos.longitude;
        const ratio = Math.min(SIMULATION_SPEED / (dist / 111000), 1);

        return {
          latitude: prevPos.latitude + latDiff * ratio,
          longitude: prevPos.longitude + lonDiff * ratio,
        };
      });
    }, 100);

    return () => {
      if (simulationInterval.current) {
        clearInterval(simulationInterval.current);
      }
    };
  }, [isSimulating, currentIndex]);

  // Démarrer la simulation
  const startSimulation = () => {
    if (points.length === 0 || currentIndex >= points.length) {
      Alert.alert("Info", "Aucun point à visiter.");
      return;
    }

    setIsSimulating(true);
  };

  // Arrêter la simulation
  const stopSimulation = () => {
    setIsSimulating(false);
    if (simulationInterval.current) {
      clearInterval(simulationInterval.current);
      simulationInterval.current = null;
    }
  };

  // Gérer l'arrivée à un point
  const handleArrival = () => {
    // Arrêter la simulation d'abord pour éviter les boucles
    stopSimulation();

    const newCompletedPoints = [...completedPoints, currentIndex];
    setCompletedPoints(newCompletedPoints);

    if (currentIndex < points.length - 1) {
      // Passer au point suivant
      const nextIndex = currentIndex + 1;
      
      Alert.alert(
        "Point atteint ! 🎯",
        `Vous êtes arrivé à ${points[currentIndex].Commentaire || `Point ${points[currentIndex].Ordre}`}.\n\nDirection: ${points[nextIndex].Commentaire || `Point ${points[nextIndex].Ordre}`}`,
        [{ 
          text: "Continuer",
          onPress: () => {
            setCurrentIndex(nextIndex);
            // Centrer la carte sur le nouveau point
            if (mapRef.current) {
              mapRef.current.animateToRegion({
                latitude: points[nextIndex].Latitude,
                longitude: points[nextIndex].Longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              });
            }
            // Redémarrer la simulation après un court délai
            setTimeout(() => {
              setIsSimulating(true);
            }, 500);
          }
        }]
      );
    } else {
      // Tous les points ont été visités
      Alert.alert(
        "Parcours terminé ! 🏁",
        "Vous avez visité tous les points d'intérêt.",
        [
          {
            text: "OK",
            onPress: () => navigation.goBack(),
          },
        ]
      );
    }
  };

  // Réinitialiser la simulation
  const resetSimulation = () => {
    stopSimulation();
    setCurrentIndex(0);
    setCompletedPoints([]);
    if (points.length > 0) {
      setCurrentPosition({
        latitude: points[0].Latitude,
        longitude: points[0].Longitude,
      });
    }
  };

  const getCurrentPoint = () => {
    return currentIndex < points.length ? points[currentIndex] : null;
  };

  const getNextPoint = () => {
    return currentIndex + 1 < points.length ? points[currentIndex + 1] : null;
  };

  if (points.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back-outline" size={28} color="white" />
          </TouchableOpacity>
          <Image
            source={require("../../ressources/header.png")}
            style={styles.headerImage}
          />
          <View style={{ width: 28 }} />
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Aucun point à simuler</Text>
        </View>
      </SafeAreaView>
    );
  }

  const currentPoint = getCurrentPoint();
  const nextPoint = getNextPoint();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back-outline" size={28} color="white" />
        </TouchableOpacity>
        <Image
          source={require("../../ressources/header.png")}
          style={styles.headerImage}
        />
        <TouchableOpacity onPress={resetSimulation}>
          <Ionicons name="refresh-outline" size={28} color="white" />
        </TouchableOpacity>
      </View>

      {/* Carte */}
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: points[0].Latitude,
          longitude: points[0].Longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
      >
        {/* Position actuelle */}
        {currentPosition && (
          <Marker
            coordinate={currentPosition}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View style={styles.currentPositionMarker}>
              <View style={styles.currentPositionDot} />
            </View>
          </Marker>
        )}

        {/* Tous les points */}
        {points.map((point, index) => {
          const isCompleted = completedPoints.includes(index);
          const isCurrent = index === currentIndex;
          const isNext = index === currentIndex + 1;

          return (
            <Marker
              key={point.UUID}
              coordinate={{
                latitude: point.Latitude,
                longitude: point.Longitude,
              }}
              anchor={{ x: 0.5, y: 1 }}
            >
              <View
                style={[
                  styles.pointMarker,
                  isCompleted && styles.completedMarker,
                  isCurrent && styles.currentMarker,
                  isNext && styles.nextMarker,
                ]}
              >
                <Text
                  style={[
                    styles.markerText,
                    isCompleted && styles.completedMarkerText,
                  ]}
                >
                  {point.Ordre}
                </Text>
              </View>
            </Marker>
          );
        })}

        {/* Ligne entre les points */}
        {points.length > 1 && (
          <Polyline
            coordinates={points.map((p) => ({
              latitude: p.Latitude,
              longitude: p.Longitude,
            }))}
            strokeColor="#A6CE39"
            strokeWidth={3}
            lineDashPattern={[10, 5]}
          />
        )}
      </MapView>

      {/* Panneau d'information */}
      <View style={styles.infoPanel}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${((currentIndex + completedPoints.filter(i => i === currentIndex).length) / points.length) * 100}%`,
              },
            ]}
          />
        </View>

        <Text style={styles.progressText}>
          Point {currentIndex + 1} / {points.length}
        </Text>

        {currentPoint && (
          <View style={styles.currentPointInfo}>
            <Ionicons name="location" size={24} color="#A6CE39" />
            <View style={styles.pointDetails}>
              <Text style={styles.pointLabel}>Point actuel</Text>
              <Text style={styles.pointName}>
                {currentPoint.Commentaire || `Point ${currentPoint.Ordre}`}
              </Text>
            </View>
          </View>
        )}

        {distance > 0 && distance < 1000 && (
          <View style={styles.distanceInfo}>
            <Ionicons name="navigate" size={20} color="#666" />
            <Text style={styles.distanceText}>{distance.toFixed(0)} m</Text>
          </View>
        )}

        {nextPoint && (
          <View style={styles.nextPointInfo}>
            <Ionicons name="flag-outline" size={20} color="#666" />
            <View style={styles.pointDetails}>
              <Text style={styles.nextLabel}>Prochain</Text>
              <Text style={styles.nextName}>
                {nextPoint.Commentaire || `Point ${nextPoint.Ordre}`}
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Boutons de contrôle */}
      <View style={styles.controls}>
        {!isSimulating ? (
          <TouchableOpacity
            style={styles.startButton}
            onPress={startSimulation}
          >
            <Ionicons name="play" size={24} color="white" />
            <Text style={styles.buttonText}>Démarrer</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.stopButton} onPress={stopSimulation}>
            <Ionicons name="pause" size={24} color="white" />
            <Text style={styles.buttonText}>Arrêter</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f8fc",
  },
  header: {
    backgroundColor: "#9EC54D",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 30,
    paddingBottom: 10,
    paddingLeft: 14,
    paddingRight: 14,
  },
  headerImage: {
    width: "40%",
    height: 30,
    alignSelf: "center",
  },
  map: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 18,
    color: "#666",
  },
  currentPositionMarker: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "rgba(30, 144, 255, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  currentPositionDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#1E90FF",
    borderWidth: 2,
    borderColor: "white",
  },
  pointMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E5E0FF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#6B5EFF",
  },
  completedMarker: {
    backgroundColor: "#C8E6C9",
    borderColor: "#4CAF50",
  },
  currentMarker: {
    backgroundColor: "#A6CE39",
    borderColor: "#8FB34E",
    transform: [{ scale: 1.2 }],
  },
  nextMarker: {
    backgroundColor: "#FFE0B2",
    borderColor: "#FF9800",
  },
  markerText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#6B5EFF",
  },
  completedMarkerText: {
    color: "#4CAF50",
  },
  infoPanel: {
    backgroundColor: "white",
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  progressBar: {
    height: 6,
    backgroundColor: "#E0E0E0",
    borderRadius: 3,
    marginBottom: 10,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#A6CE39",
    borderRadius: 3,
  },
  progressText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 15,
    textAlign: "center",
  },
  currentPointInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  pointDetails: {
    marginLeft: 12,
    flex: 1,
  },
  pointLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 2,
  },
  pointName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  distanceInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    paddingLeft: 4,
  },
  distanceText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
    marginLeft: 8,
  },
  nextPointInfo: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  nextLabel: {
    fontSize: 12,
    color: "#999",
    marginBottom: 2,
  },
  nextName: {
    fontSize: 14,
    color: "#666",
  },
  controls: {
    padding: 20,
    backgroundColor: "white",
  },
  startButton: {
    backgroundColor: "#A6CE39",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
  },
  stopButton: {
    backgroundColor: "#FF6B6B",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
    marginLeft: 8,
  },
});