import { useNavigation, useRoute } from "@react-navigation/native";
import { SafeAreaView, Text, View, StyleSheet, TouchableOpacity, ActivityIndicator, Animated } from "react-native";
import { EventScreenNavigationProp, PointOnMap, Photos } from "../../types/types";
import { useSQLiteContext } from "expo-sqlite";
import { getPointsForEvent, getPhotosForPoint } from "../../database/queries";
import { useEffect, useState, useRef } from "react";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Ionicons } from "@expo/vector-icons";

export default function ExportEventScreen() {
    const route = useRoute();
    const [points, setPoints] = useState<PointOnMap[]>([]);
    const [scannedData, setScannedData] = useState<string | null>(null);
    const [isCameraActive, setIsCameraActive] = useState(true);
    const [permission, requestPermission] = useCameraPermissions();
    const [isSending, setIsSending] = useState(false);
    const [sendStatus, setSendStatus] = useState<string | null>(null);
    const [currentPoint, setCurrentPoint] = useState(0);
    const [totalPointsToSend, setTotalPointsToSend] = useState(0);
    const [totalPhotos, setTotalPhotos] = useState(0);
    const [sentPhotos, setSentPhotos] = useState(0);
    const eventUUID = (route.params as { eventUUID: string }).eventUUID;
    const db = useSQLiteContext();
    const navigation = useNavigation<EventScreenNavigationProp>();
    const progressAnim = useRef(new Animated.Value(0)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;

    console.log("Exporting event with UUID:", eventUUID);

    useEffect(() => {
        const fetchPoints = async () => {
            const sql = await getPointsForEvent<PointOnMap>(db, eventUUID);
            setPoints(sql);
        };
        fetchPoints();
    }, []);

    useEffect(() => {
        if (!permission?.granted) {
            requestPermission();
        }
    }, [permission]);

    useEffect(() => {
        if (isSending) {
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
    }, [isSending]);

    const sendPointsViaWebSocket = async (wsUrl: string) => {
        setIsSending(true);
        setSendStatus("Préparation...");
        setCurrentPoint(0);

        try {
            // Charger les photos pour chaque point
            const pointsWithPhotos = await Promise.all(
                points.map(async (point) => {
                    try {
                        const photos = await getPhotosForPoint<Photos>(db, point.UUID);
                        return {
                            ...point,
                            photos: photos.map(photo => ({
                                UUID: photo.UUID,
                                Picture: photo.Picture,
                                Picture_name: photo.Picture_name
                            }))
                        };
                    } catch (error) {
                        console.error(`Erreur chargement photos pour point ${point.UUID}:`, error);
                        return {
                            ...point,
                            photos: []
                        };
                    }
                })
            );

            const totalPhotosCount = pointsWithPhotos.reduce((sum, p) => sum + p.photos.length, 0);
            setTotalPointsToSend(pointsWithPhotos.length);
            setTotalPhotos(totalPhotosCount);
            setSentPhotos(0);

            setSendStatus("Connexion au serveur...");
            const ws = new WebSocket(wsUrl);

            await new Promise<void>((resolve, reject) => {
                let messageCount = 0;
                let photosProcessed = 0;

                ws.onopen = async () => {
                    console.log("Connecté au serveur WebSocket");
                    setSendStatus("Connecté");

                    // Envoyer d'abord les métadonnées
                    const metadata = {
                        type: "metadata",
                        eventUUID: eventUUID,
                        timestamp: new Date().toISOString(),
                        totalPoints: pointsWithPhotos.length,
                        totalPhotos: totalPhotosCount
                    };
                    ws.send(JSON.stringify(metadata));
                    messageCount++;
                    await new Promise(r => setTimeout(r, 200));

                    // Envoyer chaque point sans les photos d'abord
                    for (let i = 0; i < pointsWithPhotos.length; i++) {
                        const point = pointsWithPhotos[i];
                        setCurrentPoint(i + 1);
                        setSendStatus(`Envoi en cours...`);

                        // Animer la progression
                        const progress = ((i + 1) / (pointsWithPhotos.length + totalPhotosCount)) * 100;
                        Animated.timing(progressAnim, {
                            toValue: progress,
                            duration: 300,
                            useNativeDriver: false,
                        }).start();

                        // Envoyer les données du point sans les photos
                        const { photos, ...pointWithoutPhotos } = point;
                        const pointData = {
                            type: "point",
                            eventUUID: eventUUID,
                            pointIndex: i,
                            totalPoints: pointsWithPhotos.length,
                            point: {
                                ...pointWithoutPhotos,
                                photoCount: photos.length
                            }
                        };

                        ws.send(JSON.stringify(pointData));
                        messageCount++;
                        await new Promise(r => setTimeout(r, 150));

                        // Envoyer chaque photo séparément
                        for (let j = 0; j < photos.length; j++) {
                            const photo = photos[j];

                            // Calculer la taille de l'image
                            const imageSize = photo.Picture ? Math.ceil(photo.Picture.length * 0.75) : 0;

                            const photoData = {
                                type: "photo",
                                eventUUID: eventUUID,
                                pointUUID: point.UUID,
                                pointIndex: i,
                                photoIndex: j,
                                totalPhotos: photos.length,
                                photo: {
                                    UUID: photo.UUID,
                                    Picture: photo.Picture,
                                    Picture_name: photo.Picture_name
                                }
                            };

                            ws.send(JSON.stringify(photoData));
                            messageCount++;
                            photosProcessed++;
                            setSentPhotos(photosProcessed);

                            // Progression incluant les photos
                            const totalItems = pointsWithPhotos.length + totalPhotosCount;
                            const currentProgress = ((i + 1 + photosProcessed) / totalItems) * 100;
                            Animated.timing(progressAnim, {
                                toValue: currentProgress,
                                duration: 200,
                                useNativeDriver: false,
                            }).start();

                            // Délai adaptatif selon la taille de l'image
                            // Plus l'image est grande, plus on attend
                            const delay = imageSize > 500000 ? 500 : imageSize > 200000 ? 300 : 200;
                            await new Promise(r => setTimeout(r, delay));
                        }
                    }

                    // Envoyer un message de fin
                    const endMessage = {
                        type: "end",
                        eventUUID: eventUUID,
                        totalMessages: messageCount
                    };
                    ws.send(JSON.stringify(endMessage));
                    messageCount++;

                    console.log(`Envoi terminé: ${pointsWithPhotos.length} points, ${totalPhotosCount} photos en ${messageCount} messages`);
                };

                ws.onmessage = (event) => {
                    console.log("Réponse du serveur:", event.data);

                    // Vérifier si c'est l'ACK final
                    if (event.data.includes("complete") || event.data.includes("reçu")) {
                        setSendStatus("Transfert terminé");
                        Animated.timing(progressAnim, {
                            toValue: 100,
                            duration: 300,
                            useNativeDriver: false,
                        }).start();
                        resolve();
                    }
                };

                ws.onerror = (error) => {
                    console.error("Erreur WebSocket:", error);
                    setSendStatus("Erreur de connexion");
                    reject(error);
                };

                ws.onclose = () => {
                    console.log("Connexion fermée");
                };

                // Timeout après 120 secondes (plus long pour beaucoup d'images)
                setTimeout(() => {
                    if (ws.readyState !== WebSocket.CLOSED) {
                        ws.close();
                        reject(new Error("Timeout"));
                    }
                }, 120000);
            });

        } catch (error) {
            console.error("Erreur lors de l'envoi:", error);
            setSendStatus("Échec de l'envoi");
        } finally {
            setIsSending(false);
        }
    };

    const handleBarcodeScanned = ({ data }: { data: string }) => {
        if (isCameraActive) {
            setScannedData(data);
            setIsCameraActive(false);

            // Vérifier que c'est bien une URL WebSocket
            if (data.startsWith("ws://") || data.startsWith("wss://")) {
                sendPointsViaWebSocket(data);
            } else {
                setSendStatus("✗ URL WebSocket invalide");
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
                <Text>Demande d'autorisation de la caméra...</Text>
            </SafeAreaView>
        );
    }

    if (!permission.granted) {
        return (
            <SafeAreaView style={styles.container}>
                <Text>Permission de caméra refusée</Text>
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
                                Centrez le QR code dans le cadre
                            </Text>
                            <TouchableOpacity style={styles.boutonAnnuler} onPress={handleAnnulerBoutonPress}>
                                <Text style={styles.instructionText}>Annuler</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            ) : (
                <View style={styles.resultContainer}>
                    {/* Header avec icône */}
                    <View style={styles.header}>
                        <Ionicons
                            name={isSending ? "cloud-upload" : sendStatus === "Transfert terminé" ? "checkmark-circle" : "alert-circle"}
                            size={60}
                            color={isSending ? "#0E47A1" : sendStatus === "Transfert terminé" ? "#43A047" : "#E53935"}
                        />
                        <Text style={styles.headerTitle}>
                            {isSending ? "Exportation en cours" : sendStatus === "Transfert terminé" ? "Exportation réussie" : "Exportation"}
                        </Text>
                    </View>

                    {/* URL WebSocket */}
                    <View style={styles.urlContainer}>
                        <Text style={styles.urlLabel}>Serveur connecté</Text>
                        <Text style={styles.urlText}>{scannedData}</Text>
                    </View>

                    {isSending ? (
                        <>
                            {/* Animation de chargement */}
                            <Animated.View style={[styles.loadingIcon, { transform: [{ scale: pulseAnim }] }]}>
                                <Ionicons name="sync" size={80} color="#0E47A1" />
                            </Animated.View>

                            {/* Statut actuel */}
                            <View style={styles.statusBox}>
                                <Text style={styles.statusLabel}>{sendStatus}</Text>
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
                                                    outputRange: ['0%', '100%']
                                                })
                                            }
                                        ]}
                                    />
                                </View>
                                <Text style={styles.progressText}>
                                    {currentPoint} / {totalPointsToSend} points
                                </Text>
                            </View>

                            {/* Statistiques en temps réel */}
                            <View style={styles.statsContainer}>
                                <View style={styles.statCard}>
                                    <Ionicons name="location" size={32} color="#0E47A1" />
                                    <Text style={styles.statNumber}>{currentPoint}</Text>
                                    <Text style={styles.statLabel}>Points envoyés</Text>
                                </View>
                                <View style={styles.statCard}>
                                    <Ionicons name="images" size={32} color="#0E47A1" />
                                    <Text style={styles.statNumber}>{sentPhotos}</Text>
                                    <Text style={styles.statLabel}>Photos envoyées</Text>
                                </View>
                            </View>
                        </>
                    ) : (
                        <>
                            {/* Résultat final */}
                            {sendStatus === "Transfert terminé" ? (
                                <View style={styles.successContainer}>
                                    <View style={styles.successCard}>
                                        <Ionicons name="checkmark-circle" size={48} color="#43A047" />
                                        <Text style={styles.successTitle}>Transfert réussi !</Text>
                                        <Text style={styles.successMessage}>
                                            Toutes les données ont été envoyées avec succès
                                        </Text>
                                    </View>

                                    {/* Résumé final */}
                                    <View style={styles.summaryContainer}>
                                        <Text style={styles.summaryTitle}>Résumé du transfert</Text>
                                        <View style={styles.summaryRow}>
                                            <View style={styles.summaryItem}>
                                                <Ionicons name="location" size={24} color="#0E47A1" />
                                                <Text style={styles.summaryNumber}>{totalPointsToSend}</Text>
                                                <Text style={styles.summaryLabel}>Points</Text>
                                            </View>
                                            <View style={styles.summaryDivider} />
                                            <View style={styles.summaryItem}>
                                                <Ionicons name="images" size={24} color="#0E47A1" />
                                                <Text style={styles.summaryNumber}>{totalPhotos}</Text>
                                                <Text style={styles.summaryLabel}>Photos</Text>
                                            </View>
                                        </View>
                                    </View>
                                </View>
                            ) : (
                                <View style={styles.errorContainer}>
                                    <Ionicons name="alert-circle" size={48} color="#E53935" />
                                    <Text style={styles.errorTitle}>Erreur de transfert</Text>
                                    <Text style={styles.errorMessage}>{sendStatus}</Text>
                                </View>
                            )}

                            {/* Bouton retour */}
                            <TouchableOpacity
                                style={styles.retourButton}
                                onPress={() => navigation.goBack()}
                            >
                                <Ionicons name="arrow-back" size={20} color="#fff" />
                                <Text style={styles.retourButtonText}>Retour</Text>
                            </TouchableOpacity>
                        </>
                    )}
                </View>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    cameraContainer: {
        flex: 1,
        position: 'relative',
    },
    camera: {
        flex: 1,
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'space-between',
    },
    overlayTop: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
    },
    overlayMiddle: {
        flexDirection: 'row',
        height: 300,
    },
    overlaySide: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
    },
    scanArea: {
        width: 300,
        height: 300,
        position: 'relative',
    },
    overlayBottom: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    instructionText: {
        color: '#fff',
        fontSize: 16,
        textAlign: 'center',
        fontWeight: '500',
    },
    boutonAnnuler: {
        backgroundColor: "#cc2222ff",
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
        marginTop: 40,
        marginLeft: 20,
        marginRight: 20,
    },
    corner: {
        position: 'absolute',
        width: 40,
        height: 40,
        borderColor: '#00ff00',
    },
    cornerTopLeft: {
        top: 0,
        left: 0,
        borderTopWidth: 4,
        borderLeftWidth: 4,
    },
    cornerTopRight: {
        top: 0,
        right: 0,
        borderTopWidth: 4,
        borderRightWidth: 4,
    },
    cornerBottomLeft: {
        bottom: 0,
        left: 0,
        borderBottomWidth: 4,
        borderLeftWidth: 4,
    },
    cornerBottomRight: {
        bottom: 0,
        right: 0,
        borderBottomWidth: 4,
        borderRightWidth: 4,
    },
    resultContainer: {
        flex: 1,
        backgroundColor: '#F5F5F5',
        padding: 20,
    },
    header: {
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 30,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#0E47A1',
        marginTop: 12,
    },
    urlContainer: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    urlLabel: {
        fontSize: 12,
        color: '#666',
        marginBottom: 4,
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    urlText: {
        fontSize: 14,
        color: '#333',
        fontFamily: 'monospace',
    },
    loadingIcon: {
        alignSelf: 'center',
        marginVertical: 30,
    },
    statusBox: {
        backgroundColor: '#E3F2FD',
        padding: 16,
        borderRadius: 12,
        marginBottom: 20,
        borderLeftWidth: 4,
        borderLeftColor: '#0E47A1',
    },
    statusLabel: {
        fontSize: 16,
        color: '#0E47A1',
        fontWeight: '600',
        textAlign: 'center',
    },
    progressContainer: {
        marginBottom: 30,
    },
    progressBarBackground: {
        height: 12,
        backgroundColor: '#E0E0E0',
        borderRadius: 6,
        overflow: 'hidden',
        marginBottom: 8,
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#0E47A1',
        borderRadius: 6,
    },
    progressText: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        fontWeight: '600',
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: 10,
    },
    statCard: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 12,
        alignItems: 'center',
        flex: 1,
        marginHorizontal: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    statNumber: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#0E47A1',
        marginTop: 8,
    },
    statLabel: {
        fontSize: 12,
        color: '#666',
        marginTop: 4,
        textAlign: 'center',
    },
    successContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    successCard: {
        backgroundColor: '#fff',
        padding: 30,
        borderRadius: 16,
        alignItems: 'center',
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 5,
    },
    successTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#43A047',
        marginTop: 16,
        marginBottom: 8,
    },
    successMessage: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
    },
    summaryContainer: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    summaryTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 16,
        textAlign: 'center',
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
    },
    summaryItem: {
        alignItems: 'center',
        flex: 1,
    },
    summaryDivider: {
        width: 1,
        height: 60,
        backgroundColor: '#E0E0E0',
    },
    summaryNumber: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#0E47A1',
        marginTop: 8,
    },
    summaryLabel: {
        fontSize: 12,
        color: '#666',
        marginTop: 4,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 30,
    },
    errorTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#E53935',
        marginTop: 16,
        marginBottom: 8,
    },
    errorMessage: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
    },
    retourButton: {
        backgroundColor: '#0E47A1',
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 30,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 5,
    },
    retourButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
});