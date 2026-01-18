import { useNavigation } from "@react-navigation/native";
import {
  SafeAreaView,
  Text,
  View,
  TouchableOpacity,
  Animated,
} from "react-native";
import { EventScreenNavigationProp } from "../../types/types";
import { useSQLiteContext } from "expo-sqlite";
import {
  insertOrReplace,
  deleteWhere,
  getAllWhere,
} from "../../database/queries";
import { useEffect, useState, useRef } from "react";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Ionicons } from "@expo/vector-icons";
import { Strings } from "../../types/strings";
import { useTheme } from "../utils/ThemeContext";
import { getStyles } from "../utils/theme";

// ============= INTERFACES BASÉES SUR LE JSON event_export =============

interface ImportedEvent {
  uuid: string;
  title: string;
  startDate: string;
  endDate: string;
  status: number;
  minDurationMinutes?: number;
  maxDurationMinutes?: number;
}

interface ImportedArea {
  uuid: string;
  eventId: string;
  name: string;
  colorHex: string;
  geoJson: string;
}

interface ImportedPath {
  uuid: string;
  eventId: string;
  name: string;
  colorHex: string;
  startDate: string;
  geoJson: string;
}

interface ImportedEquipment {
  uuid: string;
  type: string;
  length: number;
  description: string;
  storageType: number;
}

interface ImportedPoint {
  uuid: string;
  eventId: string;
  name: string;
  latitude: number;
  longitude: number;
  comment?: string;
  validated?: boolean;
  equipmentId?: string;
  equipmentQuantity?: number;
  ordre?: number;
}

interface EventExportMessage {
  type: "event_export";
  event: ImportedEvent;
  points?: ImportedPoint[];
  areas?: ImportedArea[];
  paths?: ImportedPath[];
  equipments?: ImportedEquipment[];
  metadata?: {
    exportDate: string;
    totalAreas: number;
    totalPaths: number;
    totalEquipments: number;
    note?: string;
  };
}

// ============= COMPOSANT =============

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
    areas: 0,
    paths: 0,
    equipments: 0,
    totalAreas: 0,
    totalPaths: 0,
    totalEquipments: 0,
  });
  const [importedEvent, setImportedEvent] = useState<ImportedEvent | null>(null);

  const progressAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const isProcessing = useRef(false);

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

  // Status: 0=toOrganize, 1=inProgress, 2=installation, 3=uninstallation, 4=completed
  const getStatusString = (status: number): string => {
    switch (status) {
      case 0: return "toOrganize";
      case 1: return "inProgress";
      case 2: return "installation";
      case 3: return "uninstallation";
      case 4: return "completed";
      default: return "toOrganize";
    }
  };

  // StorageType: 0=single, 1=multiple
  const getStorageTypeString = (storageType: number): string => {
    return storageType === 0 ? "single" : "multiple";
  };

  // ============= FONCTIONS DE SAUVEGARDE =============

  const saveEvent = async (event: ImportedEvent) => {
    console.log("Sauvegarde événement:", event.uuid, event.title);
    await insertOrReplace(db, "Evenement", {
      UUID: event.uuid,
      Title: event.title,
      StartDate: event.startDate,
      EndDate: event.endDate,
      Status: getStatusString(event.status),
    });
  };

  const saveEquipment = async (equipment: ImportedEquipment) => {
    console.log("Sauvegarde équipement:", equipment.uuid, equipment.type);
    await insertOrReplace(db, "Equipment", {
      UUID: equipment.uuid,
      Type: equipment.type,
      Length: equipment.length,
      Description: equipment.description,
      StorageType: getStorageTypeString(equipment.storageType),
    });
  };

  const saveArea = async (area: any) => {
    console.log("Sauvegarde zone - données reçues:", JSON.stringify(area));
    const colorHex = area.colorHex || area.color || area.Color || area.ColorHex || "#3388ff";
    const eventId = area.eventId || area.EventID || area.event_id;
    const geoJson = area.geoJson || area.GeoJson || area.geojson;

    console.log("Zone - ColorHex:", colorHex, "EventID:", eventId);

    await insertOrReplace(db, "Area", {
      UUID: area.uuid,
      EventID: eventId,
      Name: area.name,
      ColorHex: colorHex,
      GeoJson: geoJson,
    });
  };

  const savePath = async (path: any) => {
    console.log("Sauvegarde tracé - données reçues:", JSON.stringify(path));
    const colorHex = path.colorHex || path.color || path.Color || path.ColorHex || "#ff6b6b";
    const eventId = path.eventId || path.EventID || path.event_id;
    const startDate = path.startDate || path.StartDate || path.start_date || new Date().toISOString();
    const geoJson = path.geoJson || path.GeoJson || path.geojson;

    console.log("Path - ColorHex:", colorHex, "EventID:", eventId);

    await insertOrReplace(db, "Path", {
      UUID: path.uuid,
      EventID: eventId,
      Name: path.name,
      ColorHex: colorHex,
      StartDate: startDate,
      FastestEstimatedSpeed: 5.0,
      SlowestEstimatedSpeed: 2.5,
      GeoJson: geoJson,
    });
  };

  const savePoint = async (point: ImportedPoint) => {
    console.log("Sauvegarde point:", point.uuid);
    await insertOrReplace(db, "Point", {
      UUID: point.uuid,
      EventID: point.eventId,
      Name: point.name,
      Latitude: point.latitude,
      Longitude: point.longitude,
      Comment: point.comment || "",
      Validated: point.validated ? 1 : 0,
      EquipmentID: point.equipmentId || null,
      EquipmentQuantity: point.equipmentQuantity || 0,
      Ordre: point.ordre || 0,
    });
  };

  // ============= SUPPRESSION DES DONNÉES EXISTANTES =============

  const deleteExistingEventData = async (eventUuid: string) => {
    console.log("Suppression données existantes pour:", eventUuid);

    const existingPoints = await getAllWhere<{ UUID: string }>(
      db, "Point", ["EventID"], [eventUuid]
    );

    for (const point of existingPoints) {
      await deleteWhere(db, "Picture", ["PointID"], [point.UUID]);
    }

    await deleteWhere(db, "Point", ["EventID"], [eventUuid]);
    await deleteWhere(db, "Area", ["EventID"], [eventUuid]);
    await deleteWhere(db, "Path", ["EventID"], [eventUuid]);
    await deleteWhere(db, "Evenement", ["UUID"], [eventUuid]);

    console.log("Suppression terminée");
  };

  // ============= SUPPRESSION DES DONNÉES DE PLANNING =============

  const deleteExistingPlanningData = async (eventUuid: string, teamUuid: string) => {
    console.log("Suppression données planning pour event:", eventUuid, "team:", teamUuid);

    await deleteWhere(db, "PlanningTask", ["TeamID"], [teamUuid]);
    await deleteWhere(db, "PlanningMember", ["TeamID"], [teamUuid]);
    await deleteWhere(db, "PlanningTeam", ["UUID"], [teamUuid]);

    console.log("Suppression planning terminée");
  };

  // ============= TRAITEMENT DU MESSAGE planning_data =============

  const processPlanningData = async (data: any) => {
    const team = data.team;
    const members = data.members || [];
    const installations = data.installations || [];
    const removals = data.removals || [];

    console.log("=== DÉBUT IMPORT PLANNING ===");
    console.log("Team:", team.name);
    console.log("Event:", team.eventName);
    console.log("Members:", members.length);
    console.log("Installations:", installations.length);
    console.log("Removals:", removals.length);

    try {
      // 1. Supprimer les données existantes
      setReceiveStatus("Suppression des données existantes...");
      await deleteExistingPlanningData(team.eventId, team.uuid);

      // 2. Créer ou mettre à jour l'événement en mode planning
      setReceiveStatus("Création de l'événement...");
      await insertOrReplace(db, "Evenement", {
        UUID: team.eventId,
        Title: team.eventName,
        StartDate: installations[0]?.date || new Date().toISOString(),
        EndDate: removals[removals.length - 1]?.date || new Date().toISOString(),
        Status: "toOrganize",
        Mode: "planning",
      });

      // 3. Sauvegarder la team
      setReceiveStatus("Sauvegarde de l'équipe...");
      await insertOrReplace(db, "PlanningTeam", {
        UUID: team.uuid,
        EventID: team.eventId,
        Name: team.name,
        Number: team.number,
      });

      // 4. Sauvegarder les membres
      if (members.length > 0) {
        setReceiveStatus("Import des membres...");
        for (const member of members) {
          await insertOrReplace(db, "PlanningMember", {
            UUID: member.uuid,
            TeamID: team.uuid,
            FirstName: member.firstName,
            LastName: member.lastName,
          });
        }
      }

      // 5. Sauvegarder les tâches d'installation
      if (installations.length > 0) {
        setReceiveStatus("Import des installations...");
        for (let i = 0; i < installations.length; i++) {
          const task = installations[i];
          await insertOrReplace(db, "PlanningTask", {
            UUID: task.uuid,
            TeamID: team.uuid,
            EquipmentType: task.equipmentType,
            Quantity: task.quantity,
            ScheduledDate: task.date,
            TaskType: "installation",
            Status: "pending",
            Comment: task.comment || "",
            GeoJson: task.geoJson,
          });
          setImportStats(prev => ({ ...prev, areas: i + 1 }));
        }
      }

      // 6. Sauvegarder les tâches de déinstallation
      if (removals.length > 0) {
        setReceiveStatus("Import des déinstallations...");
        for (let i = 0; i < removals.length; i++) {
          const task = removals[i];
          await insertOrReplace(db, "PlanningTask", {
            UUID: task.uuid + "-removal", // UUID différent pour la déinstallation
            TeamID: team.uuid,
            EquipmentType: task.equipmentType,
            Quantity: task.quantity,
            ScheduledDate: task.date,
            TaskType: "removal",
            Status: "pending",
            Comment: task.comment || "",
            GeoJson: task.geoJson,
          });
          setImportStats(prev => ({ ...prev, paths: i + 1 }));
        }
      }

      // Terminé
      Animated.timing(progressAnim, {
        toValue: 100,
        duration: 200,
        useNativeDriver: false,
      }).start();

      setImportedEvent({
        uuid: team.eventId,
        title: team.eventName,
        startDate: installations[0]?.date || "",
        endDate: removals[removals.length - 1]?.date || "",
        status: 0,
      });

      console.log("=== IMPORT PLANNING TERMINÉ ===");
      setReceiveStatus("Import terminé");
    } catch (error) {
      console.error("Erreur import planning:", error);
      setReceiveStatus("Erreur: " + String(error));
      throw error;
    }
  };

  // ============= TRAITEMENT DU MESSAGE event_export =============

  const processEventExport = async (data: EventExportMessage) => {
    const event = data.event;
    const points = data.points || [];
    const areas = data.areas || [];
    const paths = data.paths || [];
    const equipments = data.equipments || [];

    console.log("=== DÉBUT IMPORT ===");
    console.log("Event:", event.title);
    console.log("Areas:", areas.length);
    console.log("Paths:", paths.length);
    console.log("Equipments:", equipments.length);
    console.log("Points:", points.length);

    setImportStats({
      areas: 0,
      paths: 0,
      equipments: 0,
      totalAreas: areas.length,
      totalPaths: paths.length,
      totalEquipments: equipments.length,
    });

    try {
      // 1. Supprimer les données existantes
      setReceiveStatus("Suppression des données existantes...");
      await deleteExistingEventData(event.uuid);

      // 2. Sauvegarder l'événement
      setReceiveStatus("Sauvegarde de l'événement...");
      await saveEvent(event);
      setImportedEvent(event);

      // 3. Sauvegarder les équipements
      if (equipments.length > 0) {
        setReceiveStatus("Import des équipements...");
        for (let i = 0; i < equipments.length; i++) {
          await saveEquipment(equipments[i]);
          setImportStats(prev => ({ ...prev, equipments: i + 1 }));
        }
      }

      // 4. Sauvegarder les zones
      if (areas.length > 0) {
        setReceiveStatus("Import des zones...");
        for (let i = 0; i < areas.length; i++) {
          await saveArea(areas[i]);
          setImportStats(prev => ({ ...prev, areas: i + 1 }));

          const total = areas.length + paths.length;
          const progress = total > 0 ? ((i + 1) / total) * 80 : 0;
          Animated.timing(progressAnim, {
            toValue: progress,
            duration: 100,
            useNativeDriver: false,
          }).start();
        }
      }

      // 5. Sauvegarder les tracés
      if (paths.length > 0) {
        setReceiveStatus("Import des tracés...");
        for (let i = 0; i < paths.length; i++) {
          await savePath(paths[i]);
          setImportStats(prev => ({ ...prev, paths: i + 1 }));

          const progress = 40 + ((i + 1) / paths.length) * 40;
          Animated.timing(progressAnim, {
            toValue: progress,
            duration: 100,
            useNativeDriver: false,
          }).start();
        }
      }

      // 6. Sauvegarder les points
      if (points.length > 0) {
        setReceiveStatus("Import des points...");
        for (const point of points) {
          await savePoint(point);
        }
      }

      // Terminé
      Animated.timing(progressAnim, {
        toValue: 100,
        duration: 200,
        useNativeDriver: false,
      }).start();

      console.log("=== IMPORT TERMINÉ ===");
      setReceiveStatus("Import terminé");
    } catch (error) {
      console.error("Erreur import:", error);
      setReceiveStatus("Erreur: " + String(error));
      throw error;
    }
  };

  // ============= WEBSOCKET =============

  const receiveViaWebSocket = async (wsUrl: string) => {
    setIsReceiving(true);
    setReceiveStatus("Connexion...");
    setImportStats({
      areas: 0, paths: 0, equipments: 0,
      totalAreas: 0, totalPaths: 0, totalEquipments: 0,
    });
    setImportedEvent(null);
    isProcessing.current = false;
    progressAnim.setValue(0);

    try {
      const ws = new WebSocket(wsUrl);

      await new Promise<void>((resolve, reject) => {
        ws.onopen = () => {
          console.log("WebSocket connecté");
          setReceiveStatus("Connecté - En attente...");
          ws.send(JSON.stringify({
            type: "import_request",
            timestamp: new Date().toISOString(),
          }));
        };

        ws.onmessage = async (wsEvent) => {
          try {
            if (!wsEvent.data.startsWith("{")) return;

            const message = JSON.parse(wsEvent.data);
            console.log("=== JSON REÇU ===");
            console.log("Type:", message.type);
            console.log("Event:", message.event?.title);
            console.log("Areas:", message.areas?.length || 0);
            console.log("Paths:", message.paths?.length || 0);
            console.log("Equipments:", message.equipments?.length || 0);
            console.log("=================");

            if (isProcessing.current) {
              console.log("Déjà en cours de traitement");
              return;
            }

            // Accepter event_export OU event_data
            if (message.type === "event_export" || message.type === "event_data") {
              isProcessing.current = true;
              setReceiveStatus("Traitement...");

              await processEventExport(message as EventExportMessage);

              ws.send(JSON.stringify({
                type: "import_complete",
                eventId: message.event.uuid,
                timestamp: new Date().toISOString(),
              }));

              setTimeout(() => {
                ws.close();
                resolve();
              }, 500);
            }
            // Traiter planning_data
            else if (message.type === "planning_data") {
              isProcessing.current = true;
              setReceiveStatus("Traitement planning...");

              await processPlanningData(message);

              ws.send(JSON.stringify({
                type: "import_complete",
                eventId: message.team.eventId,
                timestamp: new Date().toISOString(),
              }));

              setTimeout(() => {
                ws.close();
                resolve();
              }, 500);
            }
            else if (message.type === "error") {
              setReceiveStatus("Erreur: " + message.message);
              ws.close();
              reject(new Error(message.message));
            } else {
              console.log("Type de message non reconnu:", message.type);
            }
          } catch (err) {
            console.error("Erreur parsing:", err);
            setReceiveStatus("Erreur de traitement: " + String(err));
          }
        };

        ws.onerror = (err) => {
          console.error("Erreur WebSocket:", err);
          setReceiveStatus("Erreur de connexion");
          reject(err);
        };

        ws.onclose = () => console.log("WebSocket fermé");

        setTimeout(() => {
          if (ws.readyState !== WebSocket.CLOSED) {
            ws.close();
            reject(new Error("Timeout"));
          }
        }, 120000);
      });
    } catch (error) {
      setReceiveStatus("Échec de l'import");
    } finally {
      setIsReceiving(false);
    }
  };

  // ============= HANDLERS =============

  const handleBarcodeScanned = ({ data }: { data: string }) => {
    if (isCameraActive) {
      setScannedData(data);
      setIsCameraActive(false);

      if (data.startsWith("ws://") || data.startsWith("wss://")) {
        receiveViaWebSocket(data);
      } else {
        setReceiveStatus(Strings.exportEvent.invalidWebSocketURL);
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
                {Strings.importEvent?.centerQRCode || "Scannez le QR code pour importer"}
              </Text>
              <TouchableOpacity style={styles.boutonAnnuler} onPress={handleCancel}>
                <Text style={styles.instructionText}>{Strings.exportEvent.cancel}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.resultContainer}>
          <View style={styles.header}>
            <Ionicons
              name={isReceiving ? "cloud-download" : receiveStatus === "Import terminé" ? "checkmark-circle" : "alert-circle"}
              size={60}
              color={isReceiving ? "#0E47A1" : receiveStatus === "Import terminé" ? "#43A047" : "#E53935"}
            />
            <Text style={styles.headerTitle}>
              {isReceiving ? "Import en cours" : receiveStatus === "Import terminé" ? "Import réussi" : "Import"}
            </Text>
          </View>

          <View style={styles.urlContainer}>
            <Text style={styles.urlLabel}>Serveur</Text>
            <Text style={styles.urlText}>{scannedData}</Text>
          </View>

          {isReceiving ? (
            <>
              <Animated.View style={[styles.loadingIcon, { transform: [{ scale: pulseAnim }] }]}>
                <Ionicons name="sync" size={80} color="#0E47A1" />
              </Animated.View>

              <View style={styles.statusBox}>
                <Text style={styles.statusLabel}>{receiveStatus}</Text>
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
                  Zones: {importStats.areas}/{importStats.totalAreas} |
                  Tracés: {importStats.paths}/{importStats.totalPaths} |
                  Équipements: {importStats.equipments}/{importStats.totalEquipments}
                </Text>
              </View>

              <View style={styles.statsContainer}>
                <View style={styles.statCard}>
                  <Ionicons name="map" size={32} color="#0E47A1" />
                  <Text style={styles.statNumber}>{importStats.areas}</Text>
                  <Text style={styles.statLabel}>Zones</Text>
                </View>
                <View style={styles.statCard}>
                  <Ionicons name="git-branch" size={32} color="#0E47A1" />
                  <Text style={styles.statNumber}>{importStats.paths}</Text>
                  <Text style={styles.statLabel}>Tracés</Text>
                </View>
                <View style={styles.statCard}>
                  <Ionicons name="construct" size={32} color="#0E47A1" />
                  <Text style={styles.statNumber}>{importStats.equipments}</Text>
                  <Text style={styles.statLabel}>Équipements</Text>
                </View>
              </View>
            </>
          ) : (
            <>
              {receiveStatus === "Import terminé" ? (
                <View style={styles.successContainer}>
                  <View style={styles.successCard}>
                    <Ionicons name="checkmark-circle" size={48} color="#43A047" />
                    <Text style={styles.successTitle}>Import réussi !</Text>
                    <Text style={styles.successMessage}>L'événement a été importé avec succès</Text>
                  </View>

                  <View style={styles.summaryContainer}>
                    <Text style={styles.summaryTitle}>Résumé</Text>
                    {importedEvent && <Text style={styles.summarySubtitle}>{importedEvent.title}</Text>}
                    <View style={styles.summaryRow}>
                      <View style={styles.summaryItem}>
                        <Ionicons name="map" size={24} color="#0E47A1" />
                        <Text style={styles.summaryNumber}>{importStats.areas}</Text>
                        <Text style={styles.summaryLabel}>Zones</Text>
                      </View>
                      <View style={styles.summaryDivider} />
                      <View style={styles.summaryItem}>
                        <Ionicons name="git-branch" size={24} color="#0E47A1" />
                        <Text style={styles.summaryNumber}>{importStats.paths}</Text>
                        <Text style={styles.summaryLabel}>Tracés</Text>
                      </View>
                      <View style={styles.summaryDivider} />
                      <View style={styles.summaryItem}>
                        <Ionicons name="construct" size={24} color="#0E47A1" />
                        <Text style={styles.summaryNumber}>{importStats.equipments}</Text>
                        <Text style={styles.summaryLabel}>Équipements</Text>
                      </View>
                    </View>
                  </View>
                </View>
              ) : (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle" size={48} color="#E53935" />
                  <Text style={styles.errorTitle}>Erreur d'import</Text>
                  <Text style={styles.errorMessage}>{receiveStatus}</Text>
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
