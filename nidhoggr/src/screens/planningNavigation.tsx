import React, { useEffect, useState, useCallback, useRef } from "react";
import {
    View,
    Text,
    SafeAreaView,
    TouchableOpacity,
    StyleSheet,
    Dimensions,
    Animated,
    Modal,
    ActivityIndicator,
    PanResponder,
} from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import { useNavigation, useRoute, useFocusEffect } from "@react-navigation/native";
import { useSQLiteContext } from "expo-sqlite";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { EventScreenNavigationProp, PlanningTask, PlanningTeam, GeoJSONData } from "../../types/types";
import { getAllWhere, update } from "../../database/queries";
import { Header } from "../components/header";
import { useTheme } from "../utils/ThemeContext";
import { getStyles } from "../utils/theme";

interface PlanningNavigationParams {
    eventId: string;
    taskType: "installation" | "removal" | "mixed";
}

const ARRIVAL_DISTANCE = 15; // mètres (marge pour imprécision GPS)
const GROUPING_DISTANCE = 10; // mètres

export default function PlanningNavigationScreen() {
    const { theme } = useTheme();
    const styles = getStyles(theme);
    const db = useSQLiteContext();
    const navigation = useNavigation<EventScreenNavigationProp>();
    const route = useRoute();
    const { eventId, taskType } = route.params as PlanningNavigationParams;

    const [tasks, setTasks] = useState<PlanningTask[]>([]);
    const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
    const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
    const [heading, setHeading] = useState(0);
    const [distance, setDistance] = useState<number | null>(null);
    const [showArrivalModal, setShowArrivalModal] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [routeCoordinates, setRouteCoordinates] = useState<{ latitude: number; longitude: number }[]>([]);
    const [routeDistance, setRouteDistance] = useState<number | null>(null);
    const [routeDuration, setRouteDuration] = useState<number | null>(null);
    const [isLoadingRoute, setIsLoadingRoute] = useState(true);
    const [tasksLoaded, setTasksLoaded] = useState(false);
    const [routeLoaded, setRouteLoaded] = useState(false);

    const mapRef = useRef<MapView>(null);
    const locationSubscription = useRef<Location.LocationSubscription | null>(null);

    // Slider iOS
    const SLIDER_WIDTH = Dimensions.get("window").width - 100;
    const THUMB_SIZE = 60;
    const SLIDE_THRESHOLD = SLIDER_WIDTH - THUMB_SIZE - 10;
    const sliderAnim = useRef(new Animated.Value(0)).current;
    const handleSwipeConfirmRef = useRef<() => void>(() => { });

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderMove: (_, gestureState) => {
                const newValue = Math.max(0, Math.min(gestureState.dx, SLIDE_THRESHOLD));
                sliderAnim.setValue(newValue);
            },
            onPanResponderRelease: (_, gestureState) => {
                console.log(`📊 Slider release: dx=${gestureState.dx}, threshold=${SLIDE_THRESHOLD}`);
                if (gestureState.dx >= SLIDE_THRESHOLD * 0.9) { // 90% du chemin suffit
                    console.log("✅ Slider validé !");
                    // Validation réussie
                    Animated.timing(sliderAnim, {
                        toValue: SLIDE_THRESHOLD,
                        duration: 100,
                        useNativeDriver: false,
                    }).start(() => {
                        handleSwipeConfirmRef.current();
                        sliderAnim.setValue(0);
                    });
                } else {
                    console.log("↩️ Slider retour");
                    // Retour à la position initiale
                    Animated.spring(sliderAnim, {
                        toValue: 0,
                        useNativeDriver: false,
                        tension: 50,
                        friction: 8,
                    }).start();
                }
            },
        })
    ).current;

    const currentTask = tasks[currentTaskIndex];
    const currentTaskRef = useRef<PlanningTask | undefined>(currentTask);

    // Mettre à jour la ref à chaque changement
    useEffect(() => {
        currentTaskRef.current = currentTask;
        console.log(`📋 currentTaskRef updated: ${currentTask ? currentTask.UUID.substring(0, 8) : 'null'}`);
    }, [currentTask]);

    useFocusEffect(
        useCallback(() => {
            loadTasks();
            startLocationTracking();

            return () => {
                if (locationSubscription.current) {
                    locationSubscription.current.remove();
                }
            };
        }, [db, eventId, taskType])
    );

    // Calculer la route dès que la position et la tâche sont disponibles
    useEffect(() => {
        if (userLocation && currentTask) {
            const taskCenter = getTaskCenter(currentTask);
            if (taskCenter && !routeLoaded) {
                console.log("📍 Calcul initial de la route...");
                fetchRoute(userLocation, taskCenter, true); // showLoading = true
            }
        }
    }, [userLocation, currentTask]);

    // Désactiver le loading seulement quand tout est chargé
    useEffect(() => {
        if (tasksLoaded && routeLoaded) {
            setIsLoadingRoute(false);
        }
    }, [tasksLoaded, routeLoaded]);

    const loadTasks = async () => {
        try {
            const teams = await getAllWhere<PlanningTeam>(db, "PlanningTeam", ["EventID"], [eventId]);
            if (teams.length > 0) {
                const allTasks = await getAllWhere<PlanningTask>(
                    db, "PlanningTask", ["TeamID"], [teams[0].UUID]
                );

                // Filtrer selon le mode : mixed = toutes, sinon par type
                const filteredTasks = allTasks
                    .filter(t => t.Status !== "completed" && (taskType === "mixed" || t.TaskType === taskType))
                    .sort((a, b) => new Date(a.ScheduledDate).getTime() - new Date(b.ScheduledDate).getTime());

                setTasks(filteredTasks);
            }
            setTasksLoaded(true);
        } catch (error) {
            console.error("Erreur chargement tâches:", error);
            setTasksLoaded(true); // On marque comme chargé même en cas d'erreur
        }
    };

    // Fonction pour calculer l'itinéraire via OSRM (gratuit, open source)
    const fetchRoute = async (
        from: { latitude: number; longitude: number },
        to: { latitude: number; longitude: number },
        showLoading: boolean = false
    ) => {
        if (showLoading) setIsLoadingRoute(true);

        try {
            const url = `https://router.project-osrm.org/route/v1/driving/${from.longitude},${from.latitude};${to.longitude},${to.latitude}?overview=full&geometries=geojson`;

            const response = await fetch(url);
            const data = await response.json();

            if (data.code === "Ok" && data.routes && data.routes.length > 0) {
                const route = data.routes[0];

                // Extraire les coordonnées du trajet
                const coords = route.geometry.coordinates.map(([lng, lat]: [number, number]) => ({
                    latitude: lat,
                    longitude: lng,
                }));

                setRouteCoordinates(coords);
                setRouteDistance(route.distance); // en mètres
                setRouteDuration(route.duration); // en secondes
            }
        } catch (error) {
            console.error("Erreur calcul itinéraire:", error);
        } finally {
            setRouteLoaded(true); // Marquer la route comme chargée (le loading se désactive via useEffect)
        }
    };

    const startLocationTracking = async () => {
        console.log("🚀 Démarrage tracking GPS...");
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
            console.log("❌ Permission localisation refusée");
            return;
        }
        console.log("✅ Permission GPS accordée");

        let lastRouteUpdate = 0;

        locationSubscription.current = await Location.watchPositionAsync(
            {
                accuracy: Location.Accuracy.BestForNavigation,
                timeInterval: 1000,
                distanceInterval: 1,
            },
            async (location) => {
                const newLocation = {
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                };
                setUserLocation(newLocation);
                console.log(`📡 Position: ${newLocation.latitude.toFixed(5)}, ${newLocation.longitude.toFixed(5)}`);

                const task = currentTaskRef.current;
                console.log(`📋 currentTask: ${task ? task.UUID.substring(0, 8) : 'null'}`);

                if (location.coords.heading !== null) {
                    setHeading(location.coords.heading);
                }

                // Calculer distance vers le point actuel
                if (task) {
                    const taskCenter = getTaskCenter(task);
                    const allCoords = getTaskCoordinates(task);

                    // Calculer la distance minimale vers n'importe quel point de la ligne
                    let minDist = Infinity;
                    for (const coord of allCoords) {
                        const d = calculateDistance(newLocation, coord);
                        if (d < minDist) minDist = d;
                    }

                    // Fallback sur le centre si pas de coords
                    const dist = allCoords.length > 0 ? minDist : (taskCenter ? calculateDistance(newLocation, taskCenter) : null);

                    if (dist !== null) {
                        setDistance(dist);
                        console.log(`📍 Distance: ${dist.toFixed(1)}m (seuil: ${ARRIVAL_DISTANCE}m)`);

                        // Recalculer l'itinéraire toutes les 10 secondes
                        const now = Date.now();
                        if (now - lastRouteUpdate > 10000 && taskCenter) {
                            lastRouteUpdate = now;
                            fetchRoute(newLocation, taskCenter);
                        }

                        // Détection d'arrivée
                        if (dist <= ARRIVAL_DISTANCE && !showArrivalModal && !showConfirmModal) {
                            console.log("🎯 Arrivée détectée !");
                            setShowArrivalModal(true);
                        }
                    }
                }
            }
        );
    };

    const getTaskCenter = (task: PlanningTask): { latitude: number; longitude: number } | null => {
        try {
            const geoJson: GeoJSONData = JSON.parse(task.GeoJson);
            if (geoJson.type === "LineString" && Array.isArray(geoJson.coordinates)) {
                const coords = geoJson.coordinates as [number, number][];
                const midIndex = Math.floor(coords.length / 2);
                return {
                    latitude: coords[midIndex][1],
                    longitude: coords[midIndex][0],
                };
            }
            return null;
        } catch {
            return null;
        }
    };

    const getTaskCoordinates = (task: PlanningTask): { latitude: number; longitude: number }[] => {
        try {
            const geoJson: GeoJSONData = JSON.parse(task.GeoJson);
            if (geoJson.type === "LineString" && Array.isArray(geoJson.coordinates)) {
                return (geoJson.coordinates as [number, number][]).map(([lng, lat]) => ({
                    latitude: lat,
                    longitude: lng,
                }));
            }
            return [];
        } catch {
            return [];
        }
    };

    const calculateDistance = (
        point1: { latitude: number; longitude: number },
        point2: { latitude: number; longitude: number }
    ): number => {
        const R = 6371000; // Rayon de la Terre en mètres
        const dLat = ((point2.latitude - point1.latitude) * Math.PI) / 180;
        const dLon = ((point2.longitude - point1.longitude) * Math.PI) / 180;
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos((point1.latitude * Math.PI) / 180) *
            Math.cos((point2.latitude * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };

    const calculateBearing = (
        from: { latitude: number; longitude: number },
        to: { latitude: number; longitude: number }
    ): number => {
        const dLon = ((to.longitude - from.longitude) * Math.PI) / 180;
        const lat1 = (from.latitude * Math.PI) / 180;
        const lat2 = (to.latitude * Math.PI) / 180;
        const y = Math.sin(dLon) * Math.cos(lat2);
        const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
        const bearing = (Math.atan2(y, x) * 180) / Math.PI;
        return (bearing + 360) % 360;
    };

    const getArrowRotation = (): number => {
        if (!userLocation || !currentTask) return 0;
        const taskCenter = getTaskCenter(currentTask);
        if (!taskCenter) return 0;
        const bearing = calculateBearing(userLocation, taskCenter);
        return bearing - heading;
    };

    const formatDistance = (meters: number): string => {
        if (meters < 1000) {
            return `${Math.round(meters)}m`;
        }
        return `${(meters / 1000).toFixed(1)}km`;
    };

    const getEstimatedTime = (): string => {
        // Utiliser la durée réelle de OSRM si disponible (véhicule)
        if (routeDuration !== null) {
            const minutes = Math.ceil(routeDuration / 60);
            if (minutes < 60) {
                return `~${minutes} min 🚗`;
            }
            const hours = Math.floor(minutes / 60);
            return `~${hours}h${minutes % 60} 🚗`;
        }
        return "";
    };

    const handleSwipeConfirm = async () => {
        console.log("🔧 handleSwipeConfirm appelé !");
        if (!currentTask) return;

        try {
            // Marquer la tâche comme terminée
            await update(db, "PlanningTask", {
                Status: "completed",
                CompletedAt: new Date().toISOString(),
            }, "UUID = ?", [currentTask.UUID]);

            setShowConfirmModal(false);

            // Passer à la tâche suivante
            if (currentTaskIndex < tasks.length - 1) {
                setCurrentTaskIndex(currentTaskIndex + 1);
                // Reset les états pour la nouvelle tâche
                setShowArrivalModal(false);
                setRouteLoaded(false);
                setRouteCoordinates([]);

                // Recentrer la carte
                const nextTask = tasks[currentTaskIndex + 1];
                const center = getTaskCenter(nextTask);
                if (center && mapRef.current) {
                    mapRef.current.animateToRegion({
                        ...center,
                        latitudeDelta: 0.005,
                        longitudeDelta: 0.005,
                    }, 1000);
                }
            } else {
                // Toutes les tâches sont terminées
                navigation.goBack();
            }
        } catch (error) {
            console.error("Erreur validation tâche:", error);
        }
    };

    const handleArrivalConfirm = () => {
        setShowArrivalModal(false);
        setShowConfirmModal(true);
    };

    // Mettre à jour la ref pour le PanResponder
    handleSwipeConfirmRef.current = handleSwipeConfirm;

    if (tasks.length === 0) {
        return (
            <SafeAreaView style={styles.container}>
                <Header />
                <View style={localStyles.emptyContainer}>
                    <Ionicons name="checkmark-circle" size={64} color="#43A047" />
                    <Text style={localStyles.emptyText}>
                        {taskType === "installation"
                            ? "Toutes les poses sont terminées !"
                            : "Toutes les déposes sont terminées !"}
                    </Text>
                    <TouchableOpacity
                        style={localStyles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Text style={localStyles.backButtonText}>Retour</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <Header />

            {/* Carte */}
            <MapView
                ref={mapRef}
                style={localStyles.map}
                showsUserLocation={true}
                showsMyLocationButton={true}
                followsUserLocation={true}
                initialRegion={{
                    latitude: userLocation?.latitude || 48.5839,
                    longitude: userLocation?.longitude || 7.7507,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                }}
            >
                {/* Itinéraire routier (bleu) */}
                {routeCoordinates.length > 0 && (
                    <Polyline
                        coordinates={routeCoordinates}
                        strokeWidth={5}
                        strokeColor="#4285F4"
                        lineDashPattern={[0]}
                    />
                )}

                {/* Afficher toutes les tâches */}
                {tasks.map((task, index) => {
                    const coords = getTaskCoordinates(task);
                    const isActive = index === currentTaskIndex;
                    return (
                        <Polyline
                            key={task.UUID}
                            coordinates={coords}
                            strokeWidth={isActive ? 6 : 3}
                            strokeColor={isActive ? "#E53935" : "#999"}
                        />
                    );
                })}

                {/* Marker pour la tâche actuelle */}
                {currentTask && getTaskCenter(currentTask) && (
                    <Marker
                        coordinate={getTaskCenter(currentTask)!}
                        anchor={{ x: 0.5, y: 0.5 }}
                    >
                        <View style={localStyles.activeMarker}>
                            <Ionicons
                                name={taskType === "installation" ? "construct" : "cube"}
                                size={24}
                                color="#fff"
                            />
                        </View>
                    </Marker>
                )}
            </MapView>

            {/* Panneau de navigation */}
            <View style={localStyles.navigationPanel}>
                <View style={localStyles.arrowContainer}>
                    <View style={[
                        localStyles.arrow,
                        { transform: [{ rotate: `${getArrowRotation()}deg` }] }
                    ]}>
                        <Ionicons name="arrow-up" size={48} color="#0E47A1" />
                    </View>
                </View>

                <View style={localStyles.infoContainer}>
                    <Text style={localStyles.distanceText}>
                        {routeDistance !== null ? formatDistance(routeDistance) : (distance !== null ? formatDistance(distance) : "...")}
                    </Text>
                    <Text style={localStyles.timeText}>
                        {getEstimatedTime()}
                    </Text>
                </View>

                <View style={localStyles.taskInfo}>
                    <Text style={localStyles.taskTitle}>
                        {currentTask?.TaskType === "installation" ? "🔧 Pose" : "📦 Dépose"}
                    </Text>
                    <Text style={localStyles.taskEquipment}>{currentTask?.EquipmentType}</Text>
                    <Text style={localStyles.taskQuantity}>Quantité: {currentTask?.Quantity}</Text>
                </View>

                <Text style={localStyles.progressText}>
                    {currentTaskIndex + 1} / {tasks.length}
                </Text>
            </View>

            {/* Modal d'arrivée */}
            <Modal
                visible={showArrivalModal}
                transparent
                animationType="slide"
            >
                <View style={localStyles.modalOverlay}>
                    <View style={localStyles.modalContent}>
                        <Ionicons name="location" size={48} color="#43A047" />
                        <Text style={localStyles.modalTitle}>Vous êtes arrivé !</Text>
                        <Text style={localStyles.modalSubtitle}>
                            Êtes-vous à l'emplacement de la tâche ?
                        </Text>
                        <View style={localStyles.modalButtons}>
                            <TouchableOpacity
                                style={localStyles.modalButtonSecondary}
                                onPress={() => setShowArrivalModal(false)}
                            >
                                <Text style={localStyles.modalButtonSecondaryText}>Pas encore</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={localStyles.modalButtonPrimary}
                                onPress={handleArrivalConfirm}
                            >
                                <Text style={localStyles.modalButtonPrimaryText}>Oui, je suis là</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Modal de confirmation (swipe) */}
            <Modal
                visible={showConfirmModal}
                transparent
                animationType="slide"
            >
                <View style={localStyles.modalOverlay}>
                    <View style={localStyles.confirmModalContent}>
                        <Text style={localStyles.confirmTitle}>
                            {currentTask?.TaskType === "installation" ? "🔧 Pose" : "📦 Dépose"}
                        </Text>
                        <Text style={localStyles.confirmEquipment}>{currentTask?.EquipmentType}</Text>
                        <Text style={localStyles.confirmQuantity}>Quantité: {currentTask?.Quantity}</Text>

                        {currentTask?.Comment && (
                            <Text style={localStyles.confirmComment}>{currentTask.Comment}</Text>
                        )}

                        {/* Slider iOS style "Slide to Unlock" */}
                        <View style={[localStyles.sliderTrack, { width: SLIDER_WIDTH }]}>
                            <Text style={localStyles.sliderText}>Glisser pour confirmer →</Text>
                            <Animated.View
                                style={[
                                    localStyles.sliderThumb,
                                    { transform: [{ translateX: sliderAnim }] }
                                ]}
                                {...panResponder.panHandlers}
                            >
                                <Ionicons name="checkmark" size={28} color="#43A047" />
                            </Animated.View>
                        </View>

                        <TouchableOpacity
                            style={localStyles.cancelButton}
                            onPress={() => setShowConfirmModal(false)}
                        >
                            <Text style={localStyles.cancelButtonText}>Annuler</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Overlay de chargement style Waze */}
            {isLoadingRoute && (
                <View style={localStyles.loadingOverlay}>
                    <View style={localStyles.loadingCard}>
                        <ActivityIndicator size="large" color="#4285F4" />
                        <Text style={localStyles.loadingTitle}>🛣️ Calcul de l'itinéraire...</Text>
                        <Text style={localStyles.loadingSubtitle}>Veuillez patienter</Text>
                    </View>
                </View>
            )}
        </SafeAreaView>
    );
}

const localStyles = StyleSheet.create({
    map: {
        flex: 1,
    },
    navigationPanel: {
        position: "absolute",
        bottom: 20,
        left: 20,
        right: 20,
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
        flexDirection: "row",
        alignItems: "center",
    },
    arrowContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: "#E3F2FD",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
    },
    arrow: {},
    infoContainer: {
        marginRight: 12,
    },
    distanceText: {
        fontSize: 28,
        fontWeight: "bold",
        color: "#0E47A1",
    },
    timeText: {
        fontSize: 14,
        color: "#666",
    },
    taskInfo: {
        flex: 1,
    },
    taskTitle: {
        fontSize: 16,
        fontWeight: "600",
        color: "#333",
    },
    taskEquipment: {
        fontSize: 14,
        color: "#666",
    },
    taskQuantity: {
        fontSize: 12,
        color: "#999",
    },
    progressText: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#0E47A1",
    },
    activeMarker: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "#E53935",
        justifyContent: "center",
        alignItems: "center",
    },
    emptyContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 32,
    },
    emptyText: {
        fontSize: 18,
        color: "#333",
        textAlign: "center",
        marginTop: 16,
    },
    backButton: {
        marginTop: 24,
        backgroundColor: "#0E47A1",
        paddingHorizontal: 32,
        paddingVertical: 12,
        borderRadius: 8,
    },
    backButtonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "600",
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "flex-end",
    },
    modalContent: {
        backgroundColor: "#fff",
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 32,
        alignItems: "center",
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#333",
        marginTop: 16,
    },
    modalSubtitle: {
        fontSize: 16,
        color: "#666",
        marginTop: 8,
        textAlign: "center",
    },
    modalButtons: {
        flexDirection: "row",
        marginTop: 24,
        gap: 12,
    },
    modalButtonSecondary: {
        flex: 1,
        backgroundColor: "#f5f5f5",
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: "center",
    },
    modalButtonSecondaryText: {
        fontSize: 16,
        color: "#666",
        fontWeight: "600",
    },
    modalButtonPrimary: {
        flex: 1,
        backgroundColor: "#43A047",
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: "center",
    },
    modalButtonPrimaryText: {
        fontSize: 16,
        color: "#fff",
        fontWeight: "600",
    },
    confirmModalContent: {
        backgroundColor: "#fff",
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 32,
        alignItems: "center",
    },
    confirmTitle: {
        fontSize: 28,
        fontWeight: "bold",
        color: "#333",
    },
    confirmEquipment: {
        fontSize: 20,
        color: "#666",
        marginTop: 8,
    },
    confirmQuantity: {
        fontSize: 18,
        color: "#999",
        marginTop: 4,
    },
    confirmComment: {
        fontSize: 14,
        color: "#666",
        marginTop: 16,
        fontStyle: "italic",
        textAlign: "center",
    },
    swipeButton: {
        marginTop: 32,
        backgroundColor: "#43A047",
        paddingHorizontal: 48,
        paddingVertical: 20,
        borderRadius: 16,
        width: "100%",
        alignItems: "center",
    },
    swipeButtonText: {
        fontSize: 18,
        color: "#fff",
        fontWeight: "bold",
    },
    cancelButton: {
        marginTop: 16,
        paddingVertical: 12,
    },
    cancelButtonText: {
        fontSize: 16,
        color: "#E53935",
    },
    // Styles pour l'overlay de chargement
    loadingOverlay: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.6)",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
    },
    loadingCard: {
        backgroundColor: "#fff",
        borderRadius: 20,
        padding: 32,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 10,
        minWidth: 250,
    },
    loadingTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#333",
        marginTop: 16,
        textAlign: "center",
    },
    loadingSubtitle: {
        fontSize: 14,
        color: "#666",
        marginTop: 8,
    },
    // Styles pour le slider iOS
    sliderTrack: {
        height: 60,
        backgroundColor: "#43A047",
        borderRadius: 30,
        marginTop: 24,
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden",
    },
    sliderThumb: {
        position: "absolute",
        left: 4,
        width: 52,
        height: 52,
        backgroundColor: "#fff",
        borderRadius: 26,
        justifyContent: "center",
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
    },
    sliderText: {
        color: "rgba(255, 255, 255, 0.9)",
        fontSize: 16,
        fontWeight: "600",
        marginLeft: 40,
    },
});
