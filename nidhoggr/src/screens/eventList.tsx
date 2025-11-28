import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  SafeAreaView,
  Alert,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useSQLiteContext } from "expo-sqlite";
import { deleteDatabase } from "../../database/database";

import { Ionicons } from "@expo/vector-icons";
import { Evenement, EventScreenNavigationProp } from "../../types/types";
import { getAll } from "../../database/queries";
import { Strings } from "../../types/strings";
import { useTheme } from "../utils/ThemeContext";
import { getStyles } from "../utils/theme";
import { Header } from "../components/header";

export function EventListScreen() {
  const navigation = useNavigation<EventScreenNavigationProp>();
  const db = useSQLiteContext();
  const [events, setEvents] = useState<Evenement[]>([]);
  const [loading, setLoading] = useState(true);
  const { theme, toggleTheme, colors } = useTheme();
  const styles = getStyles(theme);

  const resetDatabase = async () => {
    try {
      deleteDatabase(db, "base.db");
    } catch (e) {
      console.log(e);
    }
    console.log("Base supprimée !");
  };

  useFocusEffect(
    useCallback(() => {
      const getEvents = async () => {
        try {
          const data = await getAll<Evenement>(db, "Evenement");
          console.log(data);
          setEvents(data);
        } catch (err) {
          console.error(err);
          Alert.alert(
            Strings.errors.dbError,
            Strings.errors.fetchEventsMessage
          );
        } finally {
          setLoading(false);
        }
      };

      getEvents();
    }, [db])
  );
  const renderItem = ({ item }: { item: Evenement }) => (
    <TouchableOpacity
      style={styles.eventItem}
      onPress={() =>
        navigation.navigate("Event", {
          UUID: item.UUID,
          Nom: item.Nom,
          Description: item.Description,
          Date_debut: item.Date_debut,
          Status: item.Status,
        })
      }
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {item.Nom?.[0]?.toUpperCase() ?? "?"}
        </Text>
      </View>

      <Text style={styles.eventName}>{item.Nom}</Text>

      <Ionicons name="chevron-forward-outline" size={20} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Header showBack={false} />

      <FlatList
        data={events}
        renderItem={renderItem}
        keyExtractor={(item) => item.UUID}
        contentContainerStyle={styles.listContainer}
      />
      {/*      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate("AddEvent")}
      >
        <Ionicons name="add" size={30} color="white" />
  </TouchableOpacity>*/}
      <TouchableOpacity style={styles.fab} onPress={toggleTheme}>
        <Ionicons
          name={theme === "light" ? "moon" : "sunny"}
          size={30}
          color={theme === "light" ? "white" : "black"}
        />
      </TouchableOpacity>
    </SafeAreaView>
  );
}
