import { useNavigation, useRoute } from "@react-navigation/native";
import { SafeAreaView, Text, View, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import { EventScreenNavigationProp, PointOnMap, Photos } from "../../types/types";
import { useSQLiteContext } from "expo-sqlite";
import { getPointsForEvent, getPhotosForPoint } from "../../database/queries";
import { useEffect, useState } from "react";
import { CameraView, useCameraPermissions } from "expo-camera";

export default function ExportEventScreen() {
    const route = useRoute();
    const [points, setPoints] = useState<PointOnMap[]>([]);
    const [scannedData, setScannedData] = useState<string | null>(null);
    const [isCameraActive, setIsCameraActive] = useState(true);
    const [permission, requestPermission] = useCameraPermissions();
    const [isSending, setIsSending] = useState(false);
    const [sendStatus, setSendStatus] = useState<string | null>(null);
    const eventUUID = (route.params as { eventUUID: string }).eventUUID;
    const db = useSQLiteContext();
    const navigation = useNavigation<EventScreenNavigationProp>();

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

    const sendPointsViaWebSocket = async (wsUrl: string) => {
        setIsSending(true);
        setSendStatus("Chargement des images...");

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

            const totalPhotos = pointsWithPhotos.reduce((sum, p) => sum + p.photos.length, 0);
            setSendStatus("Connexion au serveur...");
            const ws = new WebSocket(wsUrl);

            await new Promise<void>((resolve, reject) => {
                let messageCount = 0;
                let ackCount = 0;

                ws.onopen = async () => {
                    console.log("Connecté au serveur WebSocket");

                    // Envoyer d'abord les métadonnées
                    const metadata = {
                        type: "metadata",
                        eventUUID: eventUUID,
                        timestamp: new Date().toISOString(),
                        totalPoints: pointsWithPhotos.length,
                        totalPhotos: totalPhotos
                    };
                    ws.send(JSON.stringify(metadata));
                    messageCount++;

                    // Envoyer chaque point individuellement
                    for (let i = 0; i < pointsWithPhotos.length; i++) {
                        const point = pointsWithPhotos[i];
                        setSendStatus(`Envoi point ${i + 1}/${pointsWithPhotos.length}...`);

                        const pointData = {
                            type: "point",
                            eventUUID: eventUUID,
                            pointIndex: i,
                            totalPoints: pointsWithPhotos.length,
                            point: point
                        };

                        ws.send(JSON.stringify(pointData));
                        messageCount++;

                        // Petit délai entre les envois
                        await new Promise(r => setTimeout(r, 100));
                    }

                    // Envoyer un message de fin
                    const endMessage = {
                        type: "end",
                        eventUUID: eventUUID,
                        totalMessages: messageCount
                    };
                    ws.send(JSON.stringify(endMessage));
                    messageCount++;

                    console.log(`Envoi terminé: ${pointsWithPhotos.length} points, ${totalPhotos} photos en ${messageCount} messages`);
                };

                ws.onmessage = (event) => {
                    console.log("Réponse du serveur:", event.data);
                    ackCount++;

                    // Vérifier si c'est l'ACK final
                    if (event.data.includes("complete") || event.data.includes("reçu")) {
                        setSendStatus(`✓ ${pointsWithPhotos.length} points et ${totalPhotos} photos envoyés`);
                        resolve();
                    }
                };

                ws.onerror = (error) => {
                    console.error("Erreur WebSocket:", error);
                    setSendStatus("✗ Erreur de connexion");
                    reject(error);
                };

                ws.onclose = () => {
                    console.log("Connexion fermée");
                };

                // Timeout après 60 secondes (plus long pour envoi multiple)
                setTimeout(() => {
                    if (ws.readyState !== WebSocket.CLOSED) {
                        ws.close();
                        reject(new Error("Timeout"));
                    }
                }, 60000);
            });

        } catch (error) {
            console.error("Erreur lors de l'envoi:", error);
            setSendStatus("✗ Échec de l'envoi");
        } finally {
            setIsSending(false);
        }
    };

    const handleBarcodeScanned = ({ data }: { data: string }) => {
        if (isCameraActive) {
            console.log("QR Code scanné:", data);
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
                    <Text style={styles.resultTitle}>QR Code scanné !</Text>
                    <Text style={styles.resultText}>{scannedData}</Text>

                    {isSending && (
                        <View style={styles.sendingContainer}>
                            <ActivityIndicator size="large" color="#0066cc" />
                            <Text style={styles.sendingText}>{sendStatus}</Text>
                        </View>
                    )}

                    {!isSending && sendStatus && (
                        <View style={styles.statusContainer}>
                            <Text style={[
                                styles.statusText,
                                sendStatus.startsWith("✓") ? styles.statusSuccess : styles.statusError
                            ]}>
                                {sendStatus}
                            </Text>
                        </View>
                    )}

                    <Text style={styles.eventInfo}>
                        Event UUID: {eventUUID}
                    </Text>
                    <Text style={styles.eventInfo}>
                        Nombre de points: {points.length}
                    </Text>
                    {points.length > 0 && (
                        <View style={styles.pointsList}>
                            <Text style={styles.pointsTitle}>Points:</Text>
                            {points.map((p, index) => (
                                <Text key={p.UUID} style={styles.pointItem}>
                                    {index + 1}. {p.UUID}
                                </Text>
                            ))}
                        </View>
                    )}

                    <TouchableOpacity
                        style={styles.retourButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Text style={styles.retourButtonText}>Retour</Text>
                    </TouchableOpacity>
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
        backgroundColor: '#fff',
        padding: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    resultTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        color: '#00ff00',
    },
    resultText: {
        fontSize: 16,
        marginBottom: 20,
        textAlign: 'center',
        color: '#333',
    },
    eventInfo: {
        fontSize: 14,
        marginTop: 10,
        color: '#666',
    },
    pointsList: {
        marginTop: 20,
        width: '100%',
        maxHeight: 300,
    },
    pointsTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#333',
    },
    pointItem: {
        fontSize: 12,
        color: '#666',
        marginVertical: 2,
    },
    sendingContainer: {
        marginVertical: 20,
        alignItems: 'center',
    },
    sendingText: {
        marginTop: 10,
        fontSize: 14,
        color: '#0066cc',
    },
    statusContainer: {
        marginVertical: 20,
        padding: 15,
        borderRadius: 8,
        backgroundColor: '#f5f5f5',
    },
    statusText: {
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
    },
    statusSuccess: {
        color: '#00aa00',
    },
    statusError: {
        color: '#cc0000',
    },
    retourButton: {
        marginTop: 30,
        backgroundColor: '#0066cc',
        paddingVertical: 14,
        paddingHorizontal: 40,
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
    },
    retourButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});