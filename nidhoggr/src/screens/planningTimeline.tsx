import React, { useEffect, useState, useCallback } from "react";
import {
    View,
    Text,
    SafeAreaView,
    FlatList,
    TouchableOpacity,
    StyleSheet,
} from "react-native";
import MapView, { Polyline } from "react-native-maps";
import { useNavigation, useRoute, useFocusEffect } from "@react-navigation/native";
import { useSQLiteContext } from "expo-sqlite";
import { Ionicons } from "@expo/vector-icons";
import { EventScreenNavigationProp, PlanningTask, PlanningTeam, GeoJSONData } from "../../types/types";
import { getAllWhere } from "../../database/queries";
import { Header } from "../components/header";
import { useTheme } from "../utils/ThemeContext";
import { getStyles } from "../utils/theme";

interface PlanningTimelineParams {
    eventId: string;
}

export default function PlanningTimelineScreen() {
    const { theme, showMiniMaps } = useTheme();
    const styles = getStyles(theme);
    const db = useSQLiteContext();
    const navigation = useNavigation<EventScreenNavigationProp>();
    const route = useRoute();
    const { eventId } = route.params as PlanningTimelineParams;

    const [tasks, setTasks] = useState<PlanningTask[]>([]);
    const [team, setTeam] = useState<PlanningTeam | null>(null);
    const [loading, setLoading] = useState(true);

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [db, eventId])
    );

    const loadData = async () => {
        try {
            setLoading(true);

            // Charger la team
            const teams = await getAllWhere<PlanningTeam>(db, "PlanningTeam", ["EventID"], [eventId]);
            if (teams.length > 0) {
                setTeam(teams[0]);

                // Charger les tâches de cette team
                const allTasks = await getAllWhere<PlanningTask>(db, "PlanningTask", ["TeamID"], [teams[0].UUID]);

                // Trier par date
                const sortedTasks = allTasks.sort((a, b) =>
                    new Date(a.ScheduledDate).getTime() - new Date(b.ScheduledDate).getTime()
                );

                setTasks(sortedTasks);
            }
        } catch (error) {
            console.error("Erreur chargement planning:", error);
        } finally {
            setLoading(false);
        }
    };

    const getTaskIcon = (task: PlanningTask) => {
        if (task.TaskType === "installation") {
            return task.Status === "completed" ? "checkmark-circle" : "construct";
        } else {
            return task.Status === "completed" ? "checkmark-circle" : "cube";
        }
    };

    const getTaskColor = (task: PlanningTask) => {
        if (task.Status === "completed") return "#43A047";
        if (task.Status === "in_progress") return "#FF9800";
        return task.TaskType === "installation" ? "#0E47A1" : "#E53935";
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString("fr-FR", {
            day: "2-digit",
            month: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
        });
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

    const getTaskCenter = (task: PlanningTask): { latitude: number; longitude: number } | null => {
        const coords = getTaskCoordinates(task);
        if (coords.length === 0) return null;
        const midIndex = Math.floor(coords.length / 2);
        return coords[midIndex];
    };

    const renderTask = ({ item, index }: { item: PlanningTask; index: number }) => (
        <TouchableOpacity
            style={[
                localStyles.taskCard,
                { borderLeftColor: getTaskColor(item), borderLeftWidth: 4 }
            ]}
            onPress={() => {
                navigation.navigate("PlanningNavigation", {
                    eventId,
                    taskType: item.TaskType
                });
            }}
        >
            <View style={localStyles.taskHeader}>
                <View style={localStyles.taskNumber}>
                    <Text style={localStyles.taskNumberText}>{index + 1}</Text>
                </View>
                <Ionicons
                    name={getTaskIcon(item)}
                    size={24}
                    color={getTaskColor(item)}
                />
                <View style={localStyles.taskInfo}>
                    <Text style={localStyles.taskType}>
                        {item.TaskType === "installation" ? "🔧 Pose" : "📦 Dépose"}
                    </Text>
                    <Text style={localStyles.taskEquipment}>{item.EquipmentType}</Text>
                    <Text style={localStyles.taskQuantity}>Qté: {item.Quantity}</Text>
                </View>
            </View>

            {/* Mini-map avec la ligne GeoJSON */}
            {showMiniMaps && getTaskCenter(item) && (
                <View style={localStyles.miniMapContainer}>
                    <MapView
                        style={localStyles.miniMap}
                        scrollEnabled={false}
                        zoomEnabled={false}
                        rotateEnabled={false}
                        pitchEnabled={false}
                        initialRegion={{
                            ...getTaskCenter(item)!,
                            latitudeDelta: 0.002,
                            longitudeDelta: 0.002,
                        }}
                    >
                        <Polyline
                            coordinates={getTaskCoordinates(item)}
                            strokeWidth={4}
                            strokeColor={getTaskColor(item)}
                        />
                    </MapView>
                </View>
            )}
            <View style={localStyles.taskFooter}>
                <Ionicons name="time-outline" size={16} color="#666" />
                <Text style={localStyles.taskDate}>{formatDate(item.ScheduledDate)}</Text>
                <View style={[
                    localStyles.statusBadge,
                    { backgroundColor: getTaskColor(item) + "20" }
                ]}>
                    <Text style={[localStyles.statusText, { color: getTaskColor(item) }]}>
                        {item.Status === "completed" ? "Terminé" :
                            item.Status === "in_progress" ? "En cours" : "À faire"}
                    </Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    const completedCount = tasks.filter(t => t.Status === "completed").length;
    const progress = tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0;

    return (
        <SafeAreaView style={styles.container}>
            <Header />

            <View style={localStyles.headerSection}>
                <Text style={localStyles.title}>📋 Planning</Text>
                {team && <Text style={localStyles.teamName}>Équipe: {team.Name}</Text>}

                <View style={localStyles.progressContainer}>
                    <View style={localStyles.progressBar}>
                        <View style={[localStyles.progressFill, { width: `${progress}%` }]} />
                    </View>
                    <Text style={localStyles.progressText}>
                        {completedCount}/{tasks.length} tâches terminées
                    </Text>
                </View>
            </View>

            <FlatList
                data={tasks}
                keyExtractor={(item) => item.UUID}
                renderItem={renderTask}
                contentContainerStyle={localStyles.list}
                ListEmptyComponent={
                    <View style={localStyles.emptyContainer}>
                        <Ionicons name="calendar-outline" size={64} color="#ccc" />
                        <Text style={localStyles.emptyText}>Aucune tâche planifiée</Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
}

const localStyles = StyleSheet.create({
    headerSection: {
        padding: 16,
        backgroundColor: "#f5f5f5",
        borderBottomWidth: 1,
        borderBottomColor: "#e0e0e0",
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#333",
    },
    teamName: {
        fontSize: 16,
        color: "#666",
        marginTop: 4,
    },
    progressContainer: {
        marginTop: 12,
    },
    progressBar: {
        height: 8,
        backgroundColor: "#e0e0e0",
        borderRadius: 4,
        overflow: "hidden",
    },
    progressFill: {
        height: "100%",
        backgroundColor: "#43A047",
    },
    progressText: {
        fontSize: 14,
        color: "#666",
        marginTop: 4,
        textAlign: "right",
    },
    list: {
        padding: 16,
    },
    taskCard: {
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    taskHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 12,
    },
    taskNumber: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: "#e0e0e0",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
    },
    taskNumberText: {
        fontSize: 14,
        fontWeight: "bold",
        color: "#333",
    },
    taskInfo: {
        flex: 1,
        marginLeft: 12,
    },
    taskType: {
        fontSize: 16,
        fontWeight: "600",
        color: "#333",
    },
    taskEquipment: {
        fontSize: 14,
        color: "#666",
        marginTop: 2,
    },
    taskQuantity: {
        fontSize: 12,
        color: "#999",
        marginTop: 2,
    },
    taskFooter: {
        flexDirection: "row",
        alignItems: "center",
    },
    taskDate: {
        fontSize: 14,
        color: "#666",
        marginLeft: 4,
        flex: 1,
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 12,
        fontWeight: "600",
    },
    emptyContainer: {
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 64,
    },
    emptyText: {
        fontSize: 16,
        color: "#999",
        marginTop: 16,
    },
    miniMapContainer: {
        marginVertical: 8,
        borderRadius: 8,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: "#e0e0e0",
    },
    miniMap: {
        height: 100,
        width: "100%",
    },
});
