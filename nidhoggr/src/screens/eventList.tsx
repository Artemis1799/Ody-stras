import React, { useEffect, useState } from "react";
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
import { useNavigation } from "@react-navigation/native";
import { useSQLiteContext } from "expo-sqlite";

import { Ionicons } from "@expo/vector-icons";

export function EventListScreen() {
  const navigation = useNavigation<any>();
  const db = useSQLiteContext();

  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getEvents = async () => {
      try {
        const data = await (await db).getAllAsync("SELECT * FROM Evenement");
        console.log(data);
        setEvents(data);
      } catch (err) {
        console.error(err);
        Alert.alert("Erreur DB", "Impossible de récupérer les events.");
      } finally {
        setLoading(false);
      }
    };

    getEvents();
  }, []);
  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.eventItem}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{item.Nom[0].toUpperCase()}</Text>
      </View>
      <Text style={styles.eventName}>{item.Nom}</Text>
      <Ionicons name="chevron-forward-outline" size={20} color="#000" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Image
          source={require("../../ressources/header.png")}
          style={styles.headerImage}
        />
        <Ionicons name="person-circle-outline" size={28} color="white" />
      </View>

      <FlatList
        data={events}
        renderItem={renderItem}
        keyExtractor={(item) => item.UUID}
        contentContainerStyle={styles.listContainer}
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate("AddEvent")}
      >
        <Ionicons name="add" size={30} color="white" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  headerImage: {
    width: "40%",
    height: 30,
    alignSelf: "center",
  },
  container: {
    flex: 1,
    backgroundColor: "#f8f8fc",
  },
  header: {
    backgroundColor: "#9EC54D",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 30,
    paddingBottom: 10,
    paddingLeft: 30,
    paddingRight: 14,
  },
  headerText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 18,
  },
  listContainer: {
    padding: 20,
  },
  eventItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#E5E0FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  avatarText: {
    fontWeight: "bold",
    color: "#6B5EFF",
  },
  eventName: {
    flex: 1,
    fontSize: 16,
  },
  fab: {
    position: "absolute",
    bottom: 25,
    right: 25,
    backgroundColor: "#A6CE39",
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
});
