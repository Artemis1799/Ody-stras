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
import { insert } from "../../database/queries";
import { useEffect, useState, useRef } from "react";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Ionicons } from "@expo/vector-icons";
import { Strings } from "../../types/strings";
import { useTheme } from "../utils/ThemeContext";
import { getStyles } from "../utils/theme";

interface ImportedEvent {
    UUID: string;
    Name: string;
    Description: string;
    StartDate: string;
    EndDate: string | null;
    Status: number;
}

interface ExportStartMessage {
    type: "export_start";
    data: {
        message: string;
        totalEvents: number;
        timestamp: string;
    };
    timestamp: string;
}

interface EventMessage {
    type: "event";
    data: ImportedEvent;
}

interface ExportEndMessage {
    type: "export_end";
    data: {
        message: string;
        summary: {
            events: number;
            total: number;
        };
        timestamp: string;
    };
}

type WebSocketMessage = ExportStartMessage | EventMessage | ExportEndMessage;

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
    const [currentEvent, setCurrentEvent] = useState(0);
    const [totalEvents, setTotalEvents] = useState(0);
    const [importedEvents, setImportedEvents] = useState<ImportedEvent[]>([]);

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

    const saveEventToDatabase = async (event: ImportedEvent) => {
        try {
            // Convertir le format du JSON vers le format de la base de données
            const eventData = {
                UUID: event.UUID,
                Nom: event.Name,
                Description: event.Description,
                Date_debut: event.StartDate,
                Status: event.Status === 1 ? "OK" : "En cours",
            };

            await insert(db, "Evenement", eventData);
            console.log(`Événement ${event.UUID} sauvegardé avec succès`);
        } catch (error) {
            console.error(`Erreur lors de la sauvegarde de l'événement ${event.UUID}:`, error);
            throw error;
        }
    };

    const receiveEventsViaWebSocket = async (wsUrl: string) => {
        setIsReceiving(true);
        setReceiveStatus("Connexion au serveur...");
        setCurrentEvent(0);
        setImportedEvents([]);

        try {
            const ws = new WebSocket(wsUrl);

            await new Promise<void>((resolve, reject) => {
                const receivedEvents: ImportedEvent[] = [];

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

                ws.onmessage = async (event) => {
                    try {
                        const message: WebSocketMessage = JSON.parse(event.data);
                        console.log("Message reçu:", message.type);

                        switch (message.type) {
                            case "export_start":
                                setTotalEvents(message.data.totalEvents);
                                setReceiveStatus(`Réception de ${message.data.totalEvents} événement(s)...`);
                                break;

                            case "event":
                                const eventData = message.data;
                                receivedEvents.push(eventData);
                                setCurrentEvent(receivedEvents.length);
                                setImportedEvents([...receivedEvents]);

                                // Sauvegarder l'événement dans la base de données
                                await saveEventToDatabase(eventData);

                                // Animer la progression
                                const progress = (receivedEvents.length / (totalEvents || 1)) * 100;
                                Animated.timing(progressAnim, {
                                    toValue: progress,
                                    duration: 300,
                                    useNativeDriver: false,
                                }).start();

                                setReceiveStatus(`Import en cours... (${receivedEvents.length}/${totalEvents || "?"})`);
                                break;

                            case "export_end":
                                setReceiveStatus("Import terminé");
                                Animated.timing(progressAnim, {
                                    toValue: 100,
                                    duration: 300,
                                    useNativeDriver: false,
                                }).start();

                                // Envoyer un accusé de réception
                                const ackMessage = {
                                    type: "import_complete",
                                    eventsReceived: receivedEvents.length,
                                    timestamp: new Date().toISOString(),
                                };
                                ws.send(JSON.stringify(ackMessage));

                                setTimeout(() => {
                                    ws.close();
                                    resolve();
                                }, 500);
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

                // Timeout après 60 secondes
                setTimeout(() => {
                    if (ws.readyState !== WebSocket.CLOSED) {
                        ws.close();
                        if (receivedEvents.length > 0) {
                            resolve();
                        } else {
                            reject(new Error("Timeout - Aucun événement reçu"));
                        }
                    }
                }, 60000);
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
                                    {currentEvent} / {totalEvents} événements
                                </Text>
                            </View>

                            {/* Statistiques en temps réel */}
                            <View style={styles.statsContainer}>
                                <View style={styles.statCard}>
                                    <Ionicons name="calendar" size={32} color="#0E47A1" />
                                    <Text style={styles.statNumber}>{currentEvent}</Text>
                                    <Text style={styles.statLabel}>Événements reçus</Text>
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
                                            Tous les événements ont été importés avec succès
                                        </Text>
                                    </View>

                                    {/* Résumé final */}
                                    <View style={styles.summaryContainer}>
                                        <Text style={styles.summaryTitle}>Résumé de l'import</Text>
                                        <View style={styles.summaryRow}>
                                            <View style={styles.summaryItem}>
                                                <Ionicons name="calendar" size={24} color="#0E47A1" />
                                                <Text style={styles.summaryNumber}>
                                                    {importedEvents.length}
                                                </Text>
                                                <Text style={styles.summaryLabel}>Événements</Text>
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
