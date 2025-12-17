import { useNavigation, useRoute } from "@react-navigation/native";
import {
  SafeAreaView,
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
} from "react-native";
import {
  EventScreenNavigationProp,
  PointOnMap,
  Photos,
} from "../../types/types";
import { useSQLiteContext } from "expo-sqlite";
import { getPointsForEvent, getPhotosForPoint, flushDatabase } from "../../database/queries";
import { useEffect, useState, useRef } from "react";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Ionicons } from "@expo/vector-icons";
import { Strings } from "../../types/strings";
import { useTheme } from "../utils/ThemeContext";
import { getStyles } from "../utils/theme";
import { NO_EQUIPMENT_ID } from "../constants/constants";

export default function ExportEventScreen() {
  const { theme } = useTheme();
  const styles = getStyles(theme);
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
              photos: photos.map((photo) => ({
                UUID: photo.UUID,
                Picture: photo.Picture,
                Picture_name: photo.Picture_name,
              })),
            };
          } catch (error) {
            console.error(
              `Erreur chargement photos pour point ${point.UUID}:`,
              error
            );
            return {
              ...point,
              photos: [],
            };
          }
        })
      );

      const totalPhotosCount = pointsWithPhotos.reduce(
        (sum, p) => sum + p.photos.length,
        0
      );
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
            totalPhotos: totalPhotosCount,
          };
          ws.send(JSON.stringify(metadata));
          messageCount++;
          await new Promise((r) => setTimeout(r, 200));

          // Envoyer chaque point sans les photos d'abord
          for (let i = 0; i < pointsWithPhotos.length; i++) {
            const point = pointsWithPhotos[i];
            setCurrentPoint(i + 1);
            setSendStatus(`Envoi en cours...`);

            // Animer la progression
            const progress =
              ((i + 1) / (pointsWithPhotos.length + totalPhotosCount)) * 100;
            Animated.timing(progressAnim, {
              toValue: progress,
              duration: 300,
              useNativeDriver: false,
            }).start();

            // Envoyer les données du point sans les photos
            const { photos, ...pointWithoutPhotos } = point;
            
            // Gérer le cas "Aucun équipement" pour l'export
            const pointToExport = {
                ...pointWithoutPhotos,
                Equipement_ID: pointWithoutPhotos.Equipement_ID === NO_EQUIPMENT_ID ? null : pointWithoutPhotos.Equipement_ID
            };

            const pointData = {
              type: "point",
              eventUUID: eventUUID,
              pointIndex: i,
              totalPoints: pointsWithPhotos.length,
              point: {
                ...pointToExport,
                photoCount: photos.length,
              },
            };

            ws.send(JSON.stringify(pointData));
            messageCount++;
            await new Promise((r) => setTimeout(r, 150));

            // Envoyer chaque photo séparément
            for (let j = 0; j < photos.length; j++) {
              const photo = photos[j];

              // Calculer la taille de l'image
              const imageSize = photo.Picture
                ? Math.ceil(photo.Picture.length * 0.75)
                : 0;

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
                  Picture_name: photo.Picture_name,
                },
              };

              ws.send(JSON.stringify(photoData));
              messageCount++;
              photosProcessed++;
              setSentPhotos(photosProcessed);

              // Progression incluant les photos
              const totalItems = pointsWithPhotos.length + totalPhotosCount;
              const currentProgress =
                ((i + 1 + photosProcessed) / totalItems) * 100;
              Animated.timing(progressAnim, {
                toValue: currentProgress,
                duration: 200,
                useNativeDriver: false,
              }).start();

              // Délai adaptatif selon la taille de l'image
              // Plus l'image est grande, plus on attend
              const delay =
                imageSize > 500000 ? 500 : imageSize > 200000 ? 300 : 200;
              await new Promise((r) => setTimeout(r, delay));
            }
          }

          // Envoyer un message de fin
          const endMessage = {
            type: "end",
            eventUUID: eventUUID,
            totalMessages: messageCount,
          };
          ws.send(JSON.stringify(endMessage));
          messageCount++;

          console.log(
            `Envoi terminé: ${pointsWithPhotos.length} points, ${totalPhotosCount} photos en ${messageCount} messages`
          );
        };

        ws.onmessage = async (event) => {
          // Vérifier si c'est l'ACK final
          if (event.data.includes("complete") || event.data.includes("reçu")) {
            setSendStatus("Transfert terminé");
            Animated.timing(progressAnim, {
              toValue: 100,
              duration: 300,
              useNativeDriver: false,
            }).start();

            // Flush database on success
            await flushDatabase(db);

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
        setSendStatus(Strings.exportEvent.invalidWebSocketURL);
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
                {Strings.exportEvent.centerQRCode}
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
                isSending
                  ? "cloud-upload"
                  : sendStatus === "Transfert terminé"
                    ? "checkmark-circle"
                    : "alert-circle"
              }
              size={60}
              color={
                isSending
                  ? "#0E47A1"
                  : sendStatus === "Transfert terminé"
                    ? "#43A047"
                    : "#E53935"
              }
            />
            <Text style={styles.headerTitle}>
              {isSending
                ? Strings.exportEvent.exportInProgress
                : sendStatus === Strings.exportEvent.transferComplete
                  ? Strings.exportEvent.exportSuccess
                  : Strings.exportEvent.export}
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
                          outputRange: ["0%", "100%"],
                        }),
                      },
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
                    <Ionicons
                      name="checkmark-circle"
                      size={48}
                      color="#43A047"
                    />
                    <Text style={styles.successTitle}>
                      {Strings.exportEvent.transferSuccess}
                    </Text>
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
                        <Text style={styles.summaryNumber}>
                          {totalPointsToSend}
                        </Text>
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
                  <Text style={styles.errorTitle}>
                    {Strings.exportEvent.transferError}
                  </Text>
                  <Text style={styles.errorMessage}>{sendStatus}</Text>
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
