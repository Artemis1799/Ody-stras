import { useNavigation, useRoute } from "@react-navigation/native";
import {
  SafeAreaView,
  Text,
  View,
  TouchableOpacity,
  Animated,
} from "react-native";
import {
  EventScreenNavigationProp,
  Evenement,
  Point,
  Area,
  Path,
  Equipment,
  Picture,
} from "../../types/types";
import { useSQLiteContext } from "expo-sqlite";
import {
  getAllWhere,
  getAll,
  getPhotosForPoint,
  flushDatabase,
} from "../../database/queries";
import { useEffect, useState, useRef } from "react";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Ionicons } from "@expo/vector-icons";
import { Strings } from "../../types/strings";
import { useTheme } from "../utils/ThemeContext";
import { getStyles } from "../utils/theme";
import { NO_EQUIPMENT_ID } from "../constants/constants";

// ============= INTERFACES POUR L'EXPORT =============

interface ExportedEvent {
  uuid: string;
  title: string;
  startDate: string;
  endDate: string;
  status: number;
}

interface ExportedArea {
  uuid: string;
  eventId: string;
  name: string;
  colorHex: string;
  geoJson: string;
}

interface ExportedPath {
  uuid: string;
  eventId: string;
  name: string;
  colorHex: string;
  startDate: string;
  geoJson: string;
}

interface ExportedEquipment {
  uuid: string;
  type: string;
  length: number;
  description: string;
  storageType: number;
}

interface ExportedPoint {
  uuid: string;
  eventId: string;
  name: string;
  latitude: number;
  longitude: number;
  comment: string;
  validated: boolean;
  equipmentId: string | null;
  equipmentQuantity: number;
  ordre: number;
  photos: ExportedPhoto[];
}

interface ExportedPhoto {
  uuid: string;
  picture: string;
}

interface EventExportMessage {
  type: "event_export";
  event: ExportedEvent;
  points: ExportedPoint[];
  areas: ExportedArea[];
  paths: ExportedPath[];
  equipments: ExportedEquipment[];
  metadata: {
    exportDate: string;
    totalAreas: number;
    totalPaths: number;
    totalEquipments: number;
    totalPoints: number;
    note: string;
  };
}

// ============= COMPOSANT =============

export default function ExportEventScreen() {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const route = useRoute();
  const db = useSQLiteContext();
  const navigation = useNavigation<EventScreenNavigationProp>();

  const [scannedData, setScannedData] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(true);
  const [permission, requestPermission] = useCameraPermissions();
  const [isSending, setIsSending] = useState(false);
  const [sendStatus, setSendStatus] = useState<string | null>(null);
  const [exportStats, setExportStats] = useState({
    areas: 0,
    paths: 0,
    equipments: 0,
    points: 0,
    totalAreas: 0,
    totalPaths: 0,
    totalEquipments: 0,
    totalPoints: 0,
  });

  const eventUUID = (route.params as { eventUUID: string }).eventUUID;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  console.log("Exporting event with UUID:", eventUUID);

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

  // Convertir le status string vers number
  const getStatusNumber = (status: string): number => {
    switch (status) {
      case "toOrganize": return 0;
      case "inProgress": return 1;
      case "installation": return 2;
      case "uninstallation": return 3;
      case "completed": return 4;
      default: return 0;
    }
  };

  // Convertir le storageType string vers number
  const getStorageTypeNumber = (storageType?: string): number => {
    return storageType === "single" ? 0 : 1;
  };

  // ============= CONSTRUCTION DU JSON D'EXPORT =============

  const buildExportData = async (): Promise<EventExportMessage> => {
    console.log("=== CONSTRUCTION DES DONNÉES D'EXPORT ===");

    // 1. Récupérer l'événement
    const events = await getAllWhere<Evenement>(db, "Evenement", ["UUID"], [eventUUID]);
    if (events.length === 0) {
      throw new Error("Événement non trouvé");
    }
    const event = events[0];
    console.log("Événement:", event.Title);

    const exportedEvent: ExportedEvent = {
      uuid: event.UUID,
      title: event.Title,
      startDate: event.StartDate,
      endDate: event.EndDate,
      status: getStatusNumber(event.Status),
    };

    // 2. Récupérer les zones (Area)
    const areas = await getAllWhere<Area>(db, "Area", ["EventID"], [eventUUID]);
    console.log("Zones:", areas.length);

    const exportedAreas: ExportedArea[] = areas.map(area => ({
      uuid: area.UUID,
      eventId: area.EventID,
      name: area.Name || "",
      colorHex: area.ColorHex,
      geoJson: area.GeoJson,
    }));

    // 3. Récupérer les tracés (Path)
    const paths = await getAllWhere<Path>(db, "Path", ["EventID"], [eventUUID]);
    console.log("Tracés:", paths.length);

    const exportedPaths: ExportedPath[] = paths.map(path => ({
      uuid: path.UUID,
      eventId: path.EventID,
      name: path.Name,
      colorHex: path.ColorHex,
      startDate: path.StartDate,
      geoJson: path.GeoJson,
    }));

    // 4. Récupérer tous les équipements
    const equipments = await getAll<Equipment>(db, "Equipment");
    console.log("Équipements:", equipments.length);

    const exportedEquipments: ExportedEquipment[] = equipments.map(eq => ({
      uuid: eq.UUID,
      type: eq.Type,
      length: eq.Length || 0,
      description: eq.Description || "",
      storageType: getStorageTypeNumber(eq.StorageType),
    }));

    // 5. Récupérer les points avec leurs photos
    const points = await getAllWhere<Point>(db, "Point", ["EventID"], [eventUUID]);
    console.log("Points:", points.length);

    const exportedPoints: ExportedPoint[] = await Promise.all(
      points.map(async (point) => {
        const photos = await getPhotosForPoint<Picture>(db, point.UUID);
        return {
          uuid: point.UUID,
          eventId: point.EventID,
          name: point.Name,
          latitude: point.Latitude,
          longitude: point.Longitude,
          comment: point.Comment || "",
          validated: (point.Validated || 0) === 1,
          equipmentId: point.EquipmentID === NO_EQUIPMENT_ID ? null : (point.EquipmentID || null),
          equipmentQuantity: point.EquipmentQuantity || 0,
          ordre: point.Ordre || 0,
          photos: photos.map(photo => ({
            uuid: photo.UUID,
            picture: photo.Picture,
          })),
        };
      })
    );

    // 6. Construire le message final
    const exportMessage: EventExportMessage = {
      type: "event_export",
      event: exportedEvent,
      points: exportedPoints,
      areas: exportedAreas,
      paths: exportedPaths,
      equipments: exportedEquipments,
      metadata: {
        exportDate: new Date().toISOString(),
        totalAreas: exportedAreas.length,
        totalPaths: exportedPaths.length,
        totalEquipments: exportedEquipments.length,
        totalPoints: exportedPoints.length,
        note: "Export depuis l'application mobile",
      },
    };

    console.log("=== DONNÉES D'EXPORT PRÊTES ===");
    return exportMessage;
  };

  // ============= ENVOI VIA WEBSOCKET =============

  const sendDataViaWebSocket = async (wsUrl: string) => {
    setIsSending(true);
    setSendStatus("Préparation des données...");
    progressAnim.setValue(0);

    try {
      // Construire les données d'export
      const exportData = await buildExportData();

      setExportStats({
        areas: 0,
        paths: 0,
        equipments: 0,
        points: 0,
        totalAreas: exportData.areas.length,
        totalPaths: exportData.paths.length,
        totalEquipments: exportData.equipments.length,
        totalPoints: exportData.points.length,
      });

      setSendStatus("Connexion au serveur...");
      const ws = new WebSocket(wsUrl);

      await new Promise<void>((resolve, reject) => {
        ws.onopen = async () => {
          console.log("WebSocket connecté");
          setSendStatus("Envoi des données...");

          // Format attendu par le serveur pour handleBulkData:
          // Le serveur détecte: data.points && Array.isArray(data.points)
          // Donc on envoie un objet avec points directement, sans "type"

          // Convertir les points au format attendu par le serveur
          const bulkData = {
            eventUUID: exportData.event.uuid,
            event: exportData.event,
            areas: exportData.areas,
            paths: exportData.paths,
            equipments: exportData.equipments,
            points: exportData.points.map(point => ({
              UUID: point.uuid,
              EventID: point.eventId,
              Name: point.name,
              Latitude: point.latitude,
              Longitude: point.longitude,
              Comment: point.comment,
              Validated: point.validated ? 1 : 0,
              EquipmentID: point.equipmentId,
              EquipmentQuantity: point.equipmentQuantity,
              Ordre: point.ordre,
              photos: point.photos.map(photo => ({
                UUID: photo.uuid,
                Picture: photo.picture,
              })),
            })),
            metadata: exportData.metadata,
          };


          console.log("Envoi du JSON bulk avec", bulkData.points.length, "points");
          console.log("PAYLOAD JSON COMPLETE:", JSON.stringify(bulkData, null, 2));
          ws.send(JSON.stringify(bulkData));

          // Mettre à jour les stats
          setExportStats(prev => ({
            ...prev,
            areas: exportData.areas.length,
            paths: exportData.paths.length,
            equipments: exportData.equipments.length,
            points: exportData.points.length,
          }));

          Animated.timing(progressAnim, {
            toValue: 80,
            duration: 500,
            useNativeDriver: false,
          }).start();

          console.log("JSON envoyé, en attente de confirmation...");
        };

        ws.onmessage = async (event) => {
          console.log("Message reçu:", event.data);

          // Vérifier si c'est l'ACK final
          if (event.data.includes("complete") || event.data.includes("reçu") || event.data.includes("success")) {
            setSendStatus("Transfert terminé");
            Animated.timing(progressAnim, {
              toValue: 100,
              duration: 300,
              useNativeDriver: false,
            }).start();

            // Flush database on success
            await flushDatabase(db);

            setTimeout(() => {
              ws.close();
              resolve();
              setTimeout(() => {
                navigation.navigate("Events");
              }, 2000);
            }, 500);
          }
        };

        ws.onerror = (error) => {
          console.error("Erreur WebSocket:", error);
          setSendStatus("Erreur de connexion");
          reject(error);
        };

        ws.onclose = () => {
          console.log("WebSocket fermé");
        };

        // Timeout après 60 secondes
        setTimeout(() => {
          if (ws.readyState !== WebSocket.CLOSED) {
            ws.close();
            reject(new Error("Timeout"));
          }
        }, 60000);
      });
    } catch (error) {
      console.error("Erreur lors de l'export:", error);
      setSendStatus("Échec de l'envoi: " + String(error));
    } finally {
      setIsSending(false);
    }
  };

  // ============= HANDLERS =============

  const handleBarcodeScanned = ({ data }: { data: string }) => {
    if (isCameraActive) {
      setScannedData(data);
      setIsCameraActive(false);

      if (data.startsWith("ws://") || data.startsWith("wss://")) {
        sendDataViaWebSocket(data);
      } else {
        setSendStatus(Strings.exportEvent.invalidWebSocketURL);
      }
    }
  };

  const handleCancel = () => {
    setIsCameraActive(false);
    navigation.goBack();
  };

  // ============= RENDER =============

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
            barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
            onBarcodeScanned={handleBarcodeScanned}
          />
          <View style={styles.overlay}>
            <View style={styles.overlayTop} />
            <View style={styles.overlayMiddle}>
              <View style={styles.overlaySide} />
              <View style={styles.scanArea}>
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
              <TouchableOpacity style={styles.boutonAnnuler} onPress={handleCancel}>
                <Text style={styles.instructionText}>
                  {Strings.exportEvent.cancel}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.resultContainer}>
          <View style={styles.header}>
            <Ionicons
              name={isSending ? "cloud-upload" : sendStatus === "Transfert terminé" ? "checkmark-circle" : "alert-circle"}
              size={60}
              color={isSending ? "#0E47A1" : sendStatus === "Transfert terminé" ? "#43A047" : "#E53935"}
            />
            <Text style={styles.headerTitle}>
              {isSending
                ? Strings.exportEvent.exportInProgress
                : sendStatus === "Transfert terminé"
                  ? Strings.exportEvent.exportSuccess
                  : Strings.exportEvent.export}
            </Text>
          </View>

          <View style={styles.urlContainer}>
            <Text style={styles.urlLabel}>Serveur</Text>
            <Text style={styles.urlText}>{scannedData}</Text>
          </View>

          {isSending ? (
            <>
              <Animated.View style={[styles.loadingIcon, { transform: [{ scale: pulseAnim }] }]}>
                <Ionicons name="sync" size={80} color="#0E47A1" />
              </Animated.View>

              <View style={styles.statusBox}>
                <Text style={styles.statusLabel}>{sendStatus}</Text>
              </View>

              <View style={styles.progressContainer}>
                <View style={styles.progressBarBackground}>
                  <Animated.View
                    style={[
                      styles.progressBarFill,
                      { width: progressAnim.interpolate({ inputRange: [0, 100], outputRange: ["0%", "100%"] }) },
                    ]}
                  />
                </View>
                <Text style={styles.progressText}>
                  Zones: {exportStats.areas}/{exportStats.totalAreas} |
                  Tracés: {exportStats.paths}/{exportStats.totalPaths} |
                  Points: {exportStats.points}/{exportStats.totalPoints}
                </Text>
              </View>

              <View style={styles.statsContainer}>
                <View style={styles.statCard}>
                  <Ionicons name="map" size={32} color="#0E47A1" />
                  <Text style={styles.statNumber}>{exportStats.areas}</Text>
                  <Text style={styles.statLabel}>Zones</Text>
                </View>
                <View style={styles.statCard}>
                  <Ionicons name="git-branch" size={32} color="#0E47A1" />
                  <Text style={styles.statNumber}>{exportStats.paths}</Text>
                  <Text style={styles.statLabel}>Tracés</Text>
                </View>
                <View style={styles.statCard}>
                  <Ionicons name="location" size={32} color="#0E47A1" />
                  <Text style={styles.statNumber}>{exportStats.points}</Text>
                  <Text style={styles.statLabel}>Points</Text>
                </View>
              </View>
            </>
          ) : (
            <>
              {sendStatus === "Transfert terminé" ? (
                <View style={styles.successContainer}>
                  <View style={styles.successCard}>
                    <Ionicons name="checkmark-circle" size={48} color="#43A047" />
                    <Text style={styles.successTitle}>{Strings.exportEvent.transferSuccess}</Text>
                    <Text style={styles.successMessage}>
                      Toutes les données ont été envoyées avec succès
                    </Text>
                  </View>

                  <View style={styles.summaryContainer}>
                    <Text style={styles.summaryTitle}>Résumé du transfert</Text>
                    <View style={styles.summaryRow}>
                      <View style={styles.summaryItem}>
                        <Ionicons name="map" size={24} color="#0E47A1" />
                        <Text style={styles.summaryNumber}>{exportStats.totalAreas}</Text>
                        <Text style={styles.summaryLabel}>Zones</Text>
                      </View>
                      <View style={styles.summaryDivider} />
                      <View style={styles.summaryItem}>
                        <Ionicons name="git-branch" size={24} color="#0E47A1" />
                        <Text style={styles.summaryNumber}>{exportStats.totalPaths}</Text>
                        <Text style={styles.summaryLabel}>Tracés</Text>
                      </View>
                      <View style={styles.summaryDivider} />
                      <View style={styles.summaryItem}>
                        <Ionicons name="location" size={24} color="#0E47A1" />
                        <Text style={styles.summaryNumber}>{exportStats.totalPoints}</Text>
                        <Text style={styles.summaryLabel}>Points</Text>
                      </View>
                    </View>
                  </View>
                </View>
              ) : (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle" size={48} color="#E53935" />
                  <Text style={styles.errorTitle}>{Strings.exportEvent.transferError}</Text>
                  <Text style={styles.errorMessage}>{sendStatus}</Text>
                </View>
              )}

              <TouchableOpacity style={styles.retourButton} onPress={() => navigation.goBack()}>
                <Ionicons name="arrow-back" size={20} color="#fff" />
                <Text style={styles.retourButtonText}>{Strings.exportEvent.back}</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}
