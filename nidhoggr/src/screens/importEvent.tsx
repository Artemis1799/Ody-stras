import { useNavigation } from "@react-navigation/native";
import {
    SafeAreaView,
    Text,
    View,
    StyleSheet,
    TouchableOpacity,
    Animated,
} from "react-native";
import { EventScreenNavigationProp } from "../../types/types";
import { useSQLiteContext } from "expo-sqlite";
import { insert, insertOrReplace, deleteWhere, getAllWhere } from "../../database/queries";
import { useEffect, useState, useRef } from "react";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Ionicons } from "@expo/vector-icons";
import { Strings } from "../../types/strings";
import { useTheme } from "../utils/ThemeContext";
import { getStyles } from "../utils/theme";

// Interfaces pour le nouveau format JSON
interface ImportedPhoto {
    uuid: string;
    pictureName: string;
    picture: string; // Base64
}

interface ImportedEquipment {
    uuid: string;
    type: string;
    description: string;
    unit: string;
    totalStock: number;
    remainingStock: number;
}

interface ImportedPoint {
    uuid: string;
    eventId: string;
    equipmentId: string | null;
    latitude: number;
    longitude: number;
    comment: string;
    imageId: string | null;
    order: number;
    isValid: boolean;
    equipmentQuantity: number;
    created: string;
    modified: string;
    equipment: ImportedEquipment | null;
    photos: ImportedPhoto[];
}

interface ImportedGeometry {
    uuid: string;
    eventId: string;
    type: string;
    geoJson: string;
    properties: string;
}

interface ImportedEvent {
    uuid: string;
    name: string;
    description: string;
    startDate: string;
    endDate: string | null;
    status: number;
    responsable: string;
}

interface EventDataMessage {
    type: "event_data";
    event: ImportedEvent;
    points: ImportedPoint[];
    geometries: ImportedGeometry[];
    metadata: {
        exportDate: string;
        version: string;
    };
}

interface ErrorMessage {
    type: "error";
    message: string;
}

type WebSocketMessage = EventDataMessage | ErrorMessage;

export default function ImportEventScreen() {
    const { theme } = useTheme();
    const styles = getStyles(theme);
    const db = useSQLiteContext();
    const navigation = useNavigation<EventScreenNavigationProp>();

    const [scannedData, setScannedData] = useState<string | null>(null);
    const [isCameraActive, setIsCameraActive] = useState(true);
    const [permission, requestPermission] = useCameraPermissions();
    const [isReceiving, setIsReceiving] = useState(false);
    const [receiveStatus, setReceiveStatus] = useState<string | null>(null);
    const [importStats, setImportStats] = useState({
        points: 0,
        photos: 0,
        geometries: 0,
        totalPoints: 0,
        totalPhotos: 0,
        totalGeometries: 0,
    });
    const [importedEvent, setImportedEvent] = useState<ImportedEvent | null>(null);

    const progressAnim = useRef(new Animated.Value(0)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        if (!permission?.granted) {
            requestPermission();
        }
    }, [permission]);

    useEffect(() => {
        if (isReceiving) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1.1,
                        duration: 800,
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 800,
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        } else {
            pulseAnim.setValue(1);
        }
    }, [isReceiving]);

    // Mapper le status numérique vers une chaîne (valeurs acceptées par CHECK constraint)
    // 'EN_DESINSTALLATION', 'TERMINE', 'EN_INSTALLATION', 'A_ORGANISER', 'EN_COURS'
    const getStatusString = (status: number): string => {
        switch (status) {
            case 1: return "TERMINE";
            case 2: return "EN_COURS";
            case 3: return "A_ORGANISER";
            case 4: return "EN_INSTALLATION";
            case 5: return "EN_DESINSTALLATION";
            default: return "A_ORGANISER";
        }
    };

    // Sauvegarder l'événement
    const saveEventToDatabase = async (event: ImportedEvent) => {
        const eventData = {
            UUID: event.uuid,
            Nom: event.name,
            Description: event.description,
            Date_debut: event.startDate,
            Status: getStatusString(event.status),
            Responsable: event.responsable || "",
        };
        await insertOrReplace(db, "Evenement", eventData);
        console.log(`Événement ${event.uuid} sauvegardé`);
    };

    // Sauvegarder un équipement
    const saveEquipmentToDatabase = async (equipment: ImportedEquipment) => {
        const equipmentData = {
            UUID: equipment.uuid,
            Type: equipment.type,
            Description: equipment.description,
            Unite: equipment.unit,
            Stock_total: equipment.totalStock,
            Stock_restant: equipment.remainingStock,
        };
        await insertOrReplace(db, "Equipement", equipmentData);
        console.log(`Équipement ${equipment.uuid} sauvegardé`);
    };

    // Sauvegarder un point
    const savePointToDatabase = async (point: ImportedPoint) => {
        const pointData = {
            UUID: point.uuid,
            Event_ID: point.eventId,
            Latitude: point.latitude,
            Longitude: point.longitude,
            Commentaire: point.comment,
            Ordre: point.order,
            Valide: point.isValid ? 1 : 0,
            Equipement_ID: point.equipmentId,
            Equipement_quantite: point.equipmentQuantity,
        };
        await insertOrReplace(db, "Point", pointData);
        console.log(`Point ${point.uuid} sauvegardé`);
    };

    // Sauvegarder une photo et son lien avec le point
    const savePhotoToDatabase = async (photo: ImportedPhoto, pointUuid: string) => {
        // Sauvegarder la photo
        const photoData = {
            UUID: photo.uuid,
            Picture: photo.picture,
            Picture_name: photo.pictureName,
        };
        await insertOrReplace(db, "Photo", photoData);

        // Créer le lien Image_Point
        const imagePointData = {
            Image_ID: photo.uuid,
            Point_ID: pointUuid,
        };
        await insertOrReplace(db, "Image_Point", imagePointData);
        console.log(`Photo ${photo.uuid} sauvegardée et liée au point ${pointUuid}`);
    };

    // Sauvegarder une géométrie
    const saveGeometryToDatabase = async (geometry: ImportedGeometry) => {
        const geometryData = {
            EventID: geometry.eventId,
            GeometryID: geometry.uuid,
            GeoJSON: typeof geometry.geoJson === 'string' ? geometry.geoJson : JSON.stringify(geometry.geoJson),
        };
        await insertOrReplace(db, "EventGeometries", geometryData);
        console.log(`Géométrie ${geometry.uuid} sauvegardée`);
    };

    // Supprimer toutes les données liées à un événement existant
    const deleteExistingEventData = async (eventUuid: string) => {
        console.log(`Suppression des données existantes pour l'événement ${eventUuid}...`);

        // 1. Récupérer tous les points de l'événement pour supprimer leurs photos
        const existingPoints = await getAllWhere<{ UUID: string }>(db, "Point", ["Event_ID"], [eventUuid]);

        // 2. Supprimer les liens Image_Point et les photos pour chaque point
        for (const point of existingPoints) {
            // Récupérer les photos liées au point
            const imagePoints = await getAllWhere<{ Image_ID: string }>(db, "Image_Point", ["Point_ID"], [point.UUID]);

            // Supprimer les liens Image_Point
            await deleteWhere(db, "Image_Point", ["Point_ID"], [point.UUID]);

            // Supprimer les photos
            for (const ip of imagePoints) {
                await deleteWhere(db, "Photo", ["UUID"], [ip.Image_ID]);
            }
        }

        // 3. Supprimer les points
        await deleteWhere(db, "Point", ["Event_ID"], [eventUuid]);

        // 4. Supprimer les géométries
        await deleteWhere(db, "EventGeometries", ["EventID"], [eventUuid]);

        // 5. Supprimer l'événement
        await deleteWhere(db, "Evenement", ["UUID"], [eventUuid]);

        console.log(`Données existantes supprimées pour l'événement ${eventUuid}`);
    };

    // Traiter les données de l'événement complet
    const processEventData = async (data: EventDataMessage) => {
        const { event, points, geometries } = data;

        // Calculer les totaux
        const totalPhotos = points.reduce((acc, p) => acc + p.photos.length, 0);
        setImportStats({
            points: 0,
            photos: 0,
            geometries: 0,
            totalPoints: points.length,
            totalPhotos: totalPhotos,
            totalGeometries: geometries.length,
        });

        try {
            // 0. Supprimer les données existantes si l'événement existe déjà
            setReceiveStatus("Vérification des données existantes...");
            await deleteExistingEventData(event.uuid);

            // 1. Sauvegarder l'événement
            setReceiveStatus("Sauvegarde de l'événement...");
            await saveEventToDatabase(event);
            setImportedEvent(event);

            // 2. Collecter et sauvegarder les équipements uniques
            const equipmentMap = new Map<string, ImportedEquipment>();
            for (const point of points) {
                if (point.equipment) {
                    equipmentMap.set(point.equipment.uuid, point.equipment);
                }
            }

            setReceiveStatus("Sauvegarde des équipements...");
            for (const equipment of equipmentMap.values()) {
                await saveEquipmentToDatabase(equipment);
            }

            // 3. Sauvegarder les points avec leurs photos
            let pointCount = 0;
            let photoCount = 0;

            for (const point of points) {
                setReceiveStatus(`Import des points... (${pointCount + 1}/${points.length})`);
                await savePointToDatabase(point);
                pointCount++;

                // Sauvegarder les photos du point
                for (const photo of point.photos) {
                    await savePhotoToDatabase(photo, point.uuid);
                    photoCount++;
                    setImportStats(prev => ({ ...prev, photos: photoCount }));
                }

                setImportStats(prev => ({ ...prev, points: pointCount }));

                // Mettre à jour la progression
                const progress = ((pointCount + photoCount) / (points.length + totalPhotos)) * 80;
                Animated.timing(progressAnim, {
                    toValue: progress,
                    duration: 200,
                    useNativeDriver: false,
                }).start();
            }

            // 4. Sauvegarder les géométries
            let geoCount = 0;
            for (const geometry of geometries) {
                setReceiveStatus(`Import des géométries... (${geoCount + 1}/${geometries.length})`);
                await saveGeometryToDatabase(geometry);
                geoCount++;
                setImportStats(prev => ({ ...prev, geometries: geoCount }));
            }

            // Terminer
            Animated.timing(progressAnim, {
                toValue: 100,
                duration: 300,
                useNativeDriver: false,
            }).start();

            setReceiveStatus("Import terminé");
        } catch (error) {
            console.error("Erreur lors du traitement des données:", error);
            throw error;
        }
    };

    const receiveEventsViaWebSocket = async (wsUrl: string) => {
        setIsReceiving(true);
        setReceiveStatus("Connexion au serveur...");
        setImportStats({
            points: 0,
            photos: 0,
            geometries: 0,
            totalPoints: 0,
            totalPhotos: 0,
            totalGeometries: 0,
        });
        setImportedEvent(null);

        try {
            const ws = new WebSocket(wsUrl);

            await new Promise<void>((resolve, reject) => {
                ws.onopen = () => {
                    console.log("Connecté au serveur WebSocket pour import");
                    setReceiveStatus("Connecté - En attente des données...");

                    // Envoyer un message pour demander les événements
                    const requestMessage = {
                        type: "import_request",
                        timestamp: new Date().toISOString(),
                    };
                    ws.send(JSON.stringify(requestMessage));
                };

                ws.onmessage = async (wsEvent) => {
                    try {
                        console.log("Données brutes reçues:", wsEvent.data);

                        // Vérifier si c'est du JSON valide
                        if (!wsEvent.data.startsWith('{')) {
                            console.log("Message non-JSON ignoré:", wsEvent.data);
                            return;
                        }

                        const message: WebSocketMessage = JSON.parse(wsEvent.data);
                        console.log("Message reçu:", message.type);
                        console.log("JSON complet reçu:", JSON.stringify(message, null, 2));

                        switch (message.type) {
                            case "event_data":
                                setReceiveStatus("Traitement des données...");
                                await processEventData(message);

                                // Envoyer un accusé de réception
                                const ackMessage = {
                                    type: "import_complete",
                                    eventId: message.event.uuid,
                                    timestamp: new Date().toISOString(),
                                };
                                ws.send(JSON.stringify(ackMessage));

                                setTimeout(() => {
                                    ws.close();
                                    resolve();
                                }, 500);
                                break;

                            case "error":
                                setReceiveStatus(`Erreur: ${message.message}`);
                                ws.close();
                                reject(new Error(message.message));
                                break;
                        }
                    } catch (parseError) {
                        console.error("Erreur parsing message:", parseError);
                    }
                };

                ws.onerror = (error) => {
                    console.error("Erreur WebSocket:", error);
                    setReceiveStatus("Erreur de connexion");
                    reject(error);
                };

                ws.onclose = () => {
                    console.log("Connexion WebSocket fermée");
                };

                // Timeout après 120 secondes (plus long car import peut prendre du temps)
                setTimeout(() => {
                    if (ws.readyState !== WebSocket.CLOSED) {
                        ws.close();
                        if (importedEvent) {
                            resolve();
                        } else {
                            reject(new Error("Timeout - Aucun événement reçu"));
                        }
                    }
                }, 120000);
            });
        } catch (error) {
            console.error("Erreur lors de l'import:", error);
            setReceiveStatus("Échec de l'import");
        } finally {
            setIsReceiving(false);
        }
    };

    const handleBarcodeScanned = ({ data }: { data: string }) => {
        if (isCameraActive) {
            setScannedData(data);
            setIsCameraActive(false);

            // Vérifier que c'est bien une URL WebSocket
            if (data.startsWith("ws://") || data.startsWith("wss://")) {
                receiveEventsViaWebSocket(data);
            } else {
                setReceiveStatus(Strings.exportEvent.invalidWebSocketURL);
            }
        }
    };

    const handleAnnulerBoutonPress = () => {
        setIsCameraActive(false);
        navigation.goBack();
    };

    if (!permission) {
        return (
            <SafeAreaView style={styles.container}>
                <Text>{Strings.exportEvent.cameraPermissionRequest}</Text>
            </SafeAreaView>
        );
    }

    if (!permission.granted) {
        return (
            <SafeAreaView style={styles.container}>
                <Text>{Strings.exportEvent.cameraPermissionDenied}</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {isCameraActive ? (
                <View style={styles.cameraContainer}>
                    <CameraView
                        style={styles.camera}
                        facing="back"
                        barcodeScannerSettings={{
                            barcodeTypes: ["qr"],
                        }}
                        onBarcodeScanned={handleBarcodeScanned}
                    />
                    {/* Overlay avec patron de centrage */}
                    <View style={styles.overlay}>
                        <View style={styles.overlayTop} />
                        <View style={styles.overlayMiddle}>
                            <View style={styles.overlaySide} />
                            <View style={styles.scanArea}>
                                {/* Coins du patron */}
                                <View style={[styles.corner, styles.cornerTopLeft]} />
                                <View style={[styles.corner, styles.cornerTopRight]} />
                                <View style={[styles.corner, styles.cornerBottomLeft]} />
                                <View style={[styles.corner, styles.cornerBottomRight]} />
                            </View>
                            <View style={styles.overlaySide} />
                        </View>
                        <View style={styles.overlayBottom}>
                            <Text style={styles.instructionText}>
                                {Strings.importEvent?.centerQRCode || "Scannez le QR code pour importer"}
                            </Text>
                            <TouchableOpacity
                                style={styles.boutonAnnuler}
                                onPress={handleAnnulerBoutonPress}
                            >
                                <Text style={styles.instructionText}>
                                    {Strings.exportEvent.cancel}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            ) : (
                <View style={styles.resultContainer}>
                    {/* Header avec icône */}
                    <View style={styles.header}>
                        <Ionicons
                            name={
                                isReceiving
                                    ? "cloud-download"
                                    : receiveStatus === "Import terminé"
                                        ? "checkmark-circle"
                                        : "alert-circle"
                            }
                            size={60}
                            color={
                                isReceiving
                                    ? "#0E47A1"
                                    : receiveStatus === "Import terminé"
                                        ? "#43A047"
                                        : "#E53935"
                            }
                        />
                        <Text style={styles.headerTitle}>
                            {isReceiving
                                ? "Import en cours"
                                : receiveStatus === "Import terminé"
                                    ? "Import réussi"
                                    : "Import"}
                        </Text>
                    </View>

                    {/* URL WebSocket */}
                    <View style={styles.urlContainer}>
                        <Text style={styles.urlLabel}>Serveur connecté</Text>
                        <Text style={styles.urlText}>{scannedData}</Text>
                    </View>

                    {isReceiving ? (
                        <>
                            {/* Animation de chargement */}
                            <Animated.View
                                style={[
                                    styles.loadingIcon,
                                    { transform: [{ scale: pulseAnim }] },
                                ]}
                            >
                                <Ionicons name="sync" size={80} color="#0E47A1" />
                            </Animated.View>

                            {/* Statut actuel */}
                            <View style={styles.statusBox}>
                                <Text style={styles.statusLabel}>{receiveStatus}</Text>
                            </View>

                            {/* Barre de progression */}
                            <View style={styles.progressContainer}>
                                <View style={styles.progressBarBackground}>
                                    <Animated.View
                                        style={[
                                            styles.progressBarFill,
                                            {
                                                width: progressAnim.interpolate({
                                                    inputRange: [0, 100],
                                                    outputRange: ["0%", "100%"],
                                                }),
                                            },
                                        ]}
                                    />
                                </View>
                                <Text style={styles.progressText}>
                                    Points: {importStats.points}/{importStats.totalPoints} | Photos: {importStats.photos}/{importStats.totalPhotos}
                                </Text>
                            </View>

                            {/* Statistiques en temps réel */}
                            <View style={styles.statsContainer}>
                                <View style={styles.statCard}>
                                    <Ionicons name="location" size={32} color="#0E47A1" />
                                    <Text style={styles.statNumber}>{importStats.points}</Text>
                                    <Text style={styles.statLabel}>Points</Text>
                                </View>
                                <View style={styles.statCard}>
                                    <Ionicons name="images" size={32} color="#0E47A1" />
                                    <Text style={styles.statNumber}>{importStats.photos}</Text>
                                    <Text style={styles.statLabel}>Photos</Text>
                                </View>
                                <View style={styles.statCard}>
                                    <Ionicons name="shapes" size={32} color="#0E47A1" />
                                    <Text style={styles.statNumber}>{importStats.geometries}</Text>
                                    <Text style={styles.statLabel}>Géométries</Text>
                                </View>
                            </View>
                        </>
                    ) : (
                        <>
                            {/* Résultat final */}
                            {receiveStatus === "Import terminé" ? (
                                <View style={styles.successContainer}>
                                    <View style={styles.successCard}>
                                        <Ionicons
                                            name="checkmark-circle"
                                            size={48}
                                            color="#43A047"
                                        />
                                        <Text style={styles.successTitle}>
                                            Import réussi !
                                        </Text>
                                        <Text style={styles.successMessage}>
                                            L'événement a été importé avec succès
                                        </Text>
                                    </View>

                                    {/* Résumé final */}
                                    <View style={styles.summaryContainer}>
                                        <Text style={styles.summaryTitle}>Résumé de l'import</Text>
                                        {importedEvent && (
                                            <Text style={styles.summarySubtitle}>{importedEvent.name}</Text>
                                        )}
                                        <View style={styles.summaryRow}>
                                            <View style={styles.summaryItem}>
                                                <Ionicons name="location" size={24} color="#0E47A1" />
                                                <Text style={styles.summaryNumber}>
                                                    {importStats.points}
                                                </Text>
                                                <Text style={styles.summaryLabel}>Points</Text>
                                            </View>
                                            <View style={styles.summaryDivider} />
                                            <View style={styles.summaryItem}>
                                                <Ionicons name="images" size={24} color="#0E47A1" />
                                                <Text style={styles.summaryNumber}>
                                                    {importStats.photos}
                                                </Text>
                                                <Text style={styles.summaryLabel}>Photos</Text>
                                            </View>
                                            <View style={styles.summaryDivider} />
                                            <View style={styles.summaryItem}>
                                                <Ionicons name="shapes" size={24} color="#0E47A1" />
                                                <Text style={styles.summaryNumber}>
                                                    {importStats.geometries}
                                                </Text>
                                                <Text style={styles.summaryLabel}>Géométries</Text>
                                            </View>
                                        </View>
                                    </View>
                                </View>
                            ) : (
                                <View style={styles.errorContainer}>
                                    <Ionicons name="alert-circle" size={48} color="#E53935" />
                                    <Text style={styles.errorTitle}>
                                        Erreur d'import
                                    </Text>
                                    <Text style={styles.errorMessage}>{receiveStatus}</Text>
                                </View>
                            )}

                            {/* Bouton retour */}
                            <TouchableOpacity
                                style={styles.retourButton}
                                onPress={() => navigation.goBack()}
                            >
                                <Ionicons name="arrow-back" size={20} color="#fff" />
                                <Text style={styles.retourButtonText}>
                                    {Strings.exportEvent.back}
                                </Text>
                            </TouchableOpacity>
                        </>
                    )}
                </View>
            )}
        </SafeAreaView>
    );
}
